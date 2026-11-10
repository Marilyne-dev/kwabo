<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\User;
use App\Support\Kw;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserAdminController extends Controller
{
    use FormatsRequests;

    private function state(User $u): string
    {
        return $u->suspended_at ? 'suspended' : ($u->email_verified_at ? 'active' : 'unverified');
    }

    private function row(User $u): array
    {
        return [
            'id' => $u->id, 'full_name' => Kw::name($u), 'email' => $u->email, 'phone' => $u->phone, 'country' => $u->country,
            'state' => $this->state($u), 'referral_code' => $u->referral_code, 'created_at' => $u->created_at,
            'requests_count' => (int) ($u->requests_count ?? $u->serviceRequests()->count()),
            'total_paid' => (float) ($u->total_paid ?? $u->invoices()->where('status', Invoice::PAID)->sum('amount')),
        ];
    }

    private function client(User $user): User
    {
        abort_unless($user->isClient(), 404, 'Client introuvable.');

        return $user;
    }

    // ?q= &state=active|unverified|suspended
    public function index(Request $request): JsonResponse
    {
        $q = User::where('role', User::ROLE_USER)
            ->withCount(['serviceRequests as requests_count'])
            ->withSum(['invoices as total_paid' => fn ($i) => $i->where('status', Invoice::PAID)], 'amount')
            ->when($request->query('state') === 'suspended', fn ($b) => $b->whereNotNull('suspended_at'))
            ->when($request->query('state') === 'unverified', fn ($b) => $b->whereNull('suspended_at')->whereNull('email_verified_at'))
            ->when($request->query('state') === 'active', fn ($b) => $b->whereNull('suspended_at')->whereNotNull('email_verified_at'))
            ->when($request->query('q'), fn ($b, $v) => $b->where(fn ($w) => $w->where('first_name', 'like', "%{$v}%")->orWhere('last_name', 'like', "%{$v}%")->orWhere('email', 'like', "%{$v}%")->orWhere('phone', 'like', "%{$v}%")))
            ->latest();

        $page = $q->paginate(Kw::perPage($request));

        return response()->json([
            'data' => collect($page->items())->map(fn ($u) => $this->row($u))->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    public function show(User $client): JsonResponse
    {
        $this->client($client);
        $invoices = $client->invoices()->latest()->get();
        $requests = $client->serviceRequests()->with(['service.category', 'user', 'operator'])->latest()->get();

        return response()->json(['data' => $this->row($client) + [
            'sponsor' => $client->referrer ? ['id' => $client->referrer->id, 'full_name' => Kw::name($client->referrer), 'referral_code' => $client->referrer->referral_code] : null,
            'stats' => [
                'requests' => $requests->count(),
                'active' => $requests->where('status', 'active')->count(),
                'paid' => (float) $invoices->where('status', Invoice::PAID)->sum('amount'),
                'due' => (float) $invoices->where('status', Invoice::DUE)->sum('amount'),
            ],
            'requests' => $requests->map(fn ($r) => $this->requestRow($r))->values(),
            'invoices' => $invoices->map(fn ($i) => $this->invoiceRow($i))->values(),
        ]]);
    }

    public function suspend(Request $request, User $client): JsonResponse
    {
        $this->client($client);
        $data = $request->validate(['suspended' => ['required', 'boolean']]);

        $client->forceFill(['suspended_at' => $data['suspended'] ? now() : null])->save();
        if ($data['suspended']) {
            $client->tokens()->delete(); // perd l'accès tout de suite, sur tous ses appareils
        }
        Kw::audit($request->user(), 'Compte '.($data['suspended'] ? 'suspendu' : 'réactivé').' : '.Kw::name($client));

        return response()->json(['data' => $this->row($client)]);
    }

    public function resetLink(Request $request, User $client): JsonResponse
    {
        $this->client($client);
        $token = Kw::sendPasswordLink($client);
        Kw::audit($request->user(), 'Lien de mot de passe envoyé à '.Kw::name($client));

        return response()->json(['message' => "Lien valable 1 heure envoyé à {$client->email}.", 'debug_token' => $token]);
    }

    // Droit à l'effacement : retire le compte et toutes ses données. Définitif.
    public function destroy(Request $request, User $client): JsonResponse
    {
        $this->client($client);
        $name = Kw::name($client);
        $ids = $client->serviceRequests()->pluck('id');

        $files = \App\Models\Document::whereIn('service_request_id', $ids)->pluck('path')
            ->merge(\App\Models\Message::whereIn('service_request_id', $ids)->whereNotNull('attachment_path')->pluck('attachment_path'))->filter()->all();

        \Illuminate\Support\Facades\DB::transaction(function () use ($client, $ids) {
            \App\Models\Review::where('user_id', $client->id)->orWhereIn('service_request_id', $ids)->delete();
            Invoice::where('user_id', $client->id)->orWhereIn('service_request_id', $ids)->delete();
            \App\Models\Message::whereIn('service_request_id', $ids)->delete();
            \App\Models\Document::whereIn('service_request_id', $ids)->delete();
            \App\Models\RequestNote::whereIn('service_request_id', $ids)->delete();
            \App\Models\RequestHistory::whereIn('service_request_id', $ids)->delete();
            \App\Models\ServiceRequest::whereIn('id', $ids)->delete();
            \App\Models\AppNotification::where('user_id', $client->id)->delete();
            \App\Models\PaymentMethod::where('user_id', $client->id)->delete();
            \App\Models\AuditLog::where('actor_id', $client->id)->update(['actor_id' => null]);
            User::where('referred_by', $client->id)->update(['referred_by' => null]);
            $client->tokens()->delete();
            $client->delete();
        });

        if ($files) {
            Storage::delete($files);
        }
        Kw::audit($request->user(), "Compte effacé (droit à l'effacement) : {$name}");

        return response()->json(['message' => 'Compte et données effacés.']);
    }

    // Parrainage : parrains, filleuls, convertis (= au moins une mission payée).
    public function referrals(): JsonResponse
    {
        $reward = (float) env('KWABO_REFERRAL_REWARD', 10);

        $rows = User::whereHas('referrals')->with('referrals')->get()->map(function ($s) {
            $list = $s->referrals->map(function ($r) {
                $initial = mb_strtoupper(mb_substr((string) $r->last_name, 0, 1));

                return [
                    'name' => trim($r->first_name.' '.$initial.'.'),
                    'status' => Invoice::where('user_id', $r->id)->where('status', Invoice::PAID)->exists() ? 'Actif' : 'Inscrit',
                    'joined_at' => $r->created_at,
                ];
            })->values();

            return ['sponsor' => ['id' => $s->id, 'full_name' => Kw::name($s), 'referral_code' => $s->referral_code],
                'referrals_count' => $list->count(), 'converted' => $list->where('status', 'Actif')->count(), 'referrals' => $list];
        })->values();

        $converted = $rows->sum('converted');

        return response()->json(['data' => [
            'stats' => ['sponsors' => $rows->count(), 'referrals' => $rows->sum('referrals_count'), 'converted' => $converted, 'rewards' => $converted * $reward],
            'reward_per_referral' => $reward,
            'sponsors' => $rows,
        ]]);
    }
}

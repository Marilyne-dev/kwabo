<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Document;
use App\Models\Invoice;
use App\Models\Review;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Support\Kw;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    use FormatsRequests;

    // Encaissements des N derniers mois (factures payées).
    private function monthly(int $months = 6): array
    {
        return collect(range($months - 1, 0))->map(function ($ago) {
            $from = now()->startOfMonth()->subMonthsNoOverflow($ago);
            $to = (clone $from)->addMonth();

            return [
                'month' => $from->format('Y-m'),
                'label' => $from->locale('fr')->translatedFormat('M'),
                'amount' => (float) Invoice::where('status', Invoice::PAID)->where('paid_at', '>=', $from)->where('paid_at', '<', $to)->sum('amount'),
            ];
        })->values()->all();
    }

    // Ce qui attend une action, avec la raison.
    private function work(User $user): array
    {
        $rows = Kw::requestsFor($user)->whereIn('status', ['pending', 'active'])
            ->with(['service.category', 'user', 'operator'])
            ->withCount(['messages as unread_messages' => fn ($m) => $m->where('sender', 'client')->whereNull('read_at')])
            ->get();

        return $rows->map(function ($r) use ($user) {
            $reasons = [];
            if ($user->isAdmin() && $r->status === 'pending' && $r->quote_amount === null) {
                $reasons[] = ['code' => 'quote_needed', 'label' => 'Devis à préparer'];
            }
            if ($user->isAdmin() && ! $r->operator_id) {
                $reasons[] = ['code' => 'assign_needed', 'label' => 'Agent à attribuer'];
            }
            if ($r->unread_messages) {
                $reasons[] = ['code' => 'unread_messages', 'label' => $r->unread_messages.' message'.($r->unread_messages > 1 ? 's' : '')];
            }
            if ($user->isOperator() && $r->status === 'active' && ! $reasons) {
                $reasons[] = ['code' => 'report_due', 'label' => 'Rapport à déposer'];
            }

            return $reasons ? ['request' => $this->requestRow($r), 'reasons' => $reasons] : null;
        })->filter()->sortByDesc(fn ($w) => $w['request']['urgency'] === 'urgent')->values()->all();
    }

    private function byCategory(): array
    {
        return Category::orderBy('sort_order')->get()->map(fn ($c) => [
            'slug' => $c->slug, 'name' => $c->name, 'short' => $c->short,
            'count' => ServiceRequest::whereHas('service', fn ($s) => $s->where('category_id', $c->id))->count(),
        ])->all();
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isOperator()) {
            $mine = Kw::requestsFor($user);
            $ids = (clone $mine)->pluck('id');

            return response()->json(['data' => [
                'role' => 'operator',
                'stats' => [
                    'assigned' => (clone $mine)->count(),
                    'pending' => (clone $mine)->where('status', 'pending')->count(),
                    'active' => (clone $mine)->where('status', 'active')->count(),
                    'done' => (clone $mine)->where('status', 'done')->count(),
                ],
                'work' => $this->work($user),
                'recent_documents' => Document::whereIn('service_request_id', $ids)->latest()->limit(4)->get()->map(fn ($d) => $this->docRow($d))->values(),
            ]]);
        }

        $month = now()->startOfMonth();

        return response()->json(['data' => [
            'role' => 'admin',
            'stats' => [
                'quotes_to_prepare' => ServiceRequest::where('status', 'pending')->whereNull('quote_amount')->count(),
                'active_missions' => ServiceRequest::where('status', 'active')->count(),
                'revenue_month' => (float) Invoice::where('status', Invoice::PAID)->where('paid_at', '>=', $month)->sum('amount'),
                'awaiting_payment' => (float) Invoice::where('status', Invoice::DUE)->sum('amount'),
            ],
            'work' => $this->work($user),
            'revenue' => $this->monthly(6),
            'by_category' => $this->byCategory(),
            'operator_load' => User::where('role', User::ROLE_OPERATOR)->get()->map(fn ($o) => [
                'id' => $o->id, 'full_name' => Kw::name($o),
                'active' => ServiceRequest::where('operator_id', $o->id)->where('status', 'active')->count(),
            ])->values(),
            'recent_activity' => AuditLog::with('actor')->latest()->limit(4)->get()->map(fn ($j) => [
                'at' => $j->created_at, 'actor' => Kw::name($j->actor) ?? 'Système', 'text' => $j->text,
            ])->values(),
        ]]);
    }

    // Page « Indicateurs » : valeurs actuelles, objectifs à 6 et 12 mois.
    public function kpis(): JsonResponse
    {
        $paid = Invoice::where('status', Invoice::PAID);
        $ratings = Review::pluck('rating');

        $values = [
            'accounts' => User::where('role', User::ROLE_USER)->count(),
            'payers' => (clone $paid)->where('paid_at', '>=', now()->subDays(90))->distinct('user_id')->count('user_id'),
            'requests' => ServiceRequest::count(),
            'revenue' => (float) (clone $paid)->where('paid_at', '>=', now()->startOfMonth())->sum('amount'),
            'rating' => $ratings->count() ? round($ratings->avg(), 2) : 0,
        ];

        $targets = [
            'accounts' => ['Comptes créés', 150, 500], 'payers' => ['Clients actifs payants', 12, 40],
            'requests' => ['Demandes de service', 50, 200], 'revenue' => ['CA mensuel net', 500, 1500],
            'rating' => ['Note de satisfaction (sur 5)', 4.2, 4.5],
        ];

        return response()->json(['data' => [
            'indicators' => collect($targets)->map(fn ($t, $key) => [
                'key' => $key, 'label' => $t[0], 'current' => $values[$key], 'target_m6' => $t[1], 'target_m12' => $t[2],
                'progress_m6' => (int) min(100, round($values[$key] / $t[1] * 100)),
            ])->values(),
            'revenue' => $this->monthly(6),
            'average_invoice' => round((float) (clone $paid)->avg('amount'), 2),
            'total_collected' => (float) (clone $paid)->sum('amount'),
            'by_category' => $this->byCategory(),
        ]]);
    }
}

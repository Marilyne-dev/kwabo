<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Invoice;
use App\Models\RequestNote;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Support\Kw;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class RequestAdminController extends Controller
{
    use FormatsRequests;

    // Liste (tableau ou Kanban) : ?q= &status= &operator=none|id &category=slug &urgency= &page= &per_page=
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'active', 'done', 'cancelled'])],
            'urgency' => ['nullable', Rule::in(['normal', 'urgent'])],
        ]);

        $from = 'client';
        $q = Kw::requestsFor($user)
            ->with(['service.category', 'user', 'operator'])
            ->withCount(['messages as unread_messages' => fn ($m) => $m->where('sender', $from)->whereNull('read_at')])
            ->when($request->query('status'), fn ($b, $v) => $b->where('status', $v))
            ->when($request->query('urgency'), fn ($b, $v) => $b->where('urgency', $v))
            ->when($request->query('category'), fn ($b, $v) => $b->whereHas('service.category', fn ($c) => $c->where('slug', $v)))
            ->when($user->isAdmin() ? $request->query('operator') : null, function ($b, $v) {
                $v === 'none' ? $b->whereNull('operator_id') : $b->where('operator_id', (int) $v);
            })
            ->when($request->query('q'), function ($b, $v) {
                $b->where(function ($w) use ($v) {
                    $w->where('title', 'like', "%{$v}%")->orWhere('tracking', 'like', "%{$v}%")
                        ->orWhereHas('user', fn ($u) => $u->where('first_name', 'like', "%{$v}%")->orWhere('last_name', 'like', "%{$v}%")->orWhere('email', 'like', "%{$v}%"));
                });
            })
            ->latest();

        $page = $q->paginate(Kw::perPage($request));

        return response()->json([
            'data' => collect($page->items())->map(fn ($r) => $this->requestRow($r))->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(), 'per_page' => $page->perPage()],
        ]);
    }

    public function show(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        Gate::authorize('view', $serviceRequest);

        return response()->json(['data' => $this->requestRow($this->loadDetail($serviceRequest), true)]);
    }

    // Changer le statut : l'admin, ou l'agent à qui la demande est attribuée.
    public function status(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($request->user()->isAdmin() || ($request->user()->isOperator() && $serviceRequest->operator_id === $request->user()->id), 403, 'Accès refusé.');
        $data = $request->validate(['status' => ['required', Rule::in(['pending', 'active', 'done', 'cancelled'])]]);
        $status = $data['status'];

        if ($status !== $serviceRequest->status) {
            DB::transaction(function () use ($serviceRequest, $status, $request) {
                $serviceRequest->update(['status' => $status]);
                $label = Kw::statusLabel($status);
                $serviceRequest->log("Statut : {$label}");
                Kw::audit($request->user(), "Statut de « {$serviceRequest->title} » : {$label}");

                if ($status === 'cancelled') {
                    $serviceRequest->invoices()->where('status', Invoice::DUE)->update(['status' => Invoice::CANCELLED]);
                }
            });

            if ($status === 'done') {
                Kw::notify($serviceRequest->user_id, "Mission terminée : « {$serviceRequest->title} »", "/requests/{$serviceRequest->id}", 'done');
            } elseif ($status === 'active') {
                Kw::notify($serviceRequest->user_id, "Votre mission « {$serviceRequest->title} » a démarré.", "/requests/{$serviceRequest->id}", 'started');
            }
        }

        return response()->json(['data' => $this->requestRow($this->loadDetail($serviceRequest->fresh()), true)]);
    }

    // Attribuer à un agent (ou retirer avec operator_id = null). Admin seulement.
    public function assign(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        $data = $request->validate(['operator_id' => ['nullable', Rule::exists('users', 'id')->where('role', User::ROLE_OPERATOR)]]);
        $operator = $data['operator_id'] ? User::find($data['operator_id']) : null;
        $title = $serviceRequest->title;

        $serviceRequest->update(['operator_id' => $operator?->id]);
        $serviceRequest->log($operator ? 'Attribuée à '.Kw::name($operator) : 'Attribution retirée');
        Kw::audit($request->user(), $operator ? "Attribution de « {$title} » à ".Kw::name($operator) : "Attribution retirée sur « {$title} »");

        if ($operator) {
            Kw::notify($operator, "Nouvelle mission : « {$title} »", "/admin/requests/{$serviceRequest->id}");
        }

        return response()->json(['data' => $this->requestRow($this->loadDetail($serviceRequest->fresh()), true)]);
    }

    // Envoyer un devis : crée la facture « à payer » et remplace l'ancienne.
    public function quote(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:1000000'],
            'label' => ['nullable', 'string', 'max:150'],
        ], ['amount.required' => 'Saisissez un montant.', 'amount.min' => 'Le montant doit être supérieur à 0.']);

        abort_if(in_array($serviceRequest->status, ['done', 'cancelled'], true), 422, 'Cette demande est terminée ou annulée.');

        $amount = round((float) $data['amount'], 2);
        $label = $data['label'] ?? $serviceRequest->service?->name ?? $serviceRequest->title;

        DB::transaction(function () use ($serviceRequest, $amount, $label, $request) {
            $serviceRequest->update(['quote_amount' => $amount, 'quote_label' => $label]);
            $serviceRequest->log("Devis envoyé : {$amount} €");
            Kw::audit($request->user(), "Devis de {$amount} € envoyé pour « {$serviceRequest->title} »");
            $serviceRequest->invoices()->where('status', Invoice::DUE)->update(['status' => Invoice::CANCELLED]);
            Invoice::create([
                'number' => Kw::invoiceNumber(), 'service_request_id' => $serviceRequest->id, 'user_id' => $serviceRequest->user_id,
                'label' => $label, 'amount' => $amount, 'status' => Invoice::DUE,
            ]);
        });

        Kw::notify($serviceRequest->user_id, "Devis reçu pour « {$serviceRequest->title} » : {$amount} €", "/requests/{$serviceRequest->id}", 'quote');

        return response()->json(['data' => $this->requestRow($this->loadDetail($serviceRequest->fresh()), true)], 201);
    }

    // Déposer un document (rapport, photo, vidéo, reçu, contrat).
    public function document(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        abort_unless($request->user()->isAdmin() || ($request->user()->isOperator() && $serviceRequest->operator_id === $request->user()->id), 403, 'Accès refusé.');
        $data = $request->validate([
            'type' => ['required', Rule::in(['report', 'photo', 'video', 'receipt', 'contract'])],
            'name' => ['nullable', 'string', 'max:150'],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,mp4,mov,doc,docx', 'max:20480'],
        ], ['file.required' => 'Choisissez un fichier.', 'file.mimes' => 'Format accepté : PDF, JPG, PNG, MP4, MOV, DOC, DOCX.']);

        $file = $request->file('file');
        $path = $file->store("documents/{$serviceRequest->id}");
        $name = $data['name'] ?? $file->getClientOriginalName();

        $doc = Document::create([
            'service_request_id' => $serviceRequest->id, 'uploaded_by' => $request->user()->id,
            'type' => $data['type'], 'name' => $name, 'path' => $path,
        ]);

        Kw::audit($request->user(), "Document ajouté à « {$serviceRequest->title} » : {$name}");

        if ($data['type'] === 'report') {
            $serviceRequest->log('Rapport hebdomadaire disponible');
            Kw::notify($serviceRequest->user_id, "Rapport hebdomadaire disponible pour « {$serviceRequest->title} »", "/requests/{$serviceRequest->id}", 'report');
        }

        return response()->json(['data' => $this->docRow($doc)], 201);
    }

    // Note interne (jamais visible par le client).
    public function note(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        Gate::authorize('view', $serviceRequest);
        $data = $request->validate(['text' => ['required', 'string', 'max:2000']], ['text.required' => 'Écrivez votre note.']);

        $note = RequestNote::create(['service_request_id' => $serviceRequest->id, 'author_id' => $request->user()->id, 'text' => $data['text']]);

        return response()->json(['data' => ['at' => $note->created_at, 'author' => Kw::name($request->user()), 'text' => $note->text]], 201);
    }
}

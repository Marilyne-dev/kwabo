<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceRequestRequest;
use App\Http\Resources\ServiceRequestResource;
use App\Models\AppNotification;
use App\Models\Invoice;
use App\Models\Service;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use App\Models\Message;

class ServiceRequestController extends Controller
{
    // Mes demandes (filtre facultatif : ?status=pending|active|done|cancelled).
       // Mes demandes. Filtres facultatifs : ?status=pending|active|done|cancelled, ?search=mot, ?per_page=20
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'active', 'done', 'cancelled'])],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $search = trim((string) $request->query('search', ''));

        $requests = $request->user()->serviceRequests()
            ->with(['service.category', 'operator'])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $like = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';

                $q->where(fn ($w) => $w
                    ->where('title', 'like', $like)
                    ->orWhere('tracking', 'like', $like)
                    ->orWhere('city', 'like', $like)
                    ->orWhereHas('service', fn ($s) => $s->where('name', 'like', $like)));
            })
            ->latest()
            ->paginate((int) $request->query('per_page', 20));

        return ServiceRequestResource::collection($requests);
    }

     private const DETAIL_RELATIONS = ['service.category', 'operator', 'histories', 'documents', 'invoices', 'review'];

    public function store(StoreServiceRequestRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        $service = Service::where('slug', $data['service'])->where('available', true)->firstOrFail();

        $serviceRequest = DB::transaction(function () use ($request, $data, $user, $service) {
            $serviceRequest = $user->serviceRequests()->create([
                'service_id' => $service->id,
                'title' => $data['title'] ?? $service->name,
                'city' => $data['city'] ?? null,
                'urgency' => $data['urgency'] ?? 'normal',
                'budget' => $data['budget'] ?? null,
                'description' => $data['description'] ?? null,
                'details' => $data['details'] ?? [],
            ])->refresh();

            $serviceRequest->log('Demande reçue');

            // Fichiers joints (ex. ordonnance) : stockés en privé, listés dans les documents.
            foreach ($request->file('files', []) as $file) {
                $serviceRequest->documents()->create([
                    'uploaded_by' => $user->id,
                    'type' => 'attachment',
                    'name' => $file->getClientOriginalName(),
                    'path' => $file->store("requests/{$serviceRequest->id}", 'local'),
                ]);
            }

            return $serviceRequest;
        });

        AppNotification::create([
            'user_id' => $user->id,
            'text' => "Demande reçue : « {$serviceRequest->title} ». Numéro de suivi {$serviceRequest->tracking}.",
            'link' => "/requests/{$serviceRequest->id}",
        ]);

        AppNotification::create([
            'user_id' => null, // notification pour toute l'équipe
            'text' => ($serviceRequest->urgency === 'urgent' ? 'Nouvelle demande urgente' : 'Nouvelle demande')." : « {$serviceRequest->title} »",
            'link' => "/admin/requests/{$serviceRequest->id}",
        ]);

        return (new ServiceRequestResource($serviceRequest->load(self::DETAIL_RELATIONS)))
            ->response()
            ->setStatusCode(201);
    }

       public function show(ServiceRequest $serviceRequest): ServiceRequestResource
    {
        Gate::authorize('view', $serviceRequest);

        $serviceRequest->load(self::DETAIL_RELATIONS)->loadCount([
            'messages as unread_messages' => fn ($q) => $q->where('sender', Message::FROM_TEAM)->whereNull('read_at'),
        ]);

        return new ServiceRequestResource($serviceRequest);
    }

    public function cancel(ServiceRequest $serviceRequest): ServiceRequestResource
    {
        Gate::authorize('cancel', $serviceRequest);

        abort_unless(
            in_array($serviceRequest->status, [ServiceRequest::PENDING, ServiceRequest::ACTIVE], true),
            422,
            'Cette demande ne peut plus être annulée.'
        );

        DB::transaction(function () use ($serviceRequest) {
            $serviceRequest->update(['status' => ServiceRequest::CANCELLED]);
            $serviceRequest->log('Demande annulée par le client');
            $serviceRequest->invoices()
                ->where('status', Invoice::DUE)
                ->update(['status' => Invoice::CANCELLED]);
        });

                return new ServiceRequestResource($serviceRequest->fresh(self::DETAIL_RELATIONS));
    }
}
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

class ServiceRequestController extends Controller
{
    // Mes demandes (filtre facultatif : ?status=pending|active|done|cancelled).
    public function index(Request $request): AnonymousResourceCollection
    {
        $requests = $request->user()->serviceRequests()
            ->with(['service.category', 'operator'])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->latest()
            ->paginate(20);

        return ServiceRequestResource::collection($requests);
    }

    public function store(StoreServiceRequestRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        $service = Service::where('slug', $data['service'])->where('available', true)->firstOrFail();

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

        return (new ServiceRequestResource($serviceRequest->load(['service.category', 'histories'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(ServiceRequest $serviceRequest): ServiceRequestResource
    {
        Gate::authorize('view', $serviceRequest);

        return new ServiceRequestResource($serviceRequest->load(['service.category', 'operator', 'histories']));
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

        return new ServiceRequestResource($serviceRequest->fresh(['service.category', 'operator', 'histories']));
    }
}
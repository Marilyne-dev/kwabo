<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\ServiceRequestResource;
use App\Http\Resources\ServiceResource;
use App\Models\AppNotification;
use App\Models\Document;
use App\Models\Invoice;
use App\Models\Message;
use App\Models\Review;
use App\Models\Service;
use App\Support\Kw;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    // Pastilles de la barre latérale : messages non lus, notifications non lues, factures à payer.
    public function counters(Request $request): JsonResponse
    {
        $user = $request->user();
        $from = $user->isClient() ? 'team' : 'client';
        $ids = Kw::requestsFor($user)->pluck('id');

        $notifications = AppNotification::where(function ($q) use ($user) {
            $q->where('user_id', $user->id);
            if ($user->isAdmin()) {
                $q->orWhereNull('user_id');
            }
        })->whereNull('read_at')->count();

        $data = [
            'unread_messages' => Message::whereIn('service_request_id', $ids)->where('sender', $from)->whereNull('read_at')->count(),
            'unread_notifications' => $notifications,
        ];

        if ($user->isClient()) {
            $data['due_invoices'] = Invoice::where('user_id', $user->id)->where('status', Invoice::DUE)->count();
        }

        if ($user->isAdmin()) {
            $data['pending_reviews'] = Review::where('status', Review::PENDING)->count();
        }

        return response()->json(['data' => $data]);
    }

    // Tableau de bord du client (site et application mobile).
    public function client(Request $request): JsonResponse
    {
        $user = $request->user();
        $requests = $user->serviceRequests()->with(['service.category', 'operator'])->latest();

        $active = (clone $requests)->where('status', 'active')->first();
        $docIds = $user->serviceRequests()->pluck('id');

        $media = $active
            ? Document::where('service_request_id', $active->id)->whereIn('type', ['photo', 'video'])->latest()->limit(6)->get()
            : collect();

        return response()->json(['data' => [
            'recent_requests' => ServiceRequestResource::collection((clone $requests)->limit(3)->get())->resolve(),
            'active_mission' => $active ? [
                'request' => (new ServiceRequestResource($active))->resolve(),
                'media' => DocumentResource::collection($media)->resolve(),
            ] : null,
            'due_invoices' => InvoiceResource::collection(
                Invoice::where('user_id', $user->id)->where('status', Invoice::DUE)->with('serviceRequest')->latest()->get()
            )->resolve(),
            'notifications' => AppNotification::where('user_id', $user->id)->whereNull('read_at')->latest()->limit(5)->get()
                ->map(fn ($n) => ['id' => $n->id, 'text' => $n->text, 'link' => $n->link, 'at' => $n->created_at])->values(),
            'recent_documents' => DocumentResource::collection(
                Document::whereIn('service_request_id', $docIds)->with('serviceRequest')->latest()->limit(3)->get()
            )->resolve(),
            'popular_services' => ServiceResource::collection(
                Service::where('popular', true)->where('available', true)->with('category')->limit(4)->get()
            )->resolve(),
        ]]);
    }
}

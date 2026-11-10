<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Models\AppNotification;
use App\Models\Message;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MessageController extends Controller
{
    // Messagerie : un fil par demande, le plus récent d'abord. Marche pour le client, l'agent et l'admin.
    public function threads(Request $request): JsonResponse
    {
        $user = $request->user();
        $incoming = $user->isClient() ? Message::FROM_TEAM : Message::FROM_CLIENT;

        $threads = $user->visibleRequests()
            ->with(['service.category', 'latestMessage.author'])
            ->withCount(['messages as unread_count' => fn ($q) => $q->where('sender', $incoming)->whereNull('read_at')])
            ->latest('id')
            ->get()
            ->sortByDesc(fn ($r) => $r->latestMessage?->created_at?->timestamp ?? 0)
            ->values();

        return response()->json([
            'data' => $threads->map(fn ($r) => [
                'request_id' => $r->id,
                'tracking' => $r->tracking,
                'title' => $r->title,
                'status' => $r->status,
                'service' => $r->service ? [
                    'slug' => $r->service->slug,
                    'name' => $r->service->name,
                    'icon' => $r->service->icon,
                    'category' => $r->service->category?->slug,
                ] : null,
                'last_message' => $r->latestMessage ? (new MessageResource($r->latestMessage))->resolve() : null,
                'unread' => (int) $r->unread_count,
            ]),
            'meta' => ['unread_total' => (int) $threads->sum('unread_count')],
        ]);
    }

    // Les messages d'une demande, du plus ancien au plus récent.
    public function index(ServiceRequest $serviceRequest): AnonymousResourceCollection
    {
        Gate::authorize('view', $serviceRequest);

        return MessageResource::collection($serviceRequest->messages()->with('author')->oldest('id')->get());
    }

    // Envoyer un message (texte et/ou pièce jointe, en multipart/form-data).
    public function store(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        Gate::authorize('view', $serviceRequest);

        abort_if(
            $serviceRequest->status === ServiceRequest::CANCELLED,
            422,
            'Cette demande est annulée : la discussion est fermée.'
        );

        $data = $request->validate([
            'text' => ['nullable', 'string', 'max:5000', 'required_without:attachment'],
            'attachment' => ['nullable', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png', 'required_without:text'],
        ], [
            'text.required_without' => 'Écrivez un message ou joignez un fichier.',
            'attachment.required_without' => 'Écrivez un message ou joignez un fichier.',
            'attachment.mimes' => 'Le fichier doit être un PDF, JPG ou PNG.',
            'attachment.max' => 'Le fichier ne doit pas dépasser 10 Mo.',
        ]);

        $user = $request->user();
        $file = $request->file('attachment');

        $message = $serviceRequest->messages()->create([
            'sender' => $user->isClient() ? Message::FROM_CLIENT : Message::FROM_TEAM,
            'author_id' => $user->id,
            'text' => trim($data['text'] ?? ''),
            'attachment_name' => $file?->getClientOriginalName(),
            'attachment_path' => $file?->store("messages/{$serviceRequest->id}", 'local'),
        ]);

        if ($user->isClient()) {
            $text = "Message de {$user->full_name} sur « {$serviceRequest->title} »";

            AppNotification::create(['user_id' => null, 'text' => $text, 'link' => "/admin/requests/{$serviceRequest->id}"]);

            if ($serviceRequest->operator_id) {
                AppNotification::create(['user_id' => $serviceRequest->operator_id, 'text' => $text, 'link' => "/admin/requests/{$serviceRequest->id}"]);
            }
        } else {
            AppNotification::create([
                'user_id' => $serviceRequest->user_id,
                'text' => "Nouveau message sur « {$serviceRequest->title} »",
                'link' => "/requests/{$serviceRequest->id}",
            ]);
        }

        return (new MessageResource($message->load('author')))->response()->setStatusCode(201);
    }

    // Marque comme lus les messages reçus de l'autre côté (à appeler quand on ouvre le fil).
    public function markRead(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        Gate::authorize('view', $serviceRequest);

        $mine = $request->user()->isClient() ? Message::FROM_CLIENT : Message::FROM_TEAM;

        $updated = $serviceRequest->messages()
            ->where('sender', '!=', $mine)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['updated' => $updated]);
    }

    // Télécharger la pièce jointe d'un message (fichier privé).
    public function attachment(Message $message): StreamedResponse
    {
        Gate::authorize('view', $message->serviceRequest);

        abort_unless(
            $message->attachment_path && Storage::disk('local')->exists($message->attachment_path),
            404,
            'Fichier introuvable.'
        );

        return Storage::disk('local')->download($message->attachment_path, $message->attachment_name);
    }
}
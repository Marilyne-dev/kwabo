<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    // Mes documents, groupés par demande (les demandes sans document n'apparaissent pas).
    public function index(Request $request): JsonResponse
    {
        $requests = $request->user()->serviceRequests()
            ->whereHas('documents')
            ->with(['documents' => fn ($q) => $q->latest()])
            ->latest()
            ->get();

        return response()->json([
            'data' => $requests->map(fn ($r) => [
                'request' => ['id' => $r->id, 'tracking' => $r->tracking, 'title' => $r->title],
                'documents' => DocumentResource::collection($r->documents)->resolve(),
            ]),
        ]);
    }

    public function download(Document $document): StreamedResponse
    {
        Gate::authorize('view', $document->serviceRequest);

        abort_unless(Storage::disk('local')->exists($document->path), 404, 'Fichier introuvable.');

        return Storage::disk('local')->download($document->path, $document->name);
    }
}
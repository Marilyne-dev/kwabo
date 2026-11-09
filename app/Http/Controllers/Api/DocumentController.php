<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function download(Document $document): StreamedResponse
    {
        Gate::authorize('view', $document->serviceRequest);

        abort_unless(Storage::disk('local')->exists($document->path), 404, 'Fichier introuvable.');

        return Storage::disk('local')->download($document->path, $document->name);
    }
}
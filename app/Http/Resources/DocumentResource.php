<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Document */
class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type, // report, photo, video, receipt, contract, ou attachment (pièce jointe du client)
            'name' => $this->name,
            'created_at' => $this->created_at,
            'url' => url("/api/documents/{$this->id}/download"),
        ];
    }
}
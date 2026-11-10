<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Message */
class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'from' => $this->sender, // "client" ou "team"
            'author' => $this->author?->full_name ?? 'Équipe KWABO',
            'text' => $this->text,
            'attachment' => $this->attachment_name ? [
                'name' => $this->attachment_name,
                'url' => url("/api/messages/{$this->id}/attachment"),
            ] : null,
            'at' => $this->created_at,
            'read' => $this->read_at !== null,
        ];
    }
}
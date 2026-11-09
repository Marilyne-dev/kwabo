<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ServiceRequest */
class ServiceRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tracking' => $this->tracking,
            'status' => $this->status,
            'title' => $this->title,
            'city' => $this->city,
            'urgency' => $this->urgency,
            'budget' => $this->budget,
            'description' => $this->description,
            'details' => $this->details,
            'quote' => $this->quote_amount !== null
                ? ['amount' => (float) $this->quote_amount, 'label' => $this->quote_label]
                : null,
            'rating' => $this->rating,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'service' => $this->whenLoaded('service', fn () => new ServiceResource($this->service)),
            'operator' => $this->whenLoaded('operator', fn () => $this->operator
                ? ['id' => $this->operator->id, 'full_name' => $this->operator->full_name]
                : null),
            'history' => $this->whenLoaded('histories', fn () => $this->histories->map(fn ($h) => [
                'at' => $h->created_at,
                'text' => $h->text,
            ])),
        ];
    }
}
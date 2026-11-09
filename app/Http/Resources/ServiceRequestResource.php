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
            'documents' => $this->whenLoaded('documents', fn () => $this->documents->map(fn ($d) => [
                'id' => $d->id,
                'type' => $d->type,
                'name' => $d->name,
                'created_at' => $d->created_at,
                'url' => url("/api/documents/{$d->id}/download"),
            ])),
            // Facture à payer (le devis accepté) : la plus récente encore due.
            'invoice_due' => $this->whenLoaded('invoices', function () {
                $due = $this->invoices->where('status', 'due')->sortByDesc('id')->first();

                return $due ? new InvoiceResource($due) : null;
            }),
            'invoices' => $this->whenLoaded('invoices', fn () => InvoiceResource::collection($this->invoices)),
            'review' => $this->whenLoaded('review', fn () => $this->review ? [
                'rating' => $this->review->rating,
                'comment' => $this->review->comment,
                'status' => $this->review->status,
                'created_at' => $this->review->created_at,
            ] : null),
        ];
    }
}
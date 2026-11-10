<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Invoice */
class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'label' => $this->label,
            'amount' => (float) $this->amount,
            'status' => $this->status, // due, paid, refunded, cancelled
            'method' => $this->method, // card, momo, wise
            'paid_at' => $this->paid_at,
            'created_at' => $this->created_at,
            'request' => $this->whenLoaded('serviceRequest', fn () => [
                'id' => $this->serviceRequest->id,
                'tracking' => $this->serviceRequest->tracking,
                'title' => $this->serviceRequest->title,
                'status' => $this->serviceRequest->status,
            ]),
        ];
    }
}
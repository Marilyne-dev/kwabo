<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Service */
class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'price_label' => $this->price_label,
            'short' => $this->short,
            'included' => $this->included,
            'form_fields' => $this->form_fields,
            'icon' => $this->icon,
            'popular' => $this->popular,
            'available' => $this->available,
            'category' => $this->whenLoaded('category', fn () => [
                'slug' => $this->category->slug,
                'name' => $this->category->name,
            ]),
        ];
    }
}
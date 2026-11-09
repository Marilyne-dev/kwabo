<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'country' => $this->country,
            'role' => $this->role,
            'email_verified' => $this->email_verified_at !== null,
            'two_factor_enabled' => $this->two_factor_enabled,
            'referral_code' => $this->referral_code,
            'notification_prefs' => $this->notification_prefs,
            'created_at' => $this->created_at,
        ];
    }
}
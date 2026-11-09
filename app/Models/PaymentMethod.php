<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentMethod extends Model
{
    protected $fillable = ['user_id', 'type', 'label', 'provider_token'];

    protected $hidden = ['provider_token'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
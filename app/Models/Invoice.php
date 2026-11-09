<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    public const DUE = 'due';
    public const PAID = 'paid';
    public const REFUNDED = 'refunded';
    public const CANCELLED = 'cancelled';

    protected $fillable = [
        'number', 'service_request_id', 'user_id', 'label',
        'amount', 'status', 'method', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function serviceRequest(): BelongsTo { return $this->belongsTo(ServiceRequest::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
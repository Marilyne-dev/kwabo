<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ServiceRequest extends Model
{
    public const PENDING = 'pending';
    public const ACTIVE = 'active';
    public const DONE = 'done';
    public const CANCELLED = 'cancelled';

    protected $fillable = [
        'tracking', 'user_id', 'service_id', 'operator_id', 'status', 'title', 'city',
        'urgency', 'budget', 'description', 'details', 'quote_amount', 'quote_label', 'rating',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'quote_amount' => 'decimal:2',
        ];
    }

    // Génère le numéro de suivi (ex. KW-2026-0001) juste après la création.
    protected static function booted(): void
    {
        static::created(function (self $request) {
            if (! $request->tracking) {
                $request->forceFill([
                    'tracking' => sprintf('KW-%d-%04d', $request->created_at->year, $request->id),
                ])->saveQuietly();
            }
        });
    }

    // Ajoute une ligne à l'historique de la demande.
    public function log(string $text): RequestHistory
    {
        return $this->histories()->create(['text' => $text]);
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function operator(): BelongsTo { return $this->belongsTo(User::class, 'operator_id'); }
    public function service(): BelongsTo { return $this->belongsTo(Service::class); }
    public function histories(): HasMany { return $this->hasMany(RequestHistory::class); }
    public function notes(): HasMany { return $this->hasMany(RequestNote::class); }
    public function documents(): HasMany { return $this->hasMany(Document::class); }
    public function messages(): HasMany { return $this->hasMany(Message::class); }
    public function invoices(): HasMany { return $this->hasMany(Invoice::class); }
    public function review(): HasOne { return $this->hasOne(Review::class); }
        public function latestMessage(): HasOne { return $this->hasOne(Message::class)->latestOfMany(); }
}
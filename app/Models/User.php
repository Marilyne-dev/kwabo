<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_USER = 'user';
    public const ROLE_OPERATOR = 'operator';
    public const ROLE_ADMIN = 'admin';

    // « role » et « suspended_at » ne sont volontairement pas ici : on les définit à la main.
    protected $fillable = [
        'first_name', 'last_name', 'email', 'phone', 'country', 'password',
        'two_factor_enabled', 'referral_code', 'referred_by', 'notification_prefs',
    ];

       protected $hidden = ['password', 'remember_token', 'two_factor_secret'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'suspended_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_enabled' => 'boolean',
            'notification_prefs' => 'array',
               'two_factor_secret' => 'encrypted',
        ];
    }

    protected function fullName(): Attribute
    {
        return Attribute::get(fn () => trim("{$this->first_name} {$this->last_name}"));
    }

    public function isClient(): bool { return $this->role === self::ROLE_USER; }
    public function isOperator(): bool { return $this->role === self::ROLE_OPERATOR; }
    public function isAdmin(): bool { return $this->role === self::ROLE_ADMIN; }
    public function isSuspended(): bool { return $this->suspended_at !== null; }

    public function serviceRequests(): HasMany { return $this->hasMany(ServiceRequest::class); }
    public function assignedRequests(): HasMany { return $this->hasMany(ServiceRequest::class, 'operator_id'); }
    public function invoices(): HasMany { return $this->hasMany(Invoice::class); }
    public function reviews(): HasMany { return $this->hasMany(Review::class); }
    public function paymentMethods(): HasMany { return $this->hasMany(PaymentMethod::class); }
    public function appNotifications(): HasMany { return $this->hasMany(AppNotification::class); }
    public function referrer(): BelongsTo { return $this->belongsTo(User::class, 'referred_by'); }
    public function referrals(): HasMany { return $this->hasMany(User::class, 'referred_by'); }
        // Les demandes que cette personne a le droit de voir.
    public function visibleRequests(): \Illuminate\Database\Eloquent\Builder
    {
        return match (true) {
            $this->isAdmin() => ServiceRequest::query(),
            $this->isOperator() => ServiceRequest::where('operator_id', $this->id),
            default => ServiceRequest::where('user_id', $this->id),
        };
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    public const PENDING = 'pending';
    public const PUBLISHED = 'published';
    public const HIDDEN = 'hidden';

    protected $fillable = ['service_request_id', 'user_id', 'rating', 'comment', 'status'];

    public function serviceRequest(): BelongsTo { return $this->belongsTo(ServiceRequest::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
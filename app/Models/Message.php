<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    public const FROM_TEAM = 'team';
    public const FROM_CLIENT = 'client';

    protected $fillable = [
        'service_request_id', 'sender', 'author_id', 'text',
        'attachment_name', 'attachment_path', 'read_at',
    ];

    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }

    public function serviceRequest(): BelongsTo { return $this->belongsTo(ServiceRequest::class); }
    public function author(): BelongsTo { return $this->belongsTo(User::class, 'author_id'); }
}
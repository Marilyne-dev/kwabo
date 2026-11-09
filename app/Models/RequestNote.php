<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestNote extends Model
{
    protected $fillable = ['service_request_id', 'author_id', 'text'];

    public function serviceRequest(): BelongsTo { return $this->belongsTo(ServiceRequest::class); }
    public function author(): BelongsTo { return $this->belongsTo(User::class, 'author_id'); }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    public const TYPES = ['report', 'photo', 'video', 'receipt', 'contract'];

    protected $fillable = ['service_request_id', 'uploaded_by', 'type', 'name', 'path'];

    public function serviceRequest(): BelongsTo { return $this->belongsTo(ServiceRequest::class); }
    public function uploader(): BelongsTo { return $this->belongsTo(User::class, 'uploaded_by'); }
}
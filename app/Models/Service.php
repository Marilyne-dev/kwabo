<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $fillable = [
        'slug', 'category_id', 'name', 'price_label', 'short',
        'included', 'form_fields', 'icon', 'popular', 'available',
    ];

    protected function casts(): array
    {
        return [
            'included' => 'array',
            'form_fields' => 'array',
            'popular' => 'boolean',
            'available' => 'boolean',
        ];
    }

    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function requests(): HasMany { return $this->hasMany(ServiceRequest::class); }
}
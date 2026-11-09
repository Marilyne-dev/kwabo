<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = ['slug', 'name', 'short', 'blurb', 'icon', 'sort_order'];

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }
}
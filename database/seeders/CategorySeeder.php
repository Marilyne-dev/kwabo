<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $catalog = json_decode(file_get_contents(database_path('seeders/data/catalog.json')), true);

        foreach ($catalog['categories'] as $category) {
            Category::updateOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
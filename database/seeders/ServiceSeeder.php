<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = json_decode(file_get_contents(database_path('seeders/data/catalog.json')), true);

        foreach ($catalog['services'] as $service) {
            $category = Category::where('slug', $service['category'])->firstOrFail();
            unset($service['category']);

            Service::updateOrCreate(
                ['slug' => $service['slug']],
                $service + ['category_id' => $category->id]
            );
        }
    }
}
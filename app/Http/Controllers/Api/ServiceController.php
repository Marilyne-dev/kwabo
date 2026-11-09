<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Category;
use App\Models\Service;
use Illuminate\Http\JsonResponse;

class ServiceController extends Controller
{
    // Catalogue complet : catégories avec leurs services disponibles.
    public function catalog(): JsonResponse
    {
        $categories = Category::with(['services' => fn ($q) => $q->where('available', true)->orderBy('id')])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'data' => $categories->map(fn ($category) => [
                'slug' => $category->slug,
                'name' => $category->name,
                'short' => $category->short,
                'blurb' => $category->blurb,
                'icon' => $category->icon,
                'services' => ServiceResource::collection($category->services)->resolve(),
            ]),
        ]);
    }

    public function show(string $slug): ServiceResource
    {
        $service = Service::with('category')
            ->where('slug', $slug)
            ->where('available', true)
            ->firstOrFail();

        return new ServiceResource($service);
    }
}
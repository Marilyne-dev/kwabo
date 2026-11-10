<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Service;
use App\Support\Kw;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceAdminController extends Controller
{
    private function row(Service $s): array
    {
        return [
            'id' => $s->id, 'slug' => $s->slug, 'name' => $s->name, 'price_label' => $s->price_label, 'available' => (bool) $s->available,
            'popular' => (bool) $s->popular, 'icon' => $s->icon,
            'category' => $s->category ? ['slug' => $s->category->slug, 'name' => $s->category->name] : null,
            'requests_count' => (int) ($s->requests_count ?? 0),
        ];
    }

    // Tout le catalogue, y compris les services indisponibles, groupé par univers.
    public function index(): JsonResponse
    {
        return response()->json(['data' => Category::orderBy('sort_order')->get()->map(fn ($c) => [
            'slug' => $c->slug, 'name' => $c->name,
            'services' => Service::where('category_id', $c->id)->with('category')->withCount('requests')->orderBy('id')->get()->map(fn ($s) => $this->row($s))->values(),
        ])->values()]);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $data = $request->validate([
            'price_label' => ['sometimes', 'string', 'max:100'],
            'available' => ['sometimes', 'boolean'],
        ]);

        $service->update($data);
        Kw::audit($request->user(), "Catalogue : {$service->name}, ".($service->available ? 'disponible' : 'indisponible').", {$service->price_label}");

        return response()->json(['data' => $this->row($service->fresh('category'))]);
    }
}

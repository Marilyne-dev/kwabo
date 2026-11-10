<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\Kw;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    // Journal d'audit : ?q= (texte ou nom de la personne)
    public function index(Request $request): JsonResponse
    {
        $page = AuditLog::with('actor')
            ->when($request->query('q'), fn ($b, $v) => $b->where(fn ($w) => $w->where('text', 'like', "%{$v}%")
                ->orWhereHas('actor', fn ($a) => $a->where('first_name', 'like', "%{$v}%")->orWhere('last_name', 'like', "%{$v}%"))))
            ->latest()->paginate(Kw::perPage($request, 50));

        return response()->json([
            'data' => collect($page->items())->map(fn ($j) => ['id' => $j->id, 'at' => $j->created_at, 'actor' => Kw::name($j->actor) ?? 'Système', 'text' => $j->text])->values(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Support\Kw;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReviewAdminController extends Controller
{
    private function row(Review $r): array
    {
        return [
            'id' => $r->id, 'rating' => $r->rating, 'comment' => $r->comment, 'status' => $r->status, 'at' => $r->created_at,
            'customer' => $r->user ? ['id' => $r->user->id, 'full_name' => Kw::name($r->user)] : null,
            'request' => $r->serviceRequest ? ['id' => $r->serviceRequest->id, 'tracking' => $r->serviceRequest->tracking, 'title' => $r->serviceRequest->title] : null,
        ];
    }

    // ?status=pending|published|hidden (par défaut : en attente)
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'pending');
        $request->validate(['status' => ['nullable', Rule::in(['pending', 'published', 'hidden'])]]);

        return response()->json([
            'data' => Review::with(['user', 'serviceRequest'])->where('status', $status)->latest()->get()->map(fn ($r) => $this->row($r))->values(),
            'meta' => ['counts' => [
                'pending' => Review::where('status', 'pending')->count(),
                'published' => Review::where('status', 'published')->count(),
                'hidden' => Review::where('status', 'hidden')->count(),
            ]],
        ]);
    }

    public function update(Request $request, Review $review): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['published', 'hidden'])]]);
        $review->update(['status' => $data['status']]);
        Kw::audit($request->user(), 'Avis '.($data['status'] === 'published' ? 'publié' : 'masqué').' sur « '.($review->serviceRequest?->title ?? '').' »');

        return response()->json(['data' => $this->row($review->load(['user', 'serviceRequest']))]);
    }
}

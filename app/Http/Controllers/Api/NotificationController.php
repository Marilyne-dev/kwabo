<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Support\Kw;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    private function visible(Request $request)
    {
        $user = $request->user();

        return AppNotification::query()->where(function ($q) use ($user) {
            $q->where('user_id', $user->id);
            if ($user->isAdmin()) {
                $q->orWhereNull('user_id'); // notifications de toute l'équipe
            }
        });
    }

    private function format(AppNotification $n): array
    {
        return ['id' => $n->id, 'text' => $n->text, 'link' => $n->link, 'read' => $n->read_at !== null, 'at' => $n->created_at];
    }

    public function index(Request $request): JsonResponse
    {
        $page = $this->visible($request)->latest()->paginate(Kw::perPage($request, 30));

        return response()->json([
            'data' => collect($page->items())->map(fn ($n) => $this->format($n))->values(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'total' => $page->total(),
                'unread_total' => $this->visible($request)->whereNull('read_at')->count(),
            ],
        ]);
    }

    public function read(Request $request, AppNotification $notification): JsonResponse
    {
        abort_unless($this->visible($request)->whereKey($notification->id)->exists(), 404);

        if ($notification->read_at === null) {
            $notification->forceFill(['read_at' => now()])->save();
        }

        return response()->json(['data' => $this->format($notification)]);
    }

    public function readAll(Request $request): JsonResponse
    {
        $count = $this->visible($request)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['updated' => $count]);
    }
}

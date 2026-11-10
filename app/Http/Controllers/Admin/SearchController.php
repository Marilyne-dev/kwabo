<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Kw;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    // Recherche globale du back-office : demandes (5) et, pour l'admin, clients (4).
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['data' => ['requests' => [], 'clients' => []]]);
        }

        $requests = Kw::requestsFor($user)
            ->where(fn ($w) => $w->where('title', 'like', "%{$q}%")->orWhere('tracking', 'like', "%{$q}%"))
            ->with('service')->latest()->limit(5)->get()
            ->map(fn ($r) => ['id' => $r->id, 'tracking' => $r->tracking, 'title' => $r->title, 'status' => $r->status, 'service' => $r->service?->name])->values();

        $clients = $user->isAdmin()
            ? User::where('role', User::ROLE_USER)->where(fn ($w) => $w->where('first_name', 'like', "%{$q}%")->orWhere('last_name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%"))
                ->limit(4)->get()->map(fn ($c) => ['id' => $c->id, 'full_name' => Kw::name($c), 'email' => $c->email])->values()
            : [];

        return response()->json(['data' => ['requests' => $requests, 'clients' => $clients]]);
    }
}

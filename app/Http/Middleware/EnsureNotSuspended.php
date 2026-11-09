<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotSuspended
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isSuspended()) {
            $user->tokens()->delete(); // un compte suspendu perd l'accès tout de suite
            return response()->json(['message' => 'Ce compte est suspendu. Contactez KWABO.'], 403);
        }

        return $next($request);
    }
}
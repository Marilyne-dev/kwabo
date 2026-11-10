<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentMethodResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentMethodController extends Controller
{
    // Mes moyens de paiement enregistrés.
    public function index(Request $request): AnonymousResourceCollection
    {
        return PaymentMethodResource::collection($request->user()->paymentMethods()->orderBy('id')->get());
    }

    // Supprimer un moyen enregistré (un moyen qui n'est pas le sien n'existe pas : 404).
    public function destroy(Request $request, int $method): JsonResponse
    {
        $request->user()->paymentMethods()->whereKey($method)->firstOrFail()->delete();

        return response()->json(['message' => 'Moyen de paiement supprimé.']);
    }
}
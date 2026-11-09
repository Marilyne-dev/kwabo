<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Support\TwoFactor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TwoFactorController extends Controller
{
    // 1. Prépare l'activation : renvoie la clé et le QR code à afficher.
    public function setup(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->two_factor_enabled) {
            throw ValidationException::withMessages(['code' => 'La double authentification est déjà activée.']);
        }

        $secret = TwoFactor::newSecret();
        $user->forceFill(['two_factor_secret' => $secret])->save();
        $url = TwoFactor::url($user, $secret);

        return response()->json([
            'secret' => $secret,      // à saisir à la main si le QR code ne passe pas
            'otpauth_url' => $url,
            'qr_svg' => TwoFactor::qrSvg($url),
        ]);
    }

    // 2. Confirme l'activation avec le premier code affiché par l'application.
    public function enable(Request $request): UserResource
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:10']]);
        $user = $request->user();

        if ($user->two_factor_enabled || ! $user->two_factor_secret || ! TwoFactor::verify($user->two_factor_secret, $data['code'])) {
            throw ValidationException::withMessages(['code' => 'Code incorrect.']);
        }

        $user->forceFill(['two_factor_enabled' => true])->save();

        return new UserResource($user->refresh());
    }

    // 3. Désactive : demande le mot de passe actuel.
    public function disable(Request $request): UserResource
    {
        $data = $request->validate(['password' => ['required', 'string']]);
        $user = $request->user();

        if (! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['password' => 'Mot de passe incorrect.']);
        }

        $user->forceFill(['two_factor_enabled' => false, 'two_factor_secret' => null])->save();

        return new UserResource($user->refresh());
    }
}
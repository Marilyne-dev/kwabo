<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $sponsor = $data['sponsor_code']
            ? User::where('referral_code', $data['sponsor_code'])->first()
            : null;

        $user = User::create([
            'first_name' => trim($data['first_name']),
            'last_name' => trim($data['last_name']),
            'email' => $data['email'],
            'phone' => trim($data['phone']),
            'country' => $data['country'],
            'password' => $data['password'],
            'referral_code' => $this->newReferralCode($data['first_name']),
            'referred_by' => $sponsor?->id,
            'notification_prefs' => array_fill_keys(['received', 'quote', 'started', 'report', 'done', 'payment'], true),
        ])->refresh();

        return response()->json([
            'user' => new UserResource($user),
            'token' => $user->createToken($data['device_name'] ?? 'web')->plainTextToken,
        ], 201);
    }

    // Connexion des clients (site web et application mobile).
    public function login(LoginRequest $request): JsonResponse
    {
        return $this->attempt($request, staffPortal: false);
    }

    // Connexion de l'équipe (administrateurs et agents terrain).
    public function adminLogin(LoginRequest $request): JsonResponse
    {
        return $this->attempt($request, staffPortal: true);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        return response()->json(['message' => 'Déconnecté.']);
    }

    // « Tous mes appareils » : supprime tous les jetons du compte.
    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Déconnecté de tous les appareils.']);
    }

    private function attempt(LoginRequest $request, bool $staffPortal): JsonResponse
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'E-mail ou mot de passe incorrect.']);
        }

        if ($user->isSuspended()) {
            throw ValidationException::withMessages(['email' => 'Ce compte est suspendu. Contactez KWABO.']);
        }

        if ($staffPortal && $user->isClient()) {
            throw ValidationException::withMessages(['email' => 'Cet accès est réservé à l\'équipe KWABO.']);
        }

        if (! $staffPortal && ! $user->isClient()) {
            throw ValidationException::withMessages(['email' => 'Compte équipe : connectez-vous sur l\'interface d\'administration.']);
        }

        return response()->json([
            'user' => new UserResource($user),
            'token' => $user->createToken($data['device_name'] ?? ($staffPortal ? 'admin' : 'web'))->plainTextToken,
        ]);
    }

    private function newReferralCode(string $firstName): string
    {
        $letters = preg_replace('/[^\p{L}]/u', '', $firstName);
        $prefix = 'KW-'.mb_strtoupper(mb_substr($letters, 0, 4));

        do {
            $code = $prefix.str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while (User::where('referral_code', $code)->exists());

        return $code;
    }
}
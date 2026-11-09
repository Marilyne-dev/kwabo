<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\OneTimeCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
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

        $this->sendCode($user, 'verify');

        // Pas de jeton : le compte doit d'abord confirmer son e-mail.
        return response()->json([
            'user' => new UserResource($user),
            'needs_verification' => true,
            'message' => 'Un code de confirmation a été envoyé à votre e-mail.',
        ], 201);
    }

    // Confirmation de l'e-mail avec le code reçu.
    public function verifyEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'max:10'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $user = User::where('email', strtolower(trim($data['email'])))->first();

        if (! $user || ! OneTimeCode::check('verify', $user, $data['code'])) {
            throw ValidationException::withMessages(['code' => 'Code incorrect ou expiré.']);
        }

        if ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return response()->json([
            'user' => new UserResource($user->refresh()),
            'token' => $user->createToken($data['device_name'] ?? 'web')->plainTextToken,
        ]);
    }

    // Renvoi du code (réponse toujours identique, pour ne pas révéler quels e-mails existent).
    public function resendVerification(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', strtolower(trim($data['email'])))->first();

        if ($user && $user->email_verified_at === null) {
            $this->sendCode($user, 'verify');
        }

        return response()->json(['message' => 'Si ce compte existe, un nouveau code vient d\'être envoyé.']);
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

        // E-mail non confirmé (clients) : connexion refusée, nouveau code envoyé.
        if (! $staffPortal && $user->email_verified_at === null) {
            $this->sendCode($user, 'verify');

            return response()->json([
                'message' => 'Confirmez votre e-mail : un code vient de vous être envoyé.',
                'needs_verification' => true,
            ], 403);
        }

        // Double authentification : 1er envoi sans code → on demande le code, 2e envoi avec code → on connecte.
        if ($user->two_factor_enabled) {
            $code = $data['code'] ?? null;

            if (! $code) {
                $this->sendCode($user, 'login');

                return response()->json([
                    'needs_code' => true,
                    'message' => 'Un code à 6 chiffres vient d\'être envoyé par e-mail.',
                ]);
            }

            if (! OneTimeCode::check('login', $user, $code)) {
                throw ValidationException::withMessages(['code' => 'Code incorrect ou expiré.']);
            }
        }

        return response()->json([
            'user' => new UserResource($user),
            'token' => $user->createToken($data['device_name'] ?? ($staffPortal ? 'admin' : 'web'))->plainTextToken,
        ]);
    }

    private function sendCode(User $user, string $purpose): void
    {
        $code = OneTimeCode::issue($purpose, $user);
        $subject = $purpose === 'verify' ? 'KWABO : confirmez votre e-mail' : 'KWABO : votre code de connexion';
        $text = "Votre code KWABO : {$code}\n\nIl est valable 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.";

        try {
            Mail::raw($text, fn ($m) => $m->to($user->email)->subject($subject));
        } catch (\Throwable $e) {
            report($e); // l'échec d'envoi ne doit pas bloquer l'API
        }
    }

    private function newReferralCode(string $firstName): string
    {
        $letters = preg_replace('/[^A-Za-z]/', '', Str::ascii($firstName));
        $prefix = 'KW-'.strtoupper(substr($letters, 0, 4));

        do {
            $code = $prefix.str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while (User::where('referral_code', $code)->exists());

        return $code;
    }
}
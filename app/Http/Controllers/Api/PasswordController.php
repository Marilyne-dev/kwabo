<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\StrongPassword;
use App\Support\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordController extends Controller
{
    // « Mot de passe oublié » : réponse toujours identique, pour ne pas révéler quels e-mails existent.
    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', strtolower(trim($data['email'])))->first();

        if ($user && ! $user->isSuspended()) {
            PasswordReset::send($user);
        }

        return response()->json(['message' => 'Si ce compte existe, un lien valable 1 heure vient d\'être envoyé.']);
    }

    // Nouveau mot de passe, avec le lien reçu (e-mail + jeton).
    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', new StrongPassword],
        ]);

        $status = Password::reset(
            ['email' => strtolower(trim($data['email'])), 'token' => $data['token'], 'password' => $data['password']],
            function (User $user, string $password) {
                $user->forceFill(['password' => $password])->setRememberToken(Str::random(60));

                // Recevoir le lien prouve que l'adresse est bien la sienne.
                if ($user->email_verified_at === null) {
                    $user->forceFill(['email_verified_at' => now()]);
                }

                $user->save();
                $user->tokens()->delete(); // tous les appareils doivent se reconnecter
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => 'Ce lien n\'est plus valable.']);
        }

        return response()->json(['message' => 'Mot de passe enregistré. Vous pouvez vous connecter.']);
    }
}
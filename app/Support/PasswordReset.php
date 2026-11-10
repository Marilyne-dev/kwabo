<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;

class PasswordReset
{
    // Crée un jeton valable 1 heure (réglage auth.passwords.users.expire) et envoie le lien par e-mail.
    public static function send(User $user): void
    {
        $token = Password::broker()->createToken($user);
        $link = rtrim(config('app.frontend_url'), '/').'/#/reinitialiser-mot-de-passe?'.http_build_query([
            'email' => $user->email,
            'token' => $token,
        ]);

        $text = "Bonjour {$user->first_name},\n\n"
            ."Pour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :\n{$link}\n\n"
            ."Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe ne change pas.";

        try {
            Mail::raw($text, fn ($m) => $m->to($user->email)->subject('KWABO : nouveau mot de passe'));
        } catch (\Throwable $e) {
            report($e); // l'échec d'envoi ne doit pas bloquer l'API
        }
    }
}
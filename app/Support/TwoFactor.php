<?php

namespace App\Support;

use App\Models\User;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use PragmaRX\Google2FA\Google2FA;

class TwoFactor
{
    public static function newSecret(): string
    {
        return (new Google2FA())->generateSecretKey();
    }

    // Adresse « otpauth » lue par Google Authenticator, Authy, etc.
    public static function url(User $user, string $secret): string
    {
        return (new Google2FA())->getQRCodeUrl(config('app.name', 'KWABO'), $user->email, $secret);
    }

    public static function qrSvg(string $url): string
    {
        $writer = new Writer(new ImageRenderer(new RendererStyle(192, 1), new SvgImageBackEnd()));

        return $writer->writeString($url);
    }

    // Accepte le code actuel, et celui de 30 secondes avant ou après (décalage d'horloge).
    public static function verify(string $secret, string $code): bool
    {
        return (bool) (new Google2FA())->verifyKey($secret, preg_replace('/\D/', '', $code), 1);
    }
}
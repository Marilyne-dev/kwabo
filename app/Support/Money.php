<?php

namespace App\Support;

class Money
{
    public static function eur(float|int|string $amount): string
    {
        $formatted = number_format((float) $amount, 2, ',', ' ');

        return preg_replace('/,00$/', '', $formatted).' €';
    }
}
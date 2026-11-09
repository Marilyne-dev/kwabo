<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class OneTimeCode
{
    private const MAX_TRIES = 5;

    public static function issue(string $purpose, User $user, int $minutes = 15): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Cache::put(self::key($purpose, $user), ['hash' => Hash::make($code), 'tries' => 0], now()->addMinutes($minutes));

        return $code;
    }

    public static function check(string $purpose, User $user, string $code): bool
    {
        $key = self::key($purpose, $user);
        $entry = Cache::get($key);

        if (! $entry) {
            return false;
        }

        if ($entry['tries'] >= self::MAX_TRIES) {
            Cache::forget($key);
            return false;
        }

        if (! Hash::check(trim($code), $entry['hash'])) {
            $entry['tries']++;
            Cache::put($key, $entry, now()->addMinutes(15));
            return false;
        }

        Cache::forget($key);

        return true;
    }

    private static function key(string $purpose, User $user): string
    {
        return "otp:{$purpose}:{$user->id}";
    }
}
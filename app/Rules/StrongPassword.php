<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class StrongPassword implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $password = (string) $value;

        if (mb_strlen($password) < 8 || ! preg_match('/[A-ZÀ-Ý]/u', $password) || ! preg_match('/\d/', $password)) {
            $fail('Au moins 8 caractères, avec 1 majuscule et 1 chiffre.');
        }
    }
}
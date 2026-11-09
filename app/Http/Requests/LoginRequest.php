<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => strtolower(trim((string) $this->input('email')))]);
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'], // ex. « web » ou « mobile »
            'code' => ['nullable', 'string', 'max:10'], // code de double authentification
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'L\'e-mail est obligatoire.',
            'email.email' => 'Cet e-mail n\'est pas valide.',
            'password.required' => 'Le mot de passe est obligatoire.',
        ];
    }
}
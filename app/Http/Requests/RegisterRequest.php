<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim((string) $this->input('email'))),
            'sponsor_code' => $this->filled('sponsor_code') ? strtoupper(trim($this->input('sponsor_code'))) : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30'], // numéro complet, indicatif compris (ex. +33 6 12 34 56 78)
            'country' => ['required', 'string', 'max:80'],
            'password' => ['required', 'string', 'min:8'],
            'sponsor_code' => ['nullable', 'string', 'exists:users,referral_code'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Le prénom est obligatoire.',
            'last_name.required' => 'Le nom est obligatoire.',
            'email.required' => 'L\'e-mail est obligatoire.',
            'email.email' => 'Cet e-mail n\'est pas valide.',
            'email.unique' => 'Cet e-mail est déjà utilisé.',
            'phone.required' => 'Le téléphone est obligatoire.',
            'country.required' => 'Le pays est obligatoire.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'sponsor_code.exists' => 'Ce code de parrainage n\'existe pas.',
        ];
    }
}
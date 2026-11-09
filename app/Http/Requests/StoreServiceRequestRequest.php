<?php

namespace App\Http\Requests;

use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

       public function rules(): array
    {
        $rules = [
            'service' => ['required', 'string', Rule::exists('services', 'slug')->where('available', true)],
            'title' => ['nullable', 'string', 'max:150'],
            'city' => ['nullable', 'string', 'max:100'],
            'urgency' => ['nullable', Rule::in(['normal', 'urgent'])],
            'budget' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:5000'],
            'details' => ['nullable', 'array'],
        ];

        foreach ($this->serviceFields() as $field) {
            $rules['details.'.$field['name']] = [empty($field['required']) ? 'nullable' : 'required'];
        }

        foreach ($this->serviceFields(files: true) as $field) {
            $rules['files.'.$field['name']] = [
                empty($field['required']) ? 'nullable' : 'required',
                'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png',
            ];
        }

        return $rules;
    }

    public function attributes(): array
    {
        $attributes = [];

        foreach ($this->serviceFields() as $field) {
            $attributes['details.'.$field['name']] = $field['label'] ?? $field['name'];
        }

        foreach ($this->serviceFields(files: true) as $field) {
            $attributes['files.'.$field['name']] = $field['label'] ?? $field['name'];
        }

        return $attributes;
    }

    public function messages(): array
    {
        return [
            'service.required' => 'Le service est obligatoire.',
            'service.exists' => 'Ce service n\'existe pas ou n\'est plus disponible.',
            'urgency.in' => 'L\'urgence doit être « normal » ou « urgent ».',
            'details.*.required' => 'Le champ « :attribute » est obligatoire.',
            'files.*.required' => 'Le fichier « :attribute » est obligatoire.',
            'files.*.mimes' => 'Le fichier « :attribute » doit être un PDF, JPG ou PNG.',
            'files.*.max' => 'Le fichier « :attribute » ne doit pas dépasser 10 Mo.',
        ];
    }

    // Champs du formulaire propres au service choisi : champs normaux, ou champs fichier si $files = true.
    private function serviceFields(bool $files = false): array
    {
        $service = Service::where('slug', $this->input('service'))->first();

        return collect($service?->form_fields ?? [])
            ->filter(fn ($f) => ! empty($f['name']) && ((($f['type'] ?? '') === 'file') === $files))
            ->values()
            ->all();
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\AppNotification;
use App\Models\Document;
use App\Models\Invoice;
use App\Models\Message;
use App\Models\PaymentMethod;
use App\Models\RequestHistory;
use App\Models\RequestNote;
use App\Models\Review;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Rules\StrongPassword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class ProfileController extends Controller
{
    private const PREF_KEYS = ['received', 'quote', 'started', 'report', 'done', 'payment'];

    // Mes informations : prénom, nom, téléphone, pays (l'e-mail ne change pas ici).
    public function update(Request $request): UserResource
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'phone' => ['required', 'string', 'max:30', function ($attribute, $value, $fail) {
                if (strlen(preg_replace('/\D/', '', (string) $value)) < 6) {
                    $fail('Saisissez un numéro valide.');
                }
            }],
            'country' => ['required', 'string', 'max:80'],
        ], [
            'first_name.required' => 'Saisissez votre prénom.',
            'last_name.required' => 'Saisissez votre nom.',
            'phone.required' => 'Saisissez un numéro valide.',
            'country.required' => 'Choisissez votre pays.',
        ]);

        $user = $request->user();
        $user->update([
            'first_name' => trim($data['first_name']),
            'last_name' => trim($data['last_name']),
            'phone' => trim($data['phone']),
            'country' => $data['country'],
        ]);

        return new UserResource($user->refresh());
    }

    // Changer de mot de passe : les autres appareils sont déconnectés, celui-ci reste connecté.
    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', new StrongPassword],
        ], [
            'current_password.required' => 'Saisissez votre mot de passe actuel.',
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Mot de passe actuel incorrect.']);
        }

        $user->forceFill(['password' => $data['password']])->save();

        $current = $user->currentAccessToken();
        $others = $user->tokens();

        if ($current instanceof PersonalAccessToken) {
            $others->where('id', '!=', $current->id);
        }

        $others->delete();

        return response()->json(['message' => 'Mot de passe changé.']);
    }

    // Préférences de notification : on envoie seulement les clés à changer, par exemple {"prefs": {"quote": false}}.
    public function updateNotifications(Request $request): UserResource
    {
        $data = $request->validate([
            'prefs' => ['required', 'array'],
            'prefs.*' => ['boolean'],
        ]);

        $user = $request->user();
        $user->update([
            'notification_prefs' => array_merge($user->notification_prefs ?? [], Arr::only($data['prefs'], self::PREF_KEYS)),
        ]);

        return new UserResource($user->refresh());
    }

    // Supprimer le compte et toutes les données associées (droit à l'effacement). Clients seulement.
    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate(['password' => ['required', 'string']]);
        $user = $request->user();

        if (! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['password' => 'Mot de passe incorrect.']);
        }

        $ids = $user->serviceRequests()->pluck('id')->all();

        $files = Document::whereIn('service_request_id', $ids)->pluck('path')
            ->merge(Message::whereIn('service_request_id', $ids)->pluck('attachment_path'))
            ->filter()
            ->all();

        DB::transaction(function () use ($user, $ids) {
            RequestHistory::whereIn('service_request_id', $ids)->delete();
            RequestNote::whereIn('service_request_id', $ids)->delete();
            Message::whereIn('service_request_id', $ids)->delete();
            Document::whereIn('service_request_id', $ids)->delete();
            Review::whereIn('service_request_id', $ids)->delete();
            Invoice::whereIn('service_request_id', $ids)->delete();

            Invoice::where('user_id', $user->id)->delete();
            Review::where('user_id', $user->id)->delete();
            PaymentMethod::where('user_id', $user->id)->delete();
            AppNotification::where('user_id', $user->id)->delete();
            ServiceRequest::whereIn('id', $ids)->delete();

            User::where('referred_by', $user->id)->update(['referred_by' => null]); // les filleuls gardent leur compte
            $user->tokens()->delete();
            $user->delete();
        });

        // Les fichiers privés sont supprimés une fois la base nettoyée.
        Storage::disk('local')->delete($files);

        foreach ($ids as $id) {
            Storage::disk('local')->deleteDirectory("requests/{$id}");
        }

        return response()->json(['message' => 'Votre compte et vos données ont été supprimés.']);
    }
}
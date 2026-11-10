<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Support\Kw;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OperatorController extends Controller
{
    // L'équipe : administrateurs et agents terrain, avec leur charge.
    public function index(): JsonResponse
    {
        return response()->json(['data' => User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_OPERATOR])->orderBy('role')->orderBy('first_name')->get()->map(fn ($u) => [
            'id' => $u->id, 'full_name' => Kw::name($u), 'email' => $u->email, 'phone' => $u->phone, 'role' => $u->role,
            'suspended' => $u->suspended_at !== null,
            'active_missions' => $u->isOperator() ? ServiceRequest::where('operator_id', $u->id)->where('status', 'active')->count() : null,
            'total_missions' => $u->isOperator() ? ServiceRequest::where('operator_id', $u->id)->count() : null,
        ])->values()]);
    }

    // Ajouter un agent terrain. En local le mot de passe est Demo1234 ; en ligne il reçoit un lien pour choisir le sien.
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30'],
        ], ['email.unique' => 'Cet e-mail est déjà utilisé.', 'first_name.required' => 'Le prénom est obligatoire.', 'last_name.required' => 'Le nom est obligatoire.']);

        $user = new User([
            'first_name' => trim($data['first_name']), 'last_name' => trim($data['last_name']),
            'email' => strtolower(trim($data['email'])), 'phone' => trim($data['phone']), 'country' => 'Bénin',
            'password' => app()->environment('local') ? 'Demo1234' : Str::random(40),
            'referral_code' => 'KW-OP'.random_int(100000, 999999),
            'notification_prefs' => [],
        ]);
        $user->role = User::ROLE_OPERATOR;
        $user->email_verified_at = now();
        $user->save();

        $token = app()->environment('local') ? null : Kw::sendPasswordLink($user);
        Kw::audit($request->user(), 'Agent terrain ajouté : '.Kw::name($user));

        return response()->json(['data' => ['id' => $user->id, 'full_name' => Kw::name($user), 'email' => $user->email, 'role' => $user->role]], 201);
    }
}

<?php

namespace App\Support;

use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\Invoice;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

// Petites aides partagées par les contrôleurs du back-office et du tableau de bord.
class Kw
{
    // Demandes visibles : client = les siennes, agent = celles qui lui sont attribuées, admin = toutes.
    public static function requestsFor(User $user): Builder
    {
        $q = ServiceRequest::query();

        if ($user->isAdmin()) {
            return $q;
        }

        return $user->isOperator() ? $q->where('operator_id', $user->id) : $q->where('user_id', $user->id);
    }

    public static function notify(User|int|null $user, string $text, ?string $link = null, ?string $pref = null): void
    {
        $u = $user instanceof User ? $user : ($user ? User::find($user) : null);
        if (! $u) {
            return;
        }

        AppNotification::create(['user_id' => $u->id, 'text' => $text, 'link' => $link]);

        if ($pref !== null && ($u->notification_prefs[$pref] ?? true)) {
            self::mail($u->email, $text);
        }
    }

    public static function notifyTeam(string $text, ?string $link = null): void
    {
        AppNotification::create(['user_id' => null, 'text' => $text, 'link' => $link]);
    }

    public static function mail(string $to, string $body, string $subject = 'KWABO'): void
    {
        try {
            Mail::raw($body, fn ($m) => $m->to($to)->subject($subject));
        } catch (\Throwable $e) {
            Log::warning('E-mail non envoyé : '.$e->getMessage());
        }
    }

    public static function audit(?User $actor, string $text): void
    {
        AuditLog::create(['actor_id' => $actor?->id, 'text' => $text]);
    }

    // Numéro de facture suivant : F-2026-0058.
    public static function invoiceNumber(): string
    {
        $year = now()->year;
        $last = Invoice::where('number', 'like', "F-{$year}-%")->orderByDesc('number')->value('number');
        $next = $last ? ((int) substr($last, -4)) + 1 : 1;

        return sprintf('F-%d-%04d', $year, $next);
    }

    public static function perPage(Request $request, int $default = 20): int
    {
        return max(1, min(200, (int) $request->query('per_page', $default)));
    }

    public static function statusLabel(string $status): string
    {
        return ['pending' => 'En attente', 'active' => 'En cours', 'done' => 'Terminée', 'cancelled' => 'Annulée'][$status] ?? $status;
    }

    public static function name(?User $user): ?string
    {
        return $user ? trim($user->first_name.' '.$user->last_name) : null;
    }

    // Lien de choix d'un mot de passe (agent invité, lien envoyé par l'admin).
    public static function sendPasswordLink(User $user): ?string
    {
        $token = \Illuminate\Support\Facades\Password::broker()->createToken($user);
        $front = rtrim((string) env('FRONTEND_URL', 'http://localhost:5173'), '/');
        $link = $front.'/reinitialiser-mot-de-passe?email='.urlencode($user->email).'&token='.$token;
        self::mail($user->email, "Pour choisir votre mot de passe KWABO, utilisez ce lien (valable 1 heure) : {$link}", 'Votre mot de passe KWABO');

        return app()->environment('local') ? $token : null;
    }
}

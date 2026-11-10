<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    // Mon code, mes filleuls (« Actif » = au moins une mission payée), mes récompenses.
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $reward = (float) env('KWABO_REFERRAL_REWARD', 10);

        $referrals = $user->referrals()->orderByDesc('created_at')->get()->map(function ($r) {
            $active = Invoice::where('user_id', $r->id)->where('status', Invoice::PAID)->exists();
            $initial = mb_strtoupper(mb_substr((string) $r->last_name, 0, 1));

            return [
                'name' => trim($r->first_name.' '.$initial.'.'),
                'status' => $active ? 'Actif' : 'Inscrit',
                'joined_at' => $r->created_at,
            ];
        })->values();

        $active = $referrals->where('status', 'Actif')->count();

        return response()->json(['data' => [
            'code' => $user->referral_code,
            'share_text' => "Je te recommande KWABO pour tes projets au Bénin. Mon code de parrainage : {$user->referral_code}",
            'reward_per_referral' => $reward,
            'stats' => ['referrals' => $referrals->count(), 'active' => $active, 'rewards' => $active * $reward],
            'referrals' => $referrals,
        ]]);
    }
}

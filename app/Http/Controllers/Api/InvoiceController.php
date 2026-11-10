<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\AppNotification;
use App\Models\Invoice;
use App\Models\ServiceRequest;
use App\Support\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    // Mes factures (les plus récentes d'abord) et les trois totaux de l'écran Paiements.
    public function index(Request $request): JsonResponse
    {
        $invoices = $request->user()->invoices()
            ->with('serviceRequest')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => InvoiceResource::collection($invoices)->resolve(),
            'meta' => [
                'due_total' => (float) $invoices->where('status', Invoice::DUE)->sum('amount'),
                'paid_total' => (float) $invoices->where('status', Invoice::PAID)->sum('amount'),
                'count' => $invoices->count(),
            ],
        ]);
    }

    // Payer une facture. Pour l'instant le paiement est simulé (PAYMENTS_DRIVER=simulated).
    // Pour tester un échec : envoyer "simulate": "fail".
    public function pay(Request $request, int $invoice): JsonResponse|InvoiceResource
    {
        $data = $request->validate([
            'method' => ['required', Rule::in(['card', 'momo', 'wise'])],
            'simulate' => ['nullable', Rule::in(['fail'])],
        ], [
            'method.required' => 'Choisissez un moyen de paiement.',
            'method.in' => 'Moyen de paiement inconnu.',
        ]);

        // Une facture qui n'est pas la sienne n'existe pas (404).
        $found = $request->user()->invoices()->whereKey($invoice)->firstOrFail();

        abort_unless($found->status === Invoice::DUE, 422, 'Cette facture n\'est plus à payer.');
        abort_unless(config('services.payments.driver') === 'simulated', 501, 'Le paiement en ligne n\'est pas encore activé.');

        if (($data['simulate'] ?? null) === 'fail') {
            return response()->json(['message' => 'Le paiement a échoué. Aucun montant n\'a été débité.'], 402);
        }

        $paid = DB::transaction(function () use ($found, $data) {
            // Verrou : deux clics rapides ne doivent pas payer deux fois.
            $invoice = Invoice::lockForUpdate()->findOrFail($found->id);

            abort_unless($invoice->status === Invoice::DUE, 422, 'Cette facture n\'est plus à payer.');

            $invoice->update([
                'status' => Invoice::PAID,
                'method' => $data['method'],
                'paid_at' => now(),
            ]);

            $serviceRequest = $invoice->serviceRequest;

            AppNotification::create([
                'user_id' => $invoice->user_id,
                'text' => 'Paiement confirmé : '.Money::eur($invoice->amount)." pour « {$serviceRequest->title} »",
                'link' => '/payments',
            ]);

            if ($serviceRequest->status === ServiceRequest::PENDING) {
                $serviceRequest->update(['status' => ServiceRequest::ACTIVE]);
                $serviceRequest->log('Mission démarrée après paiement');

                AppNotification::create([
                    'user_id' => $invoice->user_id,
                    'text' => "Votre mission « {$serviceRequest->title} » a démarré.",
                    'link' => "/requests/{$serviceRequest->id}",
                ]);
            }

            return $invoice;
        });

        return new InvoiceResource($paid->load('serviceRequest'));
    }
}
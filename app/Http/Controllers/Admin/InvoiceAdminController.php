<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Support\Kw;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InvoiceAdminController extends Controller
{
    private function row(Invoice $i): array
    {
        return [
            'id' => $i->id, 'number' => $i->number, 'label' => $i->label, 'amount' => (float) $i->amount,
            'status' => $i->status, 'method' => $i->method, 'created_at' => $i->created_at, 'paid_at' => $i->paid_at,
            'customer' => $i->user ? ['id' => $i->user->id, 'full_name' => Kw::name($i->user), 'email' => $i->user->email] : null,
            'request' => $i->serviceRequest ? ['id' => $i->serviceRequest->id, 'tracking' => $i->serviceRequest->tracking, 'title' => $i->serviceRequest->title] : null,
        ];
    }

    // ?q= (numéro, objet, client) &status=due|paid|refunded|cancelled
    public function index(Request $request): JsonResponse
    {
        $request->validate(['status' => ['nullable', Rule::in(['due', 'paid', 'refunded', 'cancelled'])]]);

        $page = Invoice::with(['user', 'serviceRequest'])
            ->when($request->query('status'), fn ($b, $v) => $b->where('status', $v))
            ->when($request->query('q'), fn ($b, $v) => $b->where(fn ($w) => $w->where('number', 'like', "%{$v}%")->orWhere('label', 'like', "%{$v}%")
                ->orWhereHas('user', fn ($u) => $u->where('first_name', 'like', "%{$v}%")->orWhere('last_name', 'like', "%{$v}%"))))
            ->orderByRaw('COALESCE(paid_at, created_at) DESC')
            ->paginate(Kw::perPage($request));

        return response()->json([
            'data' => collect($page->items())->map(fn ($i) => $this->row($i))->values(),
            'meta' => [
                'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(),
                'paid_total' => (float) Invoice::where('status', 'paid')->sum('amount'),
                'due_total' => (float) Invoice::where('status', 'due')->sum('amount'),
                'refunded_total' => (float) Invoice::where('status', 'refunded')->sum('amount'),
                'month_total' => (float) Invoice::where('status', 'paid')->where('paid_at', '>=', now()->startOfMonth())->sum('amount'),
            ],
        ]);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json(['data' => $this->row($invoice->load(['user', 'serviceRequest']))]);
    }

    public function refund(Request $request, Invoice $invoice): JsonResponse
    {
        abort_unless($invoice->status === Invoice::PAID, 422, 'Seule une facture payée peut être remboursée.');

        $invoice->update(['status' => Invoice::REFUNDED]);
        Kw::audit($request->user(), "Remboursement de {$invoice->amount} € : facture {$invoice->number}");
        Kw::notify($invoice->user_id, "Remboursement de {$invoice->amount} € pour « {$invoice->label} »", '/payments', 'payment');

        return response()->json(['data' => $this->row($invoice->fresh(['user', 'serviceRequest']))]);
    }
}

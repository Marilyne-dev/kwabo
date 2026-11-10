<?php

namespace App\Http\Controllers\Admin;

use App\Models\ServiceRequest;
use App\Support\Kw;

trait FormatsRequests
{
    protected function docRow($d): array
    {
        $labels = ['report' => 'Rapport', 'photo' => 'Photo', 'video' => 'Vidéo', 'receipt' => 'Reçu', 'contract' => 'Contrat'];

        return [
            'id' => $d->id, 'type' => $d->type, 'type_label' => $labels[$d->type] ?? $d->type,
            'name' => $d->name, 'created_at' => $d->created_at,
            'url' => url("/api/documents/{$d->id}/download"),
        ];
    }

    protected function invoiceRow($i): array
    {
        return [
            'id' => $i->id, 'number' => $i->number, 'label' => $i->label, 'amount' => (float) $i->amount,
            'status' => $i->status, 'method' => $i->method, 'created_at' => $i->created_at, 'paid_at' => $i->paid_at,
        ];
    }

    protected function requestRow(ServiceRequest $r, bool $detail = false): array
    {
        $row = [
            'id' => $r->id, 'tracking' => $r->tracking, 'status' => $r->status, 'status_label' => Kw::statusLabel($r->status),
            'title' => $r->title, 'city' => $r->city, 'urgency' => $r->urgency, 'budget' => $r->budget,
            'description' => $r->description, 'details' => $r->details,
            'quote' => $r->quote_amount !== null ? ['amount' => (float) $r->quote_amount, 'label' => $r->quote_label] : null,
            'rating' => $r->rating, 'created_at' => $r->created_at, 'updated_at' => $r->updated_at,
            'unread_messages' => (int) ($r->unread_messages ?? 0),
            'service' => $r->service ? [
                'id' => $r->service->id, 'slug' => $r->service->slug, 'name' => $r->service->name, 'icon' => $r->service->icon,
                'category' => $r->service->category ? ['slug' => $r->service->category->slug, 'name' => $r->service->category->name] : null,
            ] : null,
            'customer' => $r->user ? [
                'id' => $r->user->id, 'full_name' => Kw::name($r->user), 'email' => $r->user->email,
                'phone' => $r->user->phone, 'country' => $r->user->country,
            ] : null,
            'operator' => $r->operator ? ['id' => $r->operator->id, 'full_name' => Kw::name($r->operator)] : null,
        ];

        if ($detail) {
            $row['history'] = $r->histories->map(fn ($h) => ['at' => $h->created_at, 'text' => $h->text])->values();
            $row['documents'] = $r->documents->sortByDesc('created_at')->map(fn ($d) => $this->docRow($d))->values();
            $row['invoices'] = $r->invoices->sortByDesc('created_at')->map(fn ($i) => $this->invoiceRow($i))->values();
            $row['notes'] = $r->notes->sortByDesc('created_at')->map(fn ($n) => ['at' => $n->created_at, 'author' => Kw::name($n->author), 'text' => $n->text])->values();
            $row['review'] = $r->review ? ['rating' => $r->review->rating, 'comment' => $r->review->comment, 'status' => $r->review->status] : null;
        }

        return $row;
    }

    protected function loadDetail(ServiceRequest $r): ServiceRequest
    {
        return $r->load(['service.category', 'user', 'operator', 'histories', 'documents', 'invoices', 'notes.author', 'review']);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceRequestResource;
use App\Models\AppNotification;
use App\Models\Review;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ReviewController extends Controller
{
    // Noter une mission terminée (1 à 5), avec un commentaire facultatif. Rappeler la route modifie la note.
    // Si "comment" n'est pas envoyé, le commentaire existant reste tel quel. L'avis repart en modération.
    public function store(Request $request, ServiceRequest $serviceRequest): ServiceRequestResource
    {
        Gate::authorize('rate', $serviceRequest);

        abort_unless(
            $serviceRequest->status === ServiceRequest::DONE,
            422,
            'Vous pourrez noter la mission une fois terminée.'
        );

        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ], [
            'rating.required' => 'Choisissez une note de 1 à 5.',
            'rating.between' => 'La note doit être comprise entre 1 et 5.',
        ]);

        DB::transaction(function () use ($request, $serviceRequest, $data) {
            $serviceRequest->update(['rating' => $data['rating']]);
            $serviceRequest->log("Note du client : {$data['rating']}/5");

            $review = $serviceRequest->review;

            if ($review) {
                $review->rating = $data['rating'];

                if ($request->has('comment')) {
                    $review->comment = $data['comment'] ?? '';
                }

                $review->status = Review::PENDING;
                $review->save();
            } else {
                $serviceRequest->review()->create([
                    'user_id' => $request->user()->id,
                    'rating' => $data['rating'],
                    'comment' => $data['comment'] ?? '',
                    'status' => Review::PENDING,
                ]);

                AppNotification::create([
                    'user_id' => null, // toute l'équipe
                    'text' => "Avis à modérer : « {$serviceRequest->title} » ({$data['rating']}/5)",
                    'link' => '/admin/reviews',
                ]);
            }
        });

        return new ServiceRequestResource(
            $serviceRequest->fresh(['service.category', 'operator', 'histories', 'documents', 'invoices', 'review'])
        );
    }
}
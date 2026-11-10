<?php

namespace App\Policies;

use App\Models\ServiceRequest;
use App\Models\User;

class ServiceRequestPolicy
{
    // Voir une demande : son propriétaire, l'agent qui la traite, ou un admin.
    public function view(User $user, ServiceRequest $serviceRequest): bool
    {
        return $user->isAdmin()
            || $serviceRequest->user_id === $user->id
            || $serviceRequest->operator_id === $user->id;
    }

    // Annuler : seulement le client qui l'a créée.
    public function cancel(User $user, ServiceRequest $serviceRequest): bool
    {
        return $serviceRequest->user_id === $user->id;
    }

    // Noter la mission : seulement le client qui l'a créée.
    public function rate(User $user, ServiceRequest $serviceRequest): bool
    {
        return $serviceRequest->user_id === $user->id;
    }
}
<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\ServiceRequestController;
use App\Http\Controllers\Api\TwoFactorController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => ['message' => 'API KWABO OK']);

// Catalogue (public)
Route::get('/catalog', [ServiceController::class, 'catalog']);
Route::get('/services/{slug}', [ServiceController::class, 'show']);

// Authentification
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/admin/login', [AuthController::class, 'adminLogin']);
    Route::post('/email/verify', [AuthController::class, 'verifyEmail']);
    Route::post('/email/resend', [AuthController::class, 'resendVerification']);
    Route::post('/password/forgot', [PasswordController::class, 'forgot']);
    Route::post('/password/reset', [PasswordController::class, 'reset']);
});

// Personnes connectées (compte non suspendu)
Route::middleware(['auth:sanctum', 'not.suspended'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);

    // Mon compte
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);
    Route::put('/profile/notifications', [ProfileController::class, 'updateNotifications']);

    // Double authentification (clients et équipe)
    Route::post('/two-factor/setup', [TwoFactorController::class, 'setup']);
    Route::post('/two-factor/enable', [TwoFactorController::class, 'enable']);
    Route::post('/two-factor/disable', [TwoFactorController::class, 'disable']);

    // Téléchargement d'un document (le droit d'accès est vérifié dans le contrôleur)
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);

    // Espace client
    Route::middleware('role:user')->group(function () {
        Route::delete('/account', [ProfileController::class, 'destroy']);

        Route::get('/requests', [ServiceRequestController::class, 'index']);
        Route::post('/requests', [ServiceRequestController::class, 'store']);
        Route::get('/requests/{serviceRequest}', [ServiceRequestController::class, 'show']);
        Route::post('/requests/{serviceRequest}/cancel', [ServiceRequestController::class, 'cancel']);
    });
});
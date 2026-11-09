<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\ServiceRequestController;
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
});

// Personnes connectées (compte non suspendu)
Route::middleware(['auth:sanctum', 'not.suspended'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);

    // Espace client
    Route::middleware('role:user')->group(function () {
        Route::get('/requests', [ServiceRequestController::class, 'index']);
        Route::post('/requests', [ServiceRequestController::class, 'store']);
        Route::get('/requests/{serviceRequest}', [ServiceRequestController::class, 'show']);
        Route::post('/requests/{serviceRequest}/cancel', [ServiceRequestController::class, 'cancel']);
    });
});
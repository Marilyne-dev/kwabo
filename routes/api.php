<?php
// KWABO-LOT2 (imports)
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\InvoiceAdminController;
use App\Http\Controllers\Admin\OperatorController;
use App\Http\Controllers\Admin\RequestAdminController;
use App\Http\Controllers\Admin\ReviewAdminController;
use App\Http\Controllers\Admin\SearchController;
use App\Http\Controllers\Admin\ServiceAdminController;
use App\Http\Controllers\Admin\StatsController;
use App\Http\Controllers\Admin\UserAdminController;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReviewController;
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

    // Messagerie (client, agent et admin : chacun voit ses demandes)
    Route::get('/messages', [MessageController::class, 'threads']);
    Route::get('/messages/{message}/attachment', [MessageController::class, 'attachment']);
    Route::get('/requests/{serviceRequest}/messages', [MessageController::class, 'index']);
    Route::post('/requests/{serviceRequest}/messages', [MessageController::class, 'store']);
    Route::post('/requests/{serviceRequest}/messages/read', [MessageController::class, 'markRead']);

    // Téléchargement d'un document (le droit d'accès est vérifié dans le contrôleur)
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);

    // Espace client
    Route::middleware('role:user')->group(function () {
        Route::delete('/account', [ProfileController::class, 'destroy']);

        Route::get('/documents', [DocumentController::class, 'index']);

        Route::get('/requests', [ServiceRequestController::class, 'index']);
        Route::post('/requests', [ServiceRequestController::class, 'store']);
        Route::get('/requests/{serviceRequest}', [ServiceRequestController::class, 'show']);
        Route::post('/requests/{serviceRequest}/cancel', [ServiceRequestController::class, 'cancel']);
        Route::put('/requests/{serviceRequest}/review', [ReviewController::class, 'store']);

        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::post('/invoices/{invoice}/pay', [InvoiceController::class, 'pay'])->middleware('throttle:10,1');

        Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
        Route::delete('/payment-methods/{method}', [PaymentMethodController::class, 'destroy']);
    });
});

// KWABO-LOT2 (routes) : notifications, parrainage, tableau de bord, back-office
Route::middleware(['auth:sanctum', 'not.suspended'])->group(function () {
    Route::get('/counters', [DashboardController::class, 'counters']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'read']);

    Route::middleware('role:user')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'client']);
        Route::get('/referrals', [ReferralController::class, 'index']);
    });

    Route::prefix('admin')->middleware('role:admin,operator')->group(function () {
        Route::get('/dashboard', [StatsController::class, 'dashboard']);
        Route::get('/search', [SearchController::class, 'index']);

        Route::get('/requests', [RequestAdminController::class, 'index']);
        Route::get('/requests/{serviceRequest}', [RequestAdminController::class, 'show']);
        Route::patch('/requests/{serviceRequest}/status', [RequestAdminController::class, 'status']);
        Route::post('/requests/{serviceRequest}/documents', [RequestAdminController::class, 'document']);
        Route::post('/requests/{serviceRequest}/notes', [RequestAdminController::class, 'note']);

        Route::middleware('role:admin')->group(function () {
            Route::patch('/requests/{serviceRequest}/assign', [RequestAdminController::class, 'assign']);
            Route::post('/requests/{serviceRequest}/quote', [RequestAdminController::class, 'quote']);

            Route::get('/kpis', [StatsController::class, 'kpis']);

            Route::get('/invoices', [InvoiceAdminController::class, 'index']);
            Route::get('/invoices/{invoice}', [InvoiceAdminController::class, 'show']);
            Route::post('/invoices/{invoice}/refund', [InvoiceAdminController::class, 'refund']);

            Route::get('/clients', [UserAdminController::class, 'index']);
            Route::get('/clients/{client}', [UserAdminController::class, 'show']);
            Route::post('/clients/{client}/suspend', [UserAdminController::class, 'suspend']);
            Route::post('/clients/{client}/reset-link', [UserAdminController::class, 'resetLink']);
            Route::delete('/clients/{client}', [UserAdminController::class, 'destroy']);
            Route::get('/referrals', [UserAdminController::class, 'referrals']);

            Route::get('/reviews', [ReviewAdminController::class, 'index']);
            Route::patch('/reviews/{review}', [ReviewAdminController::class, 'update']);

            Route::get('/services', [ServiceAdminController::class, 'index']);
            Route::patch('/services/{service}', [ServiceAdminController::class, 'update']);

            Route::get('/team', [OperatorController::class, 'index']);
            Route::post('/operators', [OperatorController::class, 'store']);

            Route::get('/audit', [AuditLogController::class, 'index']);
        });
    });
});
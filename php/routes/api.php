<?php

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth-login');
        Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle'])->middleware('throttle:auth');
        Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback'])->middleware('throttle:auth');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:auth');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:auth');

        Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
            ->middleware(['signed', 'throttle:verification'])
            ->name('verification.verify');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::post('/email/verification-notification', [AuthController::class, 'sendEmailVerificationNotification'])
                ->middleware('throttle:verification');
        });
    });
});

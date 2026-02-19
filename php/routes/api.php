<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\UploadController;
use App\Http\Controllers\Api\V1\WorkspaceController;
use App\Http\Controllers\Api\V1\WorkspaceMemberController;
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

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/workspaces', [WorkspaceController::class, 'index']);
        Route::post('/workspaces', [WorkspaceController::class, 'store']);

        Route::middleware('workspace.member')->group(function (): void {
            Route::get('/workspaces/{workspace}', [WorkspaceController::class, 'show']);
            Route::patch('/workspaces/{workspace}', [WorkspaceController::class, 'update']);
            Route::delete('/workspaces/{workspace}', [WorkspaceController::class, 'destroy']);

            Route::get('/workspaces/{workspace}/members', [WorkspaceMemberController::class, 'index']);
            Route::post('/workspaces/{workspace}/members/invite', [WorkspaceMemberController::class, 'invite']);
            Route::patch('/workspaces/{workspace}/members/{memberId}', [WorkspaceMemberController::class, 'update'])
                ->whereNumber('memberId');
            Route::delete('/workspaces/{workspace}/members/{memberId}', [WorkspaceMemberController::class, 'destroy'])
                ->whereNumber('memberId');

            Route::get('/workspaces/{workspace}/audit-logs', [AuditLogController::class, 'index']);

            // Products
            Route::get('/workspaces/{workspace}/products', [ProductController::class, 'index']);
            Route::post('/workspaces/{workspace}/products', [ProductController::class, 'store']);
            Route::get('/workspaces/{workspace}/products/{product}', [ProductController::class, 'show']);
            Route::patch('/workspaces/{workspace}/products/{product}', [ProductController::class, 'update']);
            Route::delete('/workspaces/{workspace}/products/{product}', [ProductController::class, 'destroy']);

            // Image upload
            Route::post('/workspaces/{workspace}/uploads/products', [UploadController::class, 'uploadProductImage']);
        });
    });
});

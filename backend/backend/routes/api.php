<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\ContactController;


// ✅ Public Routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// ✅ Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'message' => 'WhatsApp Clone API is running',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});

// ✅ Protected Routes (Require Auth via Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/typing', [MessageController::class, 'typing']);
    Route::post('/messages/{senderId}/seen', [MessageController::class, 'markAsSeen']);
    Route::post('/messages/delivered', [MessageController::class, 'markAsDelivered']);
    Route::put('/messages/{id}', [MessageController::class, 'update']);
    Route::delete('/messages/{id}', [MessageController::class, 'destroy']);


    // 🔐 Auth Routes
    Route::prefix('auth')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/refresh-token', [AuthController::class, 'refreshToken']);
    });

    // 👥 Contact List Route
    Route::get('/contacts', [ContactController::class, 'index']);

    // 💬 Message Routes
    Route::prefix('messages')->group(function () {
        Route::get('/', [MessageController::class, 'index']); // All conversations
        Route::post('/', [MessageController::class, 'store']); // Send message
        Route::get('/conversation/{userId}', [MessageController::class, 'getConversation']); // Chat with user
        Route::put('/{id}/read', [MessageController::class, 'markAsRead']); // Mark as read
        Route::delete('/{id}', [MessageController::class, 'destroy']); // Delete message
    });
});

// 🧱 Fallback Route
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'API endpoint not found',
        'error' => 'The requested API endpoint does not exist'
    ], 404);
});

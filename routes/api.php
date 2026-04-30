<?php

use App\Http\Controllers\ReportController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\GmapsController;
use Illuminate\Support\Facades\Route;

Route::post('/reports', [ReportController::class, 'store']);
Route::get('/reports', [ReportController::class, 'index']);
Route::get('/reports/by-email', [ReportController::class, 'byEmail']);
Route::get('/reports/admin', [ReportController::class, 'adminIndex']);
Route::get('/reports/stats', [ReportController::class, 'stats']);
Route::get('/reports/status/{code}', [ReportController::class, 'checkStatus']);
Route::put('/reports/{id}', [ReportController::class, 'update']);
Route::delete('/reports/{id}', [ReportController::class, 'destroy']);
Route::post('/mail/health-check', [ReportController::class, 'mailHealthCheck'])->middleware('throttle:5,1');

// Google Maps URL resolver
Route::post('/gmaps/resolve', [GmapsController::class, 'resolve']);

// Locations (titik pengaduan)
Route::get('/locations', [LocationController::class, 'index']);
Route::post('/locations', [LocationController::class, 'store']);
Route::put('/locations/{id}', [LocationController::class, 'update']);
Route::delete('/locations/{id}', [LocationController::class, 'destroy']);

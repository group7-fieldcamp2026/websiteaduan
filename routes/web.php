<?php

use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->file(public_path('index.html'));
});

Route::get('/admin', function () {
    return response()->file(public_path('admin.html'));
});

Route::get('/media/{path}', [ReportController::class, 'showPhoto'])
    ->where('path', '.*');

Route::permanentRedirect('/index.html', '/');
Route::permanentRedirect('/admin.html', '/admin');

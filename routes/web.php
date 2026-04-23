<?php

use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

$resolvePublicAssetVersion = function (array $paths): string {
    clearstatcache();

    $latestModified = 0;

    foreach ($paths as $relativePath) {
        $absolutePath = public_path($relativePath);

        if (! file_exists($absolutePath)) {
            continue;
        }

        if (is_file($absolutePath)) {
            $latestModified = max($latestModified, filemtime($absolutePath) ?: 0);
            continue;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($absolutePath, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $item) {
            if ($item->isFile()) {
                $latestModified = max($latestModified, $item->getMTime());
            }
        }
    }

    return $latestModified > 0 ? gmdate('YmdHis', $latestModified) : (string) time();
};

$renderVersionedPublicHtml = function (string $file, array $versionPaths = []) use ($resolvePublicAssetVersion) {
    $absolutePath = public_path($file);

    abort_unless(is_file($absolutePath), 404);

    $html = file_get_contents($absolutePath);

    abort_if($html === false, 500, "Unable to load {$file}.");

    $version = $resolvePublicAssetVersion(array_merge([$file], $versionPaths));
    $html = str_replace('__ASSET_VERSION__', $version, $html);

    return response($html, 200, [
        'Content-Type' => 'text/html; charset=UTF-8',
        'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma' => 'no-cache',
        'Expires' => '0',
    ]);
};

Route::get('/', function () use ($renderVersionedPublicHtml) {
    return $renderVersionedPublicHtml('index.html', [
        'style.css',
        'script.js',
        'assets/logo',
    ]);
});

Route::get('/admin', function () use ($renderVersionedPublicHtml) {
    return $renderVersionedPublicHtml('admin.html', [
        'assets/logo',
    ]);
});

Route::get('/media/{path}', [ReportController::class, 'showPhoto'])
    ->where('path', '.*');

Route::redirect('/index.html', '/');
Route::redirect('/admin.html', '/admin');

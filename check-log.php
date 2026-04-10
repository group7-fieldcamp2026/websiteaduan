<?php

$logFile = 'storage/logs/laravel.log';
$content = file_get_contents($logFile);

// Cari semua ERROR entries
$errors = [];
preg_match_all('/\[.*?\]\s+local\.ERROR:.*?(?=\[.*?\]\s+local\.|$)/s', $content, $matches);

if (empty($matches[0])) {
    echo "Tidak ada ERROR di log!\n";
    exit;
}

echo "=== Last ERROR Entry ===\n\n";

// Ambil error terakhir
$lastError = array_pop($matches[0]);
echo $lastError;


<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GmapsController extends Controller
{
    public function resolve(Request $request)
    {
        $url = $request->input('url');

        if (!$url) {
            return response()->json(['error' => 'URL is required'], 400);
        }

        $url = trim($url);
        Log::info('GMaps resolve called', ['url' => $url]);

        // Try to extract coordinates directly from URL first (for URLs that already have coordinates)
        $directCoords = $this->extractCoordinatesFromUrl($url);
        if ($directCoords) {
            Log::info('GMaps direct extract success', $directCoords);
            return response()->json($directCoords);
        }

        // For short URLs, follow the redirect
        try {
            // First, get the redirect URL using HEAD with follow
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 20,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                CURLOPT_SSL_VERIFYPEER => false, // Allow self-signed for testing
                CURLOPT_SSL_VERIFYHOST => 0,
                CURLOPT_NOBODY => false,
            ]);

            $response = curl_exec($ch);
            $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            Log::info('GMaps curl result', [
                'final_url' => $finalUrl,
                'http_code' => $httpCode,
                'error' => $error
            ]);

            if ($error) {
                Log::warning('GMaps cURL error', ['error' => $error, 'url' => $url]);
                return response()->json(['error' => 'Failed to resolve URL: ' . $error], 500);
            }

            if ($httpCode >= 400) {
                return response()->json(['error' => 'Failed to access URL, HTTP ' . $httpCode], $httpCode);
            }

            // Try to extract coordinates from the final URL after redirect
            $coords = $this->extractCoordinatesFromUrl($finalUrl);
            if ($coords) {
                Log::info('GMaps extracted from final URL', $coords);
                return response()->json($coords);
            }

            // Try to extract from body
            if ($response) {
                $coords = $this->extractCoordinatesFromHtml($response);
                if ($coords) {
                    Log::info('GMaps extracted from HTML', $coords);
                    return response()->json($coords);
                }
            }

            return response()->json([
                'error' => 'Could not find coordinates',
                'debug' => [
                    'final_url' => $finalUrl,
                    'http_code' => $httpCode
                ]
            ], 404);

        } catch (\Exception $e) {
            Log::error('GMaps exception', ['exception' => $e->getMessage(), 'url' => $url]);
            return response()->json(['error' => 'Failed to resolve URL: ' . $e->getMessage()], 500);
        }
    }

    private function extractCoordinatesFromUrl($url)
    {
        // Format: https://maps.google.com/?q=-7.2756,112.7951
        if (preg_match('/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/', $url, $matches)) {
            return [
                'lat' => (float) $matches[1],
                'lng' => (float) $matches[2],
            ];
        }

        // Format: https://www.google.com/maps/@-7.2756,112.7951,17z
        if (preg_match('/@(-?\d+\.?\d*),(-?\d+\.?\d*)/', $url, $matches)) {
            return [
                'lat' => (float) $matches[1],
                'lng' => (float) $matches[2],
            ];
        }

        // Format: /maps/place/.../@lat,lng,z
        if (preg_match('/\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/', $url, $matches)) {
            return [
                'lat' => (float) $matches[1],
                'lng' => (float) $matches[2],
            ];
        }

        // Format: /maps/search/...@lat,lng
        if (preg_match('/search\/.*@(-?\d+\.?\d*),(-?\d+\.?\d*)/', $url, $matches)) {
            return [
                'lat' => (float) $matches[1],
                'lng' => (float) $matches[2],
            ];
        }

        return null;
    }

    private function extractCoordinatesFromHtml($html)
    {
        // Look for Google Maps data in the page
        // Pattern: "lat":number
        if (preg_match('/"lat"\s*:\s*(-?\d+\.?\d+)/', $html, $latMatch) &&
            preg_match('/"lng"\s*:\s*(-?\d+\.?\d+)/', $html, $lngMatch)) {
            return [
                'lat' => (float) $latMatch[1],
                'lng' => (float) $lngMatch[1],
            ];
        }

        // Pattern: latitude:
        if (preg_match('/latitude\s*:\s*(-?\d+\.?\d+)/i', $html, $latMatch) &&
            preg_match('/longitude\s*:\s*(-?\d+\.?\d+)/i', $html, $lngMatch)) {
            return [
                'lat' => (float) $latMatch[1],
                'lng' => (float) $lngMatch[1],
            ];
        }

        // Pattern: data-lat
        if (preg_match('/data-lat\s*=\s*"(-?\d+\.?\d+)"/', $html, $latMatch) &&
            preg_match('/data-lng\s*=\s*"(-?\d+\.?\d+)"/', $html, $lngMatch)) {
            return [
                'lat' => (float) $latMatch[1],
                'lng' => (float) $lngMatch[1],
            ];
        }

        // Pattern: @lat,lng in any embed string
        if (preg_match('/@"([^"]+),([^"]+)"[^}]*zoom/', $html, $matches)) {
            $lat = (float) trim($matches[1]);
            $lng = (float) trim($matches[2]);
            if ($lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180) {
                return ['lat' => $lat, 'lng' => $lng];
            }
        }

        return null;
    }
}
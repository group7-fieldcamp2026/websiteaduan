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

        // Try to extract coordinates directly from URL first (for URLs that already have coordinates)
        $directCoords = $this->extractCoordinatesFromUrl($url);
        if ($directCoords) {
            return response()->json($directCoords);
        }

        // For short URLs, follow the redirect to get the final URL with coordinates
        try {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 15,
                CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                CURLOPT_SSL_VERIFYPEER => true,
            ]);

            $response = curl_exec($ch);
            $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                Log::warning('cURL error resolving GMaps URL', ['error' => $error, 'url' => $url]);
                return response()->json(['error' => 'Failed to resolve URL: ' . $error], 500);
            }

            if ($httpCode >= 400) {
                return response()->json(['error' => 'Failed to access URL, HTTP ' . $httpCode], $httpCode);
            }

            // Try to extract coordinates from the final URL after redirect
            $coords = $this->extractCoordinatesFromUrl($finalUrl);
            if ($coords) {
                return response()->json($coords);
            }

            // Try to extract from the response body (HTML page might contain coordinates in meta tags)
            if ($response) {
                $coords = $this->extractCoordinatesFromHtml($response);
                if ($coords) {
                    return response()->json($coords);
                }
            }

            return response()->json(['error' => 'Could not find coordinates in URL'], 404);

        } catch (\Exception $e) {
            Log::error('Exception resolving GMaps URL', ['exception' => $e->getMessage(), 'url' => $url]);
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

        // Format: https://www.google.com/maps/search/-7.2756,112.7951
        if (preg_match('/search\/(-?\d+\.?\d*),(-?\d+\.?\d*)/', $url, $matches)) {
            return [
                'lat' => (float) $matches[1],
                'lng' => (float) $matches[2],
            ];
        }

        return null;
    }

    private function extractCoordinatesFromHtml($html)
    {
        // Try to find coordinates in Google Maps embed or meta tags
        // Look for "lat" and "lng" in JavaScript variables
        if (preg_match('/"lat"\s*:\s*(-?\d+\.?\d+)/', $html, $latMatch) &&
            preg_match('/"lng"\s*:\s*(-?\d+\.?\d+)/', $html, $lngMatch)) {
            return [
                'lat' => (float) $latMatch[1],
                'lng' => (float) $lngMatch[1],
            ];
        }

        // Look for @lat,lng pattern in embed scripts
        if (preg_match('/@"([^,"]+\.[^,"]+),([^,"]+\.[^,"]+)"/', $html, $matches)) {
            $lat = (float) $matches[1];
            $lng = (float) $matches[2];
            // Filter out likely non-coordinates (should be around -90 to 90)
            if ($lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180) {
                return ['lat' => $lat, 'lng' => $lng];
            }
        }

        return null;
    }
}
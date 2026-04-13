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

        // For short URLs, follow the redirect using multiple methods
        $result = $this->resolveShortUrl($url);
        
        if ($result) {
            return response()->json($result);
        }

        return response()->json([
            'error' => 'Could not find coordinates from this URL. Please use a longer Google Maps URL or enter coordinates manually.',
            'hint' => 'In Google Maps: Click Share → Copy link (choose the longer format)'
        ], 404);
    }

    private function resolveShortUrl($url)
    {
        // Method 1: cURL with proper options
        $result = $this->curlResolve($url);
        if ($result) return $result;

        // Method 2: file_get_contents with stream context
        $result = $this->fileGetContentsResolve($url);
        if ($result) return $result;

        // Method 3: Try using Guzzle if available (more robust)
        if (class_exists('\Illuminate\Support\Facades\Http')) {
            try {
                $response = \Illuminate\Support\Facades\Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                ])->timeout(15)->redirect(10)->get($url);
                
                $finalUrl = $response->effectiveUri();
                $coords = $this->extractCoordinatesFromUrl((string) $finalUrl);
                if ($coords) return $coords;
            } catch (\Exception $e) {
                Log::info('Guzzle resolve failed: ' . $e->getMessage());
            }
        }

        return null;
    }

    private function curlResolve($url)
    {
        try {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 15,
                CURLOPT_TIMEOUT => 25,
                CURLOPT_CONNECTTIMEOUT => 15,
                CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_COOKIEJAR => '',
                CURLOPT_COOKIEFILE => '',
                CURLOPT_ENCODING => '',
            ]);

            $response = curl_exec($ch);
            $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            Log::info('Curl result', [
                'final_url' => $finalUrl,
                'http_code' => $httpCode,
                'has_response' => !empty($response),
                'error' => $error
            ]);

            if ($error) {
                Log::warning('Curl error: ' . $error);
                return null;
            }

            // Try to extract from final URL
            $coords = $this->extractCoordinatesFromUrl($finalUrl);
            if ($coords) {
                return $coords;
            }

            // Try from response body
            if ($response) {
                $coords = $this->extractCoordinatesFromHtml($response);
                if ($coords) {
                    return $coords;
                }
            }

            return null;

        } catch (\Exception $e) {
            Log::error('Curl exception: ' . $e->getMessage());
            return null;
        }
    }

    private function fileGetContentsResolve($url)
    {
        try {
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n",
                    'timeout' => 15,
                    'follow_location' => 1,
                    'max_redirects' => 10,
                ],
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                ],
            ]);

            $response = @file_get_contents($url, false, $context);
            
            if ($response === false) {
                return null;
            }

            // Get final URL from headers
            $finalUrl = null;
            if (isset($http_response_header)) {
                foreach ($http_response_header as $header) {
                    if (preg_match('/^Location:\s*(.+)$/i', $header, $matches)) {
                        $finalUrl = trim($matches[1]);
                    }
                }
            }

            if ($finalUrl) {
                $coords = $this->extractCoordinatesFromUrl($finalUrl);
                if ($coords) return $coords;
            }

            $coords = $this->extractCoordinatesFromHtml($response);
            if ($coords) return $coords;

            return null;

        } catch (\Exception $e) {
            Log::error('file_get_contents exception: ' . $e->getMessage());
            return null;
        }
    }

    private function extractCoordinatesFromUrl($url)
    {
        if (preg_match('/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/', $url, $matches)) {
            return ['lat' => (float) $matches[1], 'lng' => (float) $matches[2]];
        }

        if (preg_match('/@(-?\d+\.?\d*),(-?\d+\.?\d*)/', $url, $matches)) {
            return ['lat' => (float) $matches[1], 'lng' => (float) $matches[2]];
        }

        if (preg_match('/\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/', $url, $matches)) {
            return ['lat' => (float) $matches[1], 'lng' => (float) $matches[2]];
        }

        return null;
    }

    private function extractCoordinatesFromHtml($html)
    {
        if (preg_match('/"lat"\s*:\s*(-?\d+\.?\d+)/', $html, $latMatch) &&
            preg_match('/"lng"\s*:\s*(-?\d+\.?\d+)/', $html, $lngMatch)) {
            return ['lat' => (float) $latMatch[1], 'lng' => (float) $lngMatch[1]];
        }

        if (preg_match('/latitude\s*:\s*(-?\d+\.?\d+)/i', $html, $latMatch) &&
            preg_match('/longitude\s*:\s*(-?\d+\.?\d+)/i', $html, $lngMatch)) {
            return ['lat' => (float) $latMatch[1], 'lng' => (float) $lngMatch[1]];
        }

        return null;
    }
}
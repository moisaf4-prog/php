<?php
/**
 * Simple JWT Implementation
 */

class JWT {
    
    public static function encode($payload, $secret) {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        
        $segments = [];
        $segments[] = self::base64UrlEncode(json_encode($header));
        $segments[] = self::base64UrlEncode(json_encode($payload));
        
        $signingInput = implode('.', $segments);
        $signature = self::sign($signingInput, $secret);
        $segments[] = self::base64UrlEncode($signature);
        
        return implode('.', $segments);
    }
    
    public static function decode($token, $secret) {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            throw new Exception('Invalid token format');
        }
        
        list($header64, $payload64, $signature64) = $parts;
        
        $header = json_decode(self::base64UrlDecode($header64), true);
        $payload = json_decode(self::base64UrlDecode($payload64), true);
        $signature = self::base64UrlDecode($signature64);
        
        // Verify signature
        $signingInput = $header64 . '.' . $payload64;
        $expectedSignature = self::sign($signingInput, $secret);
        
        if (!hash_equals($expectedSignature, $signature)) {
            throw new Exception('Invalid signature');
        }
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token expired');
        }
        
        return $payload;
    }
    
    private static function sign($input, $secret) {
        return hash_hmac('sha256', $input, $secret, true);
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

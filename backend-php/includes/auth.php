<?php
/**
 * Authentication Functions
 */

require_once __DIR__ . '/jwt.php';

/**
 * Hash password using bcrypt
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Create JWT token
 */
function createToken($userId, $role) {
    $payload = [
        'sub' => $userId,
        'role' => $role,
        'iat' => time(),
        'exp' => time() + JWT_EXPIRATION
    ];
    return JWT::encode($payload, JWT_SECRET);
}

/**
 * Verify JWT token and return payload
 */
function verifyToken($token) {
    try {
        return JWT::decode($token, JWT_SECRET);
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Get current user from Authorization header
 */
function getCurrentUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        return null;
    }
    
    $token = $matches[1];
    $payload = verifyToken($token);
    
    if (!$payload || !isset($payload['sub'])) {
        return null;
    }
    
    // Get user from database
    $user = db()->fetchOne(
        "SELECT id, username, telegram_id, role, plan, plan_expires, api_key FROM users WHERE id = ?",
        [$payload['sub']]
    );
    
    return $user;
}

/**
 * Require authentication
 */
function requireAuth() {
    $user = getCurrentUser();
    if (!$user) {
        http_response_code(401);
        die(json_encode(['detail' => 'Missing or invalid token']));
    }
    return $user;
}

/**
 * Require admin role
 */
function requireAdmin() {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        die(json_encode(['detail' => 'Admin access required']));
    }
    return $user;
}

/**
 * Get user by API key
 */
function getUserByApiKey() {
    $headers = getallheaders();
    $apiKey = $headers['X-API-Key'] ?? $headers['x-api-key'] ?? '';
    
    if (empty($apiKey)) {
        return null;
    }
    
    return db()->fetchOne(
        "SELECT id, username, role, plan, plan_expires FROM users WHERE api_key = ?",
        [$apiKey]
    );
}

/**
 * Generate API key
 */
function generateApiKey() {
    return 'l7t_' . bin2hex(random_bytes(32));
}

/**
 * Generate UUID
 */
function generateUUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

<?php
/**
 * User Registration
 */

$data = getJsonBody();
validateRequired($data, ['username', 'password']);

$username = sanitize($data['username']);
$password = $data['password'];
$telegramId = sanitize($data['telegram_id'] ?? '');

// Validate username
if (strlen($username) < 3 || strlen($username) > 50) {
    errorResponse('Username must be 3-50 characters', 400);
}

if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    errorResponse('Username can only contain letters, numbers and underscores', 400);
}

// Validate password
if (strlen($password) < 6) {
    errorResponse('Password must be at least 6 characters', 400);
}

// Check if username exists
$existing = db()->fetchOne("SELECT id FROM users WHERE username = ?", [$username]);
if ($existing) {
    errorResponse('Username already exists', 400);
}

// Create user
$userId = generateUUID();
$passwordHash = hashPassword($password);
$apiKey = generateApiKey();

db()->insert('users', [
    'id' => $userId,
    'username' => $username,
    'password_hash' => $passwordHash,
    'telegram_id' => $telegramId,
    'role' => 'user',
    'plan' => 'free',
    'api_key' => $apiKey
]);

$token = createToken($userId, 'user');

jsonResponse([
    'token' => $token,
    'user' => [
        'id' => $userId,
        'username' => $username,
        'telegram_id' => $telegramId,
        'role' => 'user',
        'plan' => 'free',
        'api_key' => $apiKey
    ]
], 201);

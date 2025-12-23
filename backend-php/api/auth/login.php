<?php
/**
 * User Login
 */

$data = getJsonBody();
validateRequired($data, ['username', 'password']);

$username = sanitize($data['username']);
$password = $data['password'];

// Get user
$user = db()->fetchOne(
    "SELECT * FROM users WHERE username = ?",
    [$username]
);

if (!$user || !verifyPassword($password, $user['password_hash'])) {
    errorResponse('Invalid credentials', 401);
}

$token = createToken($user['id'], $user['role']);

jsonResponse([
    'token' => $token,
    'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'telegram_id' => $user['telegram_id'],
        'role' => $user['role'],
        'plan' => $user['plan'],
        'plan_expires' => $user['plan_expires'],
        'api_key' => $user['api_key']
    ]
]);

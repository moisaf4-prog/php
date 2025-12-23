<?php
/**
 * Update user profile
 */

$user = requireAuth();
$data = getJsonBody();

$updates = [];
$params = [];

if (isset($data['telegram_id'])) {
    $updates[] = 'telegram_id = ?';
    $params[] = sanitize($data['telegram_id']);
}

if (isset($data['current_password']) && isset($data['new_password'])) {
    // Verify current password
    $fullUser = db()->fetchOne("SELECT password_hash FROM users WHERE id = ?", [$user['id']]);
    
    if (!verifyPassword($data['current_password'], $fullUser['password_hash'])) {
        errorResponse('Current password is incorrect', 400);
    }
    
    if (strlen($data['new_password']) < 6) {
        errorResponse('New password must be at least 6 characters', 400);
    }
    
    $updates[] = 'password_hash = ?';
    $params[] = hashPassword($data['new_password']);
}

if (empty($updates)) {
    errorResponse('No data to update', 400);
}

$params[] = $user['id'];
db()->query(
    "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?",
    $params
);

jsonResponse(['message' => 'Profile updated']);

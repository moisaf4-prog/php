<?php
/**
 * Update user role (admin)
 */

requireAdmin();

$userId = $_REQUEST['user_id'] ?? '';
$data = getJsonBody();

if (empty($userId)) {
    errorResponse('User ID required', 400);
}

if (!isset($data['role']) || !in_array($data['role'], ['user', 'admin'])) {
    errorResponse('Valid role required (user/admin)', 400);
}

// Check if user exists
$user = db()->fetchOne("SELECT id FROM users WHERE id = ?", [$userId]);
if (!$user) {
    errorResponse('User not found', 404);
}

db()->update('users', ['role' => $data['role']], 'id = ?', [$userId]);

jsonResponse(['message' => 'Role updated successfully']);

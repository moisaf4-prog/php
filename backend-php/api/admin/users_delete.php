<?php
/**
 * Delete user (admin)
 */

requireAdmin();

$userId = $_REQUEST['user_id'] ?? '';

if (empty($userId)) {
    errorResponse('User ID required', 400);
}

// Check if user exists
$user = db()->fetchOne("SELECT id, role FROM users WHERE id = ?", [$userId]);
if (!$user) {
    errorResponse('User not found', 404);
}

// Prevent deleting admin
if ($user['role'] === 'admin') {
    errorResponse('Cannot delete admin user', 400);
}

// Delete user (cascade will handle attacks)
db()->delete('users', 'id = ?', [$userId]);

jsonResponse(['message' => 'User deleted successfully']);

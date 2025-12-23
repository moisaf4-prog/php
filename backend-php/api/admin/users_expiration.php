<?php
/**
 * Update user plan expiration (admin)
 */

requireAdmin();

$userId = $_REQUEST['user_id'] ?? '';
$data = getJsonBody();

if (empty($userId)) {
    errorResponse('User ID required', 400);
}

// Check if user exists
$user = db()->fetchOne("SELECT id FROM users WHERE id = ?", [$userId]);
if (!$user) {
    errorResponse('User not found', 404);
}

$planExpires = null;
if (isset($data['plan_expires']) && !empty($data['plan_expires'])) {
    $planExpires = date('Y-m-d H:i:s', strtotime($data['plan_expires']));
}

db()->update('users', [
    'plan_expires' => $planExpires
], 'id = ?', [$userId]);

jsonResponse(['message' => 'Expiration updated successfully']);

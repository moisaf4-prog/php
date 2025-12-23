<?php
/**
 * Update user plan (admin)
 */

requireAdmin();

$userId = $_REQUEST['user_id'] ?? '';
$data = getJsonBody();

// Support query param OR body
$planId = $_GET['plan_id'] ?? $data['plan'] ?? null;

if (empty($userId)) {
    errorResponse('User ID required', 400);
}

if (!$planId) {
    errorResponse('Plan required', 400);
}

// Check if user exists
$user = db()->fetchOne("SELECT id FROM users WHERE id = ?", [$userId]);
if (!$user) {
    errorResponse('User not found', 404);
}

// Check if plan exists
$plan = db()->fetchOne("SELECT id, duration_days FROM plans WHERE id = ?", [$planId]);
if (!$plan) {
    errorResponse('Plan not found', 404);
}

// Calculate expiration
$planExpires = null;
if ($plan['duration_days'] > 0) {
    $planExpires = date('Y-m-d H:i:s', strtotime("+{$plan['duration_days']} days"));
}

db()->update('users', [
    'plan' => $planId,
    'plan_expires' => $planExpires
], 'id = ?', [$userId]);

jsonResponse(['message' => 'Plan updated successfully']);

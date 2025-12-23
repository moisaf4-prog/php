<?php
/**
 * Delete plan (admin)
 */

requireAdmin();

$planId = $_REQUEST['plan_id'] ?? '';

if (empty($planId)) {
    errorResponse('Plan ID required', 400);
}

// Prevent deleting free plan
if ($planId === 'free') {
    errorResponse('Cannot delete free plan', 400);
}

// Check if plan exists
$plan = db()->fetchOne("SELECT id FROM plans WHERE id = ?", [$planId]);
if (!$plan) {
    errorResponse('Plan not found', 404);
}

// Reset users with this plan to free
db()->update('users', ['plan' => 'free', 'plan_expires' => null], 'plan = ?', [$planId]);

// Delete plan methods
db()->delete('plan_methods', 'plan_id = ?', [$planId]);

// Delete plan
db()->delete('plans', 'id = ?', [$planId]);

jsonResponse(['message' => 'Plan deleted successfully']);

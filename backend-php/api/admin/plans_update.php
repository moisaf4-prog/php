<?php
/**
 * Update plan (admin)
 */

requireAdmin();

$planId = $_REQUEST['plan_id'] ?? '';
$data = getJsonBody();

if (empty($planId)) {
    errorResponse('Plan ID required', 400);
}

// Check if plan exists
$plan = db()->fetchOne("SELECT id FROM plans WHERE id = ?", [$planId]);
if (!$plan) {
    errorResponse('Plan not found', 404);
}

$updateData = [];
if (isset($data['name'])) $updateData['name'] = sanitize($data['name']);
if (isset($data['price'])) $updateData['price'] = floatval($data['price']);
if (isset($data['max_time'])) $updateData['max_time'] = intval($data['max_time']);
if (isset($data['max_concurrent'])) $updateData['max_concurrent'] = intval($data['max_concurrent']);
if (isset($data['duration_days'])) $updateData['duration_days'] = intval($data['duration_days']);

if (!empty($updateData)) {
    db()->update('plans', $updateData, 'id = ?', [$planId]);
}

// Update methods if provided
if (isset($data['methods'])) {
    // Remove existing
    db()->delete('plan_methods', 'plan_id = ?', [$planId]);
    // Add new
    foreach ($data['methods'] as $methodId) {
        db()->query(
            "INSERT IGNORE INTO plan_methods (plan_id, method_id) VALUES (?, ?)",
            [$planId, $methodId]
        );
    }
}

jsonResponse(['message' => 'Plan updated successfully']);

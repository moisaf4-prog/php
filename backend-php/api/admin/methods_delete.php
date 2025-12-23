<?php
/**
 * Delete attack method (admin)
 * Cascade deletes: server_methods, plan_methods
 */

requireAdmin();

$methodId = $_REQUEST['method_id'] ?? '';

if (empty($methodId)) {
    errorResponse('Method ID required', 400);
}

// Check if method exists
$method = db()->fetchOne("SELECT id FROM attack_methods WHERE id = ?", [$methodId]);
if (!$method) {
    errorResponse('Method not found', 404);
}

// Delete from plan_methods
db()->delete('plan_methods', 'method_id = ?', [$methodId]);

// Delete from server_methods
db()->delete('server_methods', 'method_id = ?', [$methodId]);

// Delete method
db()->delete('attack_methods', 'id = ?', [$methodId]);

jsonResponse(['message' => 'Method deleted successfully']);

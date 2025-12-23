<?php
/**
 * Update attack method (admin)
 */

requireAdmin();

$methodId = $_REQUEST['method_id'] ?? '';
$data = getJsonBody();

if (empty($methodId)) {
    errorResponse('Method ID required', 400);
}

// Check if method exists
$method = db()->fetchOne("SELECT id FROM attack_methods WHERE id = ?", [$methodId]);
if (!$method) {
    errorResponse('Method not found', 404);
}

$updateData = [];
if (isset($data['name'])) $updateData['name'] = sanitize($data['name']);
if (isset($data['description'])) $updateData['description'] = sanitize($data['description'], true);
if (isset($data['tags'])) $updateData['tags'] = json_encode($data['tags']);

if (!empty($updateData)) {
    db()->update('attack_methods', $updateData, 'id = ?', [$methodId]);
}

jsonResponse(['message' => 'Method updated successfully']);

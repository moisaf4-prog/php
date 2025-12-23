<?php
/**
 * Delete server
 */

requireAdmin();
$serverId = $_REQUEST['server_id'] ?? '';

if (empty($serverId)) {
    errorResponse('Server ID required', 400);
}

$deleted = db()->delete('attack_servers', 'id = ?', [$serverId]);

if ($deleted === 0) {
    errorResponse('Server not found', 404);
}

jsonResponse(['message' => 'Server deleted']);

<?php
/**
 * Update server
 */

requireAdmin();
$serverId = $_REQUEST['server_id'] ?? '';
$data = getJsonBody();

if (empty($serverId)) {
    errorResponse('Server ID required', 400);
}

$server = db()->fetchOne("SELECT * FROM attack_servers WHERE id = ?", [$serverId]);
if (!$server) {
    errorResponse('Server not found', 404);
}

$updates = [];
$params = [];

$fields = ['name', 'host', 'ssh_port', 'ssh_user', 'ssh_password', 'max_concurrent', 
           'start_command', 'stop_command', 'is_active'];

foreach ($fields as $field) {
    if (isset($data[$field])) {
        $updates[] = "$field = ?";
        $params[] = $data[$field];
    }
}

if (!empty($updates)) {
    $params[] = $serverId;
    db()->query(
        "UPDATE attack_servers SET " . implode(', ', $updates) . " WHERE id = ?",
        $params
    );
}

// Update method commands
if (isset($data['method_commands']) && is_array($data['method_commands'])) {
    // Delete old commands
    db()->delete('server_methods', 'server_id = ?', [$serverId]);
    
    // Insert new commands
    foreach ($data['method_commands'] as $mc) {
        if (!empty($mc['method_id']) && !empty($mc['command'])) {
            db()->insert('server_methods', [
                'server_id' => $serverId,
                'method_id' => sanitize($mc['method_id']),
                'command' => $mc['command']
            ]);
        }
    }
}

jsonResponse(['message' => 'Server updated']);

<?php
/**
 * Create new server
 */

requireAdmin();
$data = getJsonBody();

validateRequired($data, ['name', 'host']);

$serverId = generateUUID();

db()->insert('attack_servers', [
    'id' => $serverId,
    'name' => sanitize($data['name']),
    'host' => sanitize($data['host']),
    'ssh_port' => (int)($data['ssh_port'] ?? 22),
    'ssh_user' => sanitize($data['ssh_user'] ?? 'root'),
    'ssh_password' => $data['ssh_password'] ?? null,
    'max_concurrent' => (int)($data['max_concurrent'] ?? 100),
    'start_command' => $data['start_command'] ?? 'screen -dmS {screen_name} {command}',
    'stop_command' => $data['stop_command'] ?? "screen -S {screen_name} -X quit 2>/dev/null; pkill -9 -f '{screen_name}' 2>/dev/null || true"
]);

// Add method commands
if (!empty($data['method_commands']) && is_array($data['method_commands'])) {
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

jsonResponse(['id' => $serverId, 'message' => 'Server created'], 201);

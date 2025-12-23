<?php
/**
 * Stop attack
 */

$user = requireAuth();
$attackId = $_REQUEST['attack_id'] ?? '';

if (empty($attackId)) {
    errorResponse('Attack ID required', 400);
}

// Get attack
$attack = db()->fetchOne(
    "SELECT * FROM attacks WHERE id = ? AND user_id = ?",
    [$attackId, $user['id']]
);

if (!$attack) {
    errorResponse('Attack not found', 404);
}

if ($attack['status'] !== 'running') {
    errorResponse('Attack is not running', 400);
}

// Get server
$server = db()->fetchOne(
    "SELECT * FROM attack_servers WHERE id = ?",
    [$attack['server_id']]
);

// Build stop command
if ($server && $attack['screen_name']) {
    $stopCmd = $server['stop_command'] ?? "screen -S {screen_name} -X quit 2>/dev/null; pkill -9 -f '{screen_name}' 2>/dev/null || true";
    $stopCommand = str_replace('{screen_name}', $attack['screen_name'], $stopCmd);
    $stopCommand = str_replace('{username}', $attack['username'], $stopCommand);
    $stopCommand = str_replace('{attack_id}', $attackId, $stopCommand);
    
    // Execute stop command via SSH
    if (function_exists('ssh2_connect')) {
        try {
            $connection = ssh2_connect($server['host'], $server['ssh_port'] ?? 22);
            if ($connection && ssh2_auth_password($connection, $server['ssh_user'], $server['ssh_password'])) {
                $stream = ssh2_exec($connection, $stopCommand);
                fclose($stream);
            }
        } catch (Exception $e) {
            error_log('SSH Error stopping attack: ' . $e->getMessage());
        }
    }
}

// Update attack status
db()->update(
    'attacks',
    ['status' => 'stopped', 'ended_at' => date('Y-m-d H:i:s')],
    'id = ?',
    [$attackId]
);

// Release server load
db()->query(
    "UPDATE attack_servers SET current_load = GREATEST(0, current_load - ?) WHERE id = ?",
    [$attack['concurrents'], $attack['server_id']]
);

// Cooldown
sleep(1);

jsonResponse(['message' => 'Attack stopped']);

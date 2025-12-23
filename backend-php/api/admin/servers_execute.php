<?php
/**
 * Execute command on server via SSH (admin terminal)
 */

requireAdmin();

$serverId = $_REQUEST['server_id'] ?? '';
$data = getJsonBody();

if (empty($serverId)) {
    errorResponse('Server ID required', 400);
}

if (!isset($data['command']) || empty(trim($data['command']))) {
    errorResponse('Command required', 400);
}

// Get server
$server = db()->fetchOne(
    "SELECT * FROM attack_servers WHERE id = ?",
    [$serverId]
);

if (!$server) {
    errorResponse('Server not found', 404);
}

$command = trim($data['command']);

// Whitelist of allowed commands for security
$allowedPrefixes = [
    'ls', 'pwd', 'whoami', 'hostname', 'uptime', 'df', 'free', 'top -bn1',
    'cat /proc/cpuinfo', 'cat /proc/meminfo', 'ps aux', 'netstat', 'ss',
    'screen -list', 'screen -ls', 'pkill', 'kill', 'echo', 'date', 'w'
];

$isAllowed = false;
foreach ($allowedPrefixes as $prefix) {
    if (strpos($command, $prefix) === 0) {
        $isAllowed = true;
        break;
    }
}

if (!$isAllowed) {
    errorResponse('Command not allowed. Allowed: ' . implode(', ', $allowedPrefixes), 403);
}

// Execute via SSH using phpseclib would be ideal, but we'll use shell command for now
// This is a simplified version - in production use phpseclib
try {
    $sshCommand = sprintf(
        "sshpass -p %s ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p %d %s@%s %s 2>&1",
        escapeshellarg($server['ssh_password'] ?? ''),
        $server['ssh_port'],
        escapeshellarg($server['ssh_user']),
        escapeshellarg($server['host']),
        escapeshellarg($command)
    );
    
    $output = shell_exec($sshCommand);
    
    jsonResponse([
        'output' => $output ?? 'Command executed (no output)',
        'command' => $command
    ]);
} catch (Exception $e) {
    errorResponse('SSH execution failed: ' . $e->getMessage(), 500);
}

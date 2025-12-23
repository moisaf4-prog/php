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
    'screen -list', 'screen -ls', 'pkill', 'kill', 'echo', 'date', 'w',
    'cd', 'head', 'tail', 'grep', 'wc', 'du', 'find', 'which', 'env'
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

$output = null;
$error = null;

// Try SSH2 extension first (preferred)
if (function_exists('ssh2_connect')) {
    try {
        $connection = @ssh2_connect($server['host'], $server['ssh_port'] ?? 22);
        
        if ($connection) {
            $authResult = false;
            
            if (!empty($server['ssh_password'])) {
                $authResult = @ssh2_auth_password($connection, $server['ssh_user'], $server['ssh_password']);
            }
            
            if ($authResult) {
                $stream = ssh2_exec($connection, $command);
                stream_set_blocking($stream, true);
                $output = stream_get_contents($stream);
                fclose($stream);
            } else {
                $error = 'SSH authentication failed';
            }
        } else {
            $error = 'SSH connection failed';
        }
    } catch (Exception $e) {
        $error = 'SSH error: ' . $e->getMessage();
    }
} else {
    // Fallback to sshpass
    $sshCommand = sprintf(
        "sshpass -p %s ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p %d %s@%s %s 2>&1",
        escapeshellarg($server['ssh_password'] ?? ''),
        $server['ssh_port'] ?? 22,
        escapeshellarg($server['ssh_user']),
        escapeshellarg($server['host']),
        escapeshellarg($command)
    );
    
    $output = shell_exec($sshCommand);
    
    if ($output === null) {
        $error = 'Command execution failed';
    }
}

if ($error) {
    jsonResponse([
        'output' => $error,
        'command' => $command,
        'error' => true
    ]);
} else {
    jsonResponse([
        'output' => $output ?: '(no output)',
        'command' => $command
    ]);
}

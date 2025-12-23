<?php
/**
 * Ping server (get stats via SSH)
 */

requireAdmin();
$serverId = $_REQUEST['server_id'] ?? '';

if (empty($serverId)) {
    errorResponse('Server ID required', 400);
}

$server = db()->fetchOne("SELECT * FROM attack_servers WHERE id = ?", [$serverId]);
if (!$server) {
    errorResponse('Server not found', 404);
}

$stats = [
    'status' => 'offline',
    'cpu_usage' => 0,
    'ram_used' => 0,
    'ram_total' => 0,
    'cpu_model' => 'N/A',
    'cpu_cores' => 1,
    'uptime' => 'N/A',
    'error' => null
];

// Try SSH connection
if (function_exists('ssh2_connect')) {
    try {
        $connection = @ssh2_connect($server['host'], $server['ssh_port'] ?? 22, [], [], 10);
        
        if ($connection) {
            $authResult = false;
            
            if (!empty($server['ssh_password'])) {
                $authResult = @ssh2_auth_password($connection, $server['ssh_user'], $server['ssh_password']);
            }
            
            if ($authResult) {
                $stats['status'] = 'online';
                
                // Get CPU model
                $stream = ssh2_exec($connection, "cat /proc/cpuinfo | grep 'model name' | head -1 | cut -d':' -f2");
                stream_set_blocking($stream, true);
                $stats['cpu_model'] = trim(stream_get_contents($stream));
                fclose($stream);
                
                // Get CPU cores
                $stream = ssh2_exec($connection, "nproc");
                stream_set_blocking($stream, true);
                $stats['cpu_cores'] = (int)trim(stream_get_contents($stream));
                fclose($stream);
                
                // Get RAM info
                $stream = ssh2_exec($connection, "cat /proc/meminfo | head -3");
                stream_set_blocking($stream, true);
                $memInfo = stream_get_contents($stream);
                fclose($stream);
                
                if (preg_match('/MemTotal:\s+(\d+)/', $memInfo, $m)) {
                    $stats['ram_total'] = round($m[1] / 1024 / 1024, 1);
                }
                if (preg_match('/MemAvailable:\s+(\d+)/', $memInfo, $m)) {
                    $stats['ram_used'] = round($stats['ram_total'] - ($m[1] / 1024 / 1024), 1);
                }
                
                // Get CPU usage
                $stream = ssh2_exec($connection, "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
                stream_set_blocking($stream, true);
                $cpuOutput = trim(stream_get_contents($stream));
                fclose($stream);
                $stats['cpu_usage'] = floatval($cpuOutput);
                
                // Get uptime
                $stream = ssh2_exec($connection, "uptime -p 2>/dev/null || uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}'");
                stream_set_blocking($stream, true);
                $stats['uptime'] = trim(stream_get_contents($stream));
                fclose($stream);
            } else {
                $stats['error'] = 'Authentication failed';
            }
        } else {
            $stats['error'] = 'Connection failed';
        }
    } catch (Exception $e) {
        $stats['error'] = $e->getMessage();
    }
} else {
    // SSH2 extension not available - simulate with basic check
    $fp = @fsockopen($server['host'], $server['ssh_port'] ?? 22, $errno, $errstr, 5);
    if ($fp) {
        $stats['status'] = 'online';
        fclose($fp);
    } else {
        $stats['error'] = 'Cannot connect to server';
    }
}

// Update database
db()->update(
    'attack_servers',
    [
        'status' => $stats['status'],
        'cpu_usage' => $stats['cpu_usage'],
        'ram_used' => $stats['ram_used'],
        'ram_total' => $stats['ram_total'],
        'cpu_model' => $stats['cpu_model'],
        'cpu_cores' => $stats['cpu_cores'],
        'uptime' => $stats['uptime'],
        'last_ping' => date('Y-m-d H:i:s')
    ],
    'id = ?',
    [$serverId]
);

jsonResponse($stats);

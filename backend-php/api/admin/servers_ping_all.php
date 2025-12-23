<?php
/**
 * Ping all servers - get real SSH stats
 */

requireAdmin();

$servers = db()->fetchAll("SELECT * FROM attack_servers WHERE is_active = 1");
$results = [];

foreach ($servers as $server) {
    $stats = [
        'id' => $server['id'],
        'name' => $server['name'],
        'status' => 'offline',
        'cpu_usage' => 0,
        'ram_used' => 0,
        'ram_total' => 0,
        'cpu_model' => 'N/A',
        'cpu_cores' => 1,
        'uptime' => 'N/A',
        'error' => null
    ];
    
    // Try SSH2 extension
    if (function_exists('ssh2_connect')) {
        $connection = @ssh2_connect($server['host'], $server['ssh_port'] ?? 22);
        
        if ($connection) {
            $authResult = false;
            
            if (!empty($server['ssh_password'])) {
                $authResult = @ssh2_auth_password($connection, $server['ssh_user'], $server['ssh_password']);
            }
            
            if ($authResult) {
                $stats['status'] = 'online';
                
                // Get CPU model
                $stream = @ssh2_exec($connection, "cat /proc/cpuinfo | grep 'model name' | head -1 | cut -d':' -f2");
                if ($stream) {
                    stream_set_blocking($stream, true);
                    $stats['cpu_model'] = trim(stream_get_contents($stream)) ?: 'Unknown';
                    fclose($stream);
                }
                
                // Get CPU cores
                $stream = @ssh2_exec($connection, "nproc");
                if ($stream) {
                    stream_set_blocking($stream, true);
                    $stats['cpu_cores'] = (int)trim(stream_get_contents($stream)) ?: 1;
                    fclose($stream);
                }
                
                // Get RAM info
                $stream = @ssh2_exec($connection, "cat /proc/meminfo | head -3");
                if ($stream) {
                    stream_set_blocking($stream, true);
                    $memInfo = stream_get_contents($stream);
                    fclose($stream);
                    
                    if (preg_match('/MemTotal:\s+(\d+)/', $memInfo, $m)) {
                        $stats['ram_total'] = round($m[1] / 1024 / 1024, 1);
                    }
                    if (preg_match('/MemAvailable:\s+(\d+)/', $memInfo, $m)) {
                        $stats['ram_used'] = round($stats['ram_total'] - ($m[1] / 1024 / 1024), 1);
                    }
                }
                
                // Get CPU usage
                $stream = @ssh2_exec($connection, "top -bn1 | grep 'Cpu(s)' | awk '{print \$2}'");
                if ($stream) {
                    stream_set_blocking($stream, true);
                    $cpuOutput = trim(stream_get_contents($stream));
                    fclose($stream);
                    $stats['cpu_usage'] = floatval($cpuOutput);
                }
                
                // Get uptime
                $stream = @ssh2_exec($connection, "uptime -p 2>/dev/null || uptime | awk -F'up ' '{print \$2}' | cut -d',' -f1");
                if ($stream) {
                    stream_set_blocking($stream, true);
                    $stats['uptime'] = trim(stream_get_contents($stream)) ?: 'N/A';
                    fclose($stream);
                }
            } else {
                $stats['error'] = 'Auth failed';
            }
        } else {
            $stats['error'] = 'Connection failed';
        }
    } else {
        // Fallback - basic port check
        $fp = @fsockopen($server['host'], $server['ssh_port'] ?? 22, $errno, $errstr, 3);
        if ($fp) {
            $stats['status'] = 'online';
            fclose($fp);
        } else {
            $stats['error'] = 'Cannot connect';
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
        [$server['id']]
    );
    
    $results[] = $stats;
}

jsonResponse(['servers' => $results, 'pinged_at' => date('c')]);

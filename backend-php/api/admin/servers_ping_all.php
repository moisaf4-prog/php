<?php
/**
 * Ping all servers
 */

requireAdmin();

$servers = db()->fetchAll("SELECT id, name, host, ssh_port, ssh_user, ssh_password FROM attack_servers WHERE is_active = 1");
$results = [];

foreach ($servers as $server) {
    $stats = [
        'name' => $server['name'],
        'status' => 'offline',
        'cpu_usage' => 0,
        'uptime' => 'N/A'
    ];
    
    // Basic connectivity check
    $fp = @fsockopen($server['host'], $server['ssh_port'] ?? 22, $errno, $errstr, 3);
    if ($fp) {
        $stats['status'] = 'online';
        fclose($fp);
        
        // Update as online
        db()->update(
            'attack_servers',
            ['status' => 'online', 'last_ping' => date('Y-m-d H:i:s')],
            'id = ?',
            [$server['id']]
        );
    } else {
        // Update as offline
        db()->update(
            'attack_servers',
            ['status' => 'offline', 'last_ping' => date('Y-m-d H:i:s')],
            'id = ?',
            [$server['id']]
        );
    }
    
    $results[] = $stats;
}

jsonResponse(['servers' => $results, 'pinged_at' => date('c')]);

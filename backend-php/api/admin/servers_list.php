<?php
/**
 * List all servers
 */

requireAdmin();

$servers = db()->fetchAll("SELECT * FROM attack_servers ORDER BY created_at DESC");

$result = [];
foreach ($servers as $server) {
    // Get method commands
    $methods = db()->fetchAll(
        "SELECT method_id, command FROM server_methods WHERE server_id = ?",
        [$server['id']]
    );
    
    $result[] = [
        'id' => $server['id'],
        'name' => $server['name'],
        'host' => $server['host'],
        'ssh_port' => (int)$server['ssh_port'],
        'ssh_user' => $server['ssh_user'],
        'ssh_password' => $server['ssh_password'] ? '********' : null,
        'max_concurrent' => (int)$server['max_concurrent'],
        'current_load' => (int)$server['current_load'],
        'start_command' => $server['start_command'],
        'stop_command' => $server['stop_command'],
        'is_active' => (bool)$server['is_active'],
        'status' => $server['status'],
        'cpu_usage' => (float)$server['cpu_usage'],
        'ram_used' => (float)$server['ram_used'],
        'ram_total' => (float)$server['ram_total'],
        'cpu_model' => $server['cpu_model'],
        'cpu_cores' => (int)$server['cpu_cores'],
        'uptime' => $server['uptime'],
        'last_ping' => $server['last_ping'],
        'method_commands' => $methods
    ];
}

jsonResponse($result);

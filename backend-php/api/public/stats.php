<?php
/**
 * Public Stats
 */

$totalUsers = db()->count('users');
$paidUsers = db()->count('users', "plan != 'free'");
$totalAttacks = db()->count('attacks');

// Attacks in last 24 hours
$dayAgo = date('Y-m-d H:i:s', strtotime('-24 hours'));
$attacks24h = db()->count('attacks', "started_at >= ?", [$dayAgo]);

// Get active servers
$servers = db()->fetchAll(
    "SELECT id, name, status, current_load, max_concurrent, cpu_usage, ram_used, ram_total, cpu_model, cpu_cores, uptime 
     FROM attack_servers WHERE is_active = 1"
);

$onlineServers = array_filter($servers, fn($s) => $s['status'] === 'online');

$totalCapacity = array_sum(array_column($onlineServers, 'max_concurrent'));
$currentLoad = db()->count('attacks', "status = 'running'");
$totalCpu = count($onlineServers) > 0 
    ? array_sum(array_column($onlineServers, 'cpu_usage')) / count($onlineServers) 
    : 0;
$totalRamUsed = array_sum(array_column($onlineServers, 'ram_used'));
$totalRamTotal = array_sum(array_column($onlineServers, 'ram_total'));

// Attacks per hour (last 24 hours)
$attacksPerHour = [];
for ($i = 23; $i >= 0; $i--) {
    $hourStart = date('Y-m-d H:00:00', strtotime("-$i hours"));
    $hourEnd = date('Y-m-d H:59:59', strtotime("-$i hours"));
    $count = db()->count('attacks', "started_at BETWEEN ? AND ?", [$hourStart, $hourEnd]);
    $attacksPerHour[] = [
        'hour' => date('H:00', strtotime("-$i hours")),
        'count' => $count
    ];
}

// Format servers for response
$serverData = [];
foreach ($servers as $s) {
    // Get methods for this server
    $methods = db()->fetchAll(
        "SELECT method_id FROM server_methods WHERE server_id = ?",
        [$s['id']]
    );
    
    $serverData[] = [
        'name' => $s['name'],
        'status' => $s['status'],
        'load' => (int)$s['current_load'],
        'max_concurrent' => (int)$s['max_concurrent'],
        'cpu_usage' => (float)$s['cpu_usage'],
        'ram_used' => (float)$s['ram_used'],
        'ram_total' => (float)$s['ram_total'],
        'cpu_model' => $s['cpu_model'] ?? '',
        'cpu_cores' => (int)$s['cpu_cores'],
        'uptime' => $s['uptime'] ?? 'N/A',
        'methods' => array_column($methods, 'method_id')
    ];
}

jsonResponse([
    'total_users' => $totalUsers,
    'paid_users' => $paidUsers,
    'total_attacks' => $totalAttacks,
    'attacks_24h' => $attacks24h,
    'online_servers' => count($onlineServers),
    'total_capacity' => $totalCapacity,
    'current_load' => $currentLoad,
    'avg_cpu' => round($totalCpu, 1),
    'total_ram_used' => round($totalRamUsed, 1),
    'total_ram_total' => round($totalRamTotal, 1),
    'attacks_per_hour' => $attacksPerHour,
    'servers' => $serverData
]);

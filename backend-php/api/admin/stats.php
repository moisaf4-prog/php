<?php
/**
 * Admin dashboard stats
 */

requireAdmin();

$totalUsers = db()->count('users');
$totalServers = db()->count('attack_servers');
$activeServers = db()->count('attack_servers', 'is_active = 1 AND status = "online"');
$totalAttacks = db()->count('attacks');
$runningAttacks = db()->count('attacks', 'status = "running"');
$totalPlans = db()->count('plans');
$totalMethods = db()->count('attack_methods');

jsonResponse([
    'total_users' => $totalUsers,
    'total_servers' => $totalServers,
    'active_servers' => $activeServers,
    'total_attacks' => $totalAttacks,
    'running_attacks' => $runningAttacks,
    'total_plans' => $totalPlans,
    'total_methods' => $totalMethods
]);

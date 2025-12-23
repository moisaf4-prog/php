<?php
/**
 * Get current user
 */

$user = requireAuth();

jsonResponse([
    'id' => $user['id'],
    'username' => $user['username'],
    'telegram_id' => $user['telegram_id'],
    'role' => $user['role'],
    'plan' => $user['plan'],
    'plan_expires' => $user['plan_expires'],
    'api_key' => $user['api_key']
]);

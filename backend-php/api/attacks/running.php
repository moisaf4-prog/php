<?php
/**
 * Get running attacks
 */

$user = requireAuth();

$attacks = db()->fetchAll(
    "SELECT id, target, port, method, duration, concurrents, server_name, status, started_at, screen_name 
     FROM attacks WHERE user_id = ? AND status = 'running' ORDER BY started_at DESC",
    [$user['id']]
);

jsonResponse($attacks);

<?php
/**
 * List user's attacks
 */

$user = requireAuth();

$limit = (int)($_GET['limit'] ?? 50);
$offset = (int)($_GET['offset'] ?? 0);

$attacks = db()->fetchAll(
    "SELECT id, target, port, method, duration, concurrents, server_name, status, started_at, ended_at 
     FROM attacks WHERE user_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?",
    [$user['id'], $limit, $offset]
);

jsonResponse($attacks);

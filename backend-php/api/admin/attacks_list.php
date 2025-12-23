<?php
/**
 * List all attacks (admin)
 */

requireAdmin();

$attacks = db()->fetchAll(
    "SELECT id, user_id, username, target, port, method, duration, concurrents, server_id, server_name, status, screen_name, started_at, ended_at 
     FROM attacks 
     ORDER BY started_at DESC 
     LIMIT 100"
);

jsonResponse($attacks);

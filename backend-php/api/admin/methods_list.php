<?php
/**
 * List all methods (admin)
 */

requireAdmin();

$methods = db()->fetchAll(
    "SELECT id, name, description, tags, created_at FROM attack_methods ORDER BY name"
);

// Decode JSON tags
foreach ($methods as &$method) {
    $method['tags'] = json_decode($method['tags'] ?? '[]', true) ?? [];
}

jsonResponse($methods);

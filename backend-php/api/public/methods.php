<?php
/**
 * Get all attack methods
 */

$methods = db()->fetchAll("SELECT * FROM attack_methods");

$result = [];
foreach ($methods as $method) {
    $result[] = [
        'id' => $method['id'],
        'name' => $method['name'],
        'description' => $method['description'],
        'tags' => json_decode($method['tags'] ?? '[]', true)
    ];
}

jsonResponse($result);

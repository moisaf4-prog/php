<?php
/**
 * Create news (admin)
 */

requireAdmin();

$data = getJsonBody();
validateRequired($data, ['title', 'content']);

$id = generateUUID();
$title = sanitize($data['title']);
$content = sanitize($data['content'], true);
$type = in_array($data['type'] ?? 'info', ['info', 'update', 'alert', 'promo']) ? $data['type'] : 'info';
$isActive = isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1;

db()->query(
    "INSERT INTO news (id, title, content, type, is_active) VALUES (?, ?, ?, ?, ?)",
    [$id, $title, $content, $type, $isActive]
);

jsonResponse(['message' => 'News created successfully', 'id' => $id]);

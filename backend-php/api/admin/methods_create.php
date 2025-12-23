<?php
/**
 * Create attack method (admin)
 */

requireAdmin();

$data = getJsonBody();
validateRequired($data, ['id', 'name']);

$methodId = sanitize($data['id']);
$name = sanitize($data['name']);
$description = sanitize($data['description'] ?? '', true);
$tags = isset($data['tags']) ? json_encode($data['tags']) : '[]';

// Check if method exists
$existing = db()->fetchOne("SELECT id FROM attack_methods WHERE id = ?", [$methodId]);
if ($existing) {
    errorResponse('Method with this ID already exists', 400);
}

db()->query(
    "INSERT INTO attack_methods (id, name, description, tags) VALUES (?, ?, ?, ?)",
    [$methodId, $name, $description, $tags]
);

jsonResponse(['message' => 'Method created successfully', 'id' => $methodId]);

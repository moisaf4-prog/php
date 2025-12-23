<?php
/**
 * Create plan (admin)
 */

requireAdmin();

$data = getJsonBody();
validateRequired($data, ['id', 'name', 'price']);

$planId = sanitize($data['id']);
$name = sanitize($data['name']);
$price = floatval($data['price']);
$maxTime = intval($data['max_time'] ?? 60);
$maxConcurrent = intval($data['max_concurrent'] ?? 1);
$durationDays = intval($data['duration_days'] ?? 30);
$methods = $data['methods'] ?? [];

// Check if plan exists
$existing = db()->fetchOne("SELECT id FROM plans WHERE id = ?", [$planId]);
if ($existing) {
    errorResponse('Plan with this ID already exists', 400);
}

db()->query(
    "INSERT INTO plans (id, name, price, max_time, max_concurrent, duration_days) VALUES (?, ?, ?, ?, ?, ?)",
    [$planId, $name, $price, $maxTime, $maxConcurrent, $durationDays]
);

// Add methods
foreach ($methods as $methodId) {
    db()->query(
        "INSERT IGNORE INTO plan_methods (plan_id, method_id) VALUES (?, ?)",
        [$planId, $methodId]
    );
}

jsonResponse(['message' => 'Plan created successfully', 'id' => $planId]);

<?php
/**
 * List all plans (admin)
 */

requireAdmin();

$plans = db()->fetchAll(
    "SELECT id, name, price, max_time, max_concurrent, duration_days, created_at FROM plans ORDER BY price"
);

// Get methods for each plan
foreach ($plans as &$plan) {
    $methods = db()->fetchAll(
        "SELECT method_id FROM plan_methods WHERE plan_id = ?",
        [$plan['id']]
    );
    $plan['methods'] = array_column($methods, 'method_id');
    $plan['price'] = floatval($plan['price']);
    $plan['max_time'] = intval($plan['max_time']);
    $plan['max_concurrent'] = intval($plan['max_concurrent']);
    $plan['duration_days'] = intval($plan['duration_days']);
}

jsonResponse($plans);

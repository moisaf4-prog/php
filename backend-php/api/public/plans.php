<?php
/**
 * Get all plans
 */

$plans = db()->fetchAll("SELECT * FROM plans ORDER BY price ASC");

$result = [];
foreach ($plans as $plan) {
    // Get methods for this plan
    $methods = db()->fetchAll(
        "SELECT method_id FROM plan_methods WHERE plan_id = ?",
        [$plan['id']]
    );
    
    $result[] = [
        'id' => $plan['id'],
        'name' => $plan['name'],
        'price' => (float)$plan['price'],
        'max_time' => (int)$plan['max_time'],
        'max_concurrent' => (int)$plan['max_concurrent'],
        'duration_days' => (int)$plan['duration_days'],
        'methods' => array_column($methods, 'method_id')
    ];
}

jsonResponse($result);

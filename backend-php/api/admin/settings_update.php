<?php
/**
 * Update admin settings
 */

requireAdmin();
$data = getJsonBody();

$allowedKeys = [
    'global_max_concurrent',
    'maintenance_mode',
    'coinpayments_merchant_id',
    'coinpayments_ipn_secret',
    'coinpayments_enabled',
    'accepted_crypto'
];

foreach ($data as $key => $value) {
    if (!in_array($key, $allowedKeys)) continue;
    
    // Encode arrays to JSON
    if (is_array($value)) {
        $value = json_encode($value);
    }
    
    db()->query(
        "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
        [$key, (string)$value]
    );
}

jsonResponse(['message' => 'Settings updated']);

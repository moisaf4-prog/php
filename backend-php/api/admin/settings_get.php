<?php
/**
 * Get admin settings
 */

requireAdmin();

$settings = db()->fetchAll("SELECT setting_key, setting_value FROM settings");

$result = [];
foreach ($settings as $s) {
    $value = $s['setting_value'];
    // Try to decode JSON values
    $decoded = json_decode($value, true);
    $result[$s['setting_key']] = $decoded !== null ? $decoded : $value;
}

jsonResponse($result);

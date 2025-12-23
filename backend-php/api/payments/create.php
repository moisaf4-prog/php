<?php
/**
 * Create CoinPayments transaction
 */

$user = requireAuth();
$data = getJsonBody();

validateRequired($data, ['plan_id']);

$planId = sanitize($data['plan_id']);
$crypto = sanitize($data['crypto'] ?? 'BTC');

// Get plan
$plan = db()->fetchOne("SELECT * FROM plans WHERE id = ?", [$planId]);
if (!$plan) {
    errorResponse('Plan not found', 404);
}

if ($plan['price'] <= 0) {
    errorResponse('Cannot purchase free plan', 400);
}

// Get CoinPayments settings
$merchantId = db()->fetchOne("SELECT setting_value FROM settings WHERE setting_key = 'coinpayments_merchant_id'");
$ipnSecret = db()->fetchOne("SELECT setting_value FROM settings WHERE setting_key = 'coinpayments_ipn_secret'");
$enabled = db()->fetchOne("SELECT setting_value FROM settings WHERE setting_key = 'coinpayments_enabled'");

if (!$enabled || $enabled['setting_value'] !== '1') {
    errorResponse('Crypto payments are not enabled', 400);
}

// Create payment record
$paymentId = generateUUID();
db()->query(
    "INSERT INTO payments (id, user_id, plan_id, amount, currency, crypto_currency, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
    [$paymentId, $user['id'], $planId, $plan['price'], 'USD', $crypto]
);

// In production, this would call CoinPayments API
// For now, return mock data
jsonResponse([
    'payment_id' => $paymentId,
    'amount' => $plan['price'],
    'crypto' => $crypto,
    'address' => 'mock_address_' . substr($paymentId, 0, 8),
    'status' => 'pending',
    'message' => 'Send payment to the address above'
]);

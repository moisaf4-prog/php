<?php
/**
 * Check payment status
 */

$user = requireAuth();
$paymentId = $_REQUEST['payment_id'] ?? '';

if (empty($paymentId)) {
    errorResponse('Payment ID required', 400);
}

$payment = db()->fetchOne(
    "SELECT * FROM payments WHERE id = ? AND user_id = ?",
    [$paymentId, $user['id']]
);

if (!$payment) {
    errorResponse('Payment not found', 404);
}

jsonResponse([
    'id' => $payment['id'],
    'plan_id' => $payment['plan_id'],
    'amount' => floatval($payment['amount']),
    'currency' => $payment['currency'],
    'crypto_currency' => $payment['crypto_currency'],
    'status' => $payment['status'],
    'created_at' => $payment['created_at'],
    'completed_at' => $payment['completed_at']
]);

<?php
/**
 * CoinPayments IPN Handler
 */

// Get IPN data
$ipnData = $_POST;

// Verify HMAC signature
$ipnSecret = db()->fetchOne("SELECT setting_value FROM settings WHERE setting_key = 'coinpayments_ipn_secret'");
if (!$ipnSecret) {
    http_response_code(400);
    exit('IPN not configured');
}

// Verify request
$hmac = hash_hmac('sha512', file_get_contents('php://input'), $ipnSecret['setting_value']);
$headerHmac = $_SERVER['HTTP_HMAC'] ?? '';

if (!hash_equals($hmac, $headerHmac)) {
    http_response_code(401);
    exit('Invalid signature');
}

// Process IPN
$txnId = $ipnData['txn_id'] ?? '';
$status = (int)($ipnData['status'] ?? 0);
$paymentId = $ipnData['custom'] ?? $ipnData['item_number'] ?? '';

if (empty($paymentId)) {
    http_response_code(400);
    exit('Missing payment ID');
}

// Get payment
$payment = db()->fetchOne("SELECT * FROM payments WHERE id = ?", [$paymentId]);
if (!$payment) {
    http_response_code(404);
    exit('Payment not found');
}

// Status >= 100 = completed
if ($status >= 100) {
    // Update payment
    db()->update('payments', [
        'status' => 'completed',
        'transaction_id' => $txnId,
        'completed_at' => date('Y-m-d H:i:s')
    ], 'id = ?', [$paymentId]);
    
    // Get plan
    $plan = db()->fetchOne("SELECT * FROM plans WHERE id = ?", [$payment['plan_id']]);
    if ($plan) {
        // Update user plan
        $planExpires = null;
        if ($plan['duration_days'] > 0) {
            $planExpires = date('Y-m-d H:i:s', strtotime("+{$plan['duration_days']} days"));
        }
        
        db()->update('users', [
            'plan' => $payment['plan_id'],
            'plan_expires' => $planExpires
        ], 'id = ?', [$payment['user_id']]);
    }
} elseif ($status < 0) {
    // Failed/cancelled
    db()->update('payments', [
        'status' => 'failed',
        'transaction_id' => $txnId
    ], 'id = ?', [$paymentId]);
}

echo 'IPN OK';

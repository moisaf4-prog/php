<?php
/**
 * Check Stripe checkout session status
 */

$user = requireAuth();
$sessionId = $_REQUEST['session_id'] ?? '';

if (empty($sessionId)) {
    errorResponse('Session ID required', 400);
}

// Since this is a migration, we'll return a simple response
// In production, this would check Stripe API
jsonResponse([
    'session_id' => $sessionId,
    'status' => 'pending',
    'message' => 'Stripe integration migrated to PHP - check payments via CoinPayments'
]);

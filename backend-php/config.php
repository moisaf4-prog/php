<?php
/**
 * Layer7Top Configuration
 * Edit these values for your hosting
 */

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/php_errors.log');

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'layer7top');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// JWT Configuration
define('JWT_SECRET', 'stresser-secret-key-2024-production');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 604800); // 7 days in seconds

// Site Configuration
define('SITE_NAME', 'Layer7Top');
define('SITE_URL', 'https://layer7top.st');
define('API_URL', SITE_URL . '/api');

// CoinPayments Configuration (set in admin panel)
define('COINPAYMENTS_IPN_URL', API_URL . '/payments/ipn.php');

// Security
define('BCRYPT_COST', 12);
define('RATE_LIMIT_ATTACKS', 1); // seconds between attacks

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Timezone
date_default_timezone_set('UTC');

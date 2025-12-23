<?php
/**
 * Layer7Top API Router
 * Main entry point for all API requests
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/validation.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api';

// Remove base path and query string
$path = parse_url($requestUri, PHP_URL_PATH);
$path = str_replace($basePath, '', $path);
$path = rtrim($path, '/');

// Route the request
try {
    // Public routes
    if ($path === '/auth/register' && $method === 'POST') {
        require __DIR__ . '/auth/register.php';
    }
    elseif ($path === '/auth/login' && $method === 'POST') {
        require __DIR__ . '/auth/login.php';
    }
    elseif ($path === '/public/stats' && $method === 'GET') {
        require __DIR__ . '/public/stats.php';
    }
    elseif ($path === '/plans' && $method === 'GET') {
        require __DIR__ . '/public/plans.php';
    }
    elseif ($path === '/methods' && $method === 'GET') {
        require __DIR__ . '/public/methods.php';
    }
    elseif ($path === '/news' && $method === 'GET') {
        require __DIR__ . '/public/news.php';
    }
    
    // Protected routes - User
    elseif ($path === '/auth/me' && $method === 'GET') {
        require __DIR__ . '/auth/me.php';
    }
    elseif ($path === '/attacks' && $method === 'GET') {
        require __DIR__ . '/attacks/list.php';
    }
    elseif ($path === '/attacks' && $method === 'POST') {
        require __DIR__ . '/attacks/create.php';
    }
    elseif (preg_match('/^\/attacks\/([a-f0-9-]+)\/stop$/', $path, $matches) && $method === 'POST') {
        $_REQUEST['attack_id'] = $matches[1];
        require __DIR__ . '/attacks/stop.php';
    }
    elseif ($path === '/attacks/running' && $method === 'GET') {
        require __DIR__ . '/attacks/running.php';
    }
    elseif ($path === '/user/profile' && $method === 'PUT') {
        require __DIR__ . '/user/profile.php';
    }
    elseif ($path === '/user/api-key' && $method === 'POST') {
        require __DIR__ . '/user/apikey.php';
    }
    
    // Admin routes
    elseif ($path === '/admin/settings' && $method === 'GET') {
        require __DIR__ . '/admin/settings_get.php';
    }
    elseif ($path === '/admin/settings' && $method === 'PUT') {
        require __DIR__ . '/admin/settings_update.php';
    }
    elseif ($path === '/admin/servers' && $method === 'GET') {
        require __DIR__ . '/admin/servers_list.php';
    }
    elseif ($path === '/admin/servers' && $method === 'POST') {
        require __DIR__ . '/admin/servers_create.php';
    }
    elseif (preg_match('/^\/admin\/servers\/([a-f0-9-]+)$/', $path, $matches)) {
        $_REQUEST['server_id'] = $matches[1];
        if ($method === 'PUT') {
            require __DIR__ . '/admin/servers_update.php';
        } elseif ($method === 'DELETE') {
            require __DIR__ . '/admin/servers_delete.php';
        }
    }
    elseif (preg_match('/^\/admin\/servers\/([a-f0-9-]+)\/ping$/', $path, $matches) && $method === 'POST') {
        $_REQUEST['server_id'] = $matches[1];
        require __DIR__ . '/admin/servers_ping.php';
    }
    elseif ($path === '/admin/servers/ping-all' && $method === 'POST') {
        require __DIR__ . '/admin/servers_ping_all.php';
    }
    elseif (preg_match('/^\/admin\/servers\/([a-f0-9-]+)\/execute$/', $path, $matches) && $method === 'POST') {
        $_REQUEST['server_id'] = $matches[1];
        require __DIR__ . '/admin/servers_execute.php';
    }
    elseif ($path === '/admin/users' && $method === 'GET') {
        require __DIR__ . '/admin/users_list.php';
    }
    elseif (preg_match('/^\/admin\/users\/([a-f0-9-]+)$/', $path, $matches) && $method === 'DELETE') {
        $_REQUEST['user_id'] = $matches[1];
        require __DIR__ . '/admin/users_delete.php';
    }
    elseif (preg_match('/^\/admin\/users\/([a-f0-9-]+)\/role$/', $path, $matches) && $method === 'PUT') {
        $_REQUEST['user_id'] = $matches[1];
        require __DIR__ . '/admin/users_role.php';
    }
    elseif (preg_match('/^\/admin\/users\/([a-f0-9-]+)\/plan$/', $path, $matches) && $method === 'PUT') {
        $_REQUEST['user_id'] = $matches[1];
        require __DIR__ . '/admin/users_plan.php';
    }
    elseif ($path === '/admin/methods' && $method === 'GET') {
        require __DIR__ . '/admin/methods_list.php';
    }
    elseif ($path === '/admin/methods' && $method === 'POST') {
        require __DIR__ . '/admin/methods_create.php';
    }
    elseif (preg_match('/^\/admin\/methods\/([a-zA-Z0-9-]+)$/', $path, $matches)) {
        $_REQUEST['method_id'] = $matches[1];
        if ($method === 'PUT') {
            require __DIR__ . '/admin/methods_update.php';
        } elseif ($method === 'DELETE') {
            require __DIR__ . '/admin/methods_delete.php';
        }
    }
    elseif ($path === '/admin/plans' && $method === 'GET') {
        require __DIR__ . '/admin/plans_list.php';
    }
    elseif ($path === '/admin/plans' && $method === 'POST') {
        require __DIR__ . '/admin/plans_create.php';
    }
    elseif (preg_match('/^\/admin\/plans\/([a-zA-Z0-9-]+)$/', $path, $matches)) {
        $_REQUEST['plan_id'] = $matches[1];
        if ($method === 'PUT') {
            require __DIR__ . '/admin/plans_update.php';
        } elseif ($method === 'DELETE') {
            require __DIR__ . '/admin/plans_delete.php';
        }
    }
    elseif ($path === '/admin/news' && $method === 'GET') {
        require __DIR__ . '/admin/news_list.php';
    }
    elseif ($path === '/admin/news' && $method === 'POST') {
        require __DIR__ . '/admin/news_create.php';
    }
    elseif (preg_match('/^\/admin\/news\/([a-f0-9-]+)$/', $path, $matches)) {
        $_REQUEST['news_id'] = $matches[1];
        if ($method === 'PUT') {
            require __DIR__ . '/admin/news_update.php';
        } elseif ($method === 'DELETE') {
            require __DIR__ . '/admin/news_delete.php';
        }
    }
    elseif ($path === '/admin/stats' && $method === 'GET') {
        require __DIR__ . '/admin/stats.php';
    }
    elseif ($path === '/admin/attacks' && $method === 'GET') {
        require __DIR__ . '/admin/attacks_list.php';
    }
    
    // Payments
    elseif ($path === '/payments/coinpayments/create' && $method === 'POST') {
        require __DIR__ . '/payments/create.php';
    }
    elseif ($path === '/payments/coinpayments/ipn' && $method === 'POST') {
        require __DIR__ . '/payments/ipn.php';
    }
    elseif (preg_match('/^\/payments\/status\/([a-f0-9-]+)$/', $path, $matches) && $method === 'GET') {
        $_REQUEST['payment_id'] = $matches[1];
        require __DIR__ . '/payments/status.php';
    }
    
    // 404
    else {
        errorResponse('Endpoint not found', 404);
    }
    
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    errorResponse('Internal server error', 500);
}

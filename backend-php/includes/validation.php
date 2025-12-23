<?php
/**
 * Input Validation Functions
 */

/**
 * Sanitize string input
 */
function sanitize($value, $allowSpecial = false) {
    if (empty($value)) return '';
    
    // Remove null bytes
    $value = str_replace("\0", '', $value);
    
    if (!$allowSpecial) {
        // Remove shell special characters
        $value = preg_replace('/[;&|`$(){}\[\]<>\\\\]/', '', $value);
    }
    
    // Limit length
    return substr($value, 0, 1000);
}

/**
 * Validate target URL/IP
 */
function validateTarget($target) {
    if (empty($target)) return false;
    
    // URL pattern
    $urlPattern = '/^https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9.]*[a-zA-Z0-9](:[0-9]+)?(\/.*)?$/';
    // IP pattern
    $ipPattern = '/^(\d{1,3}\.){3}\d{1,3}$/';
    
    return preg_match($urlPattern, $target) || preg_match($ipPattern, $target);
}

/**
 * Get JSON body from request
 */
function getJsonBody() {
    $body = file_get_contents('php://input');
    return json_decode($body, true) ?? [];
}

/**
 * Send JSON response
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Send error response
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['detail' => $message], $statusCode);
}

/**
 * Validate required fields
 */
function validateRequired($data, $fields) {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            errorResponse("Missing required field: $field", 400);
        }
    }
}

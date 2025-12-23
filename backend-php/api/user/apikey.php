<?php
/**
 * Regenerate API key
 */

$user = requireAuth();

$newApiKey = generateApiKey();

db()->update(
    'users',
    ['api_key' => $newApiKey],
    'id = ?',
    [$user['id']]
);

jsonResponse(['api_key' => $newApiKey]);

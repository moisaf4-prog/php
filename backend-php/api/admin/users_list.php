<?php
/**
 * List all users (admin)
 */

requireAdmin();

$users = db()->fetchAll(
    "SELECT id, username, telegram_id, role, plan, plan_expires, api_key, created_at FROM users ORDER BY created_at DESC"
);

jsonResponse($users);

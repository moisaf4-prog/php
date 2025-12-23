<?php
/**
 * List all news (admin)
 */

requireAdmin();

$news = db()->fetchAll(
    "SELECT id, title, content, type, is_active, created_at FROM news ORDER BY created_at DESC"
);

// Convert is_active to boolean
foreach ($news as &$item) {
    $item['is_active'] = (bool)$item['is_active'];
}

jsonResponse($news);

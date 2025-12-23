<?php
/**
 * Get active news
 */

$news = db()->fetchAll(
    "SELECT id, title, content, type, created_at FROM news WHERE is_active = 1 ORDER BY created_at DESC LIMIT 10"
);

jsonResponse($news);

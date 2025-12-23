<?php
/**
 * Delete news (admin)
 */

requireAdmin();

$newsId = $_REQUEST['news_id'] ?? '';

if (empty($newsId)) {
    errorResponse('News ID required', 400);
}

// Check if news exists
$news = db()->fetchOne("SELECT id FROM news WHERE id = ?", [$newsId]);
if (!$news) {
    errorResponse('News not found', 404);
}

db()->delete('news', 'id = ?', [$newsId]);

jsonResponse(['message' => 'News deleted successfully']);

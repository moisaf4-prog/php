<?php
/**
 * Update news (admin)
 */

requireAdmin();

$newsId = $_REQUEST['news_id'] ?? '';
$data = getJsonBody();

if (empty($newsId)) {
    errorResponse('News ID required', 400);
}

// Check if news exists
$news = db()->fetchOne("SELECT id FROM news WHERE id = ?", [$newsId]);
if (!$news) {
    errorResponse('News not found', 404);
}

$updateData = [];
if (isset($data['title'])) $updateData['title'] = sanitize($data['title']);
if (isset($data['content'])) $updateData['content'] = sanitize($data['content'], true);
if (isset($data['type']) && in_array($data['type'], ['info', 'update', 'alert', 'promo'])) {
    $updateData['type'] = $data['type'];
}
if (isset($data['is_active'])) $updateData['is_active'] = (int)(bool)$data['is_active'];

if (!empty($updateData)) {
    db()->update('news', $updateData, 'id = ?', [$newsId]);
}

jsonResponse(['message' => 'News updated successfully']);

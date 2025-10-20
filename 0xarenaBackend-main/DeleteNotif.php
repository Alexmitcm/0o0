<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get notificationId from query parameters
    $notificationId = $_GET['notificationId'] ?? null;

    if (!$notificationId) {
        sendJsonResponse(['error' => 'Missing required field: notificationId'], 400);
    }

    $pdo->beginTransaction();

    // Check if the notification exists
    $stmt = $pdo->prepare('SELECT "id" FROM "Notifications" WHERE "id" = ?');
    $stmt->execute([$notificationId]);
    $notification = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$notification) {
        $pdo->rollBack();
        sendJsonResponse(['error' => 'Notification not found'], 404);
    }

    // Delete from NotificationRecipients first to maintain referential integrity
    $stmt = $pdo->prepare('DELETE FROM "NotificationRecipients" WHERE "notification_id" = ?');
    $stmt->execute([$notificationId]);

    // Delete from Notifications
    $stmt = $pdo->prepare('DELETE FROM "Notifications" WHERE "id" = ?');
    $stmt->execute([$notificationId]);

    $pdo->commit();
    sendJsonResponse(['message' => 'Notification deleted successfully']);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

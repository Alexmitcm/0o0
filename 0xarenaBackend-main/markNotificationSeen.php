<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    $recipient = $_POST['walletaddress'] ?? null;
    $notificationId = $_POST['notificationId'] ?? null;

    // Check if the notification exists and is for all users
    $notificationStmt = $pdo->prepare('
        SELECT "isAll" 
        FROM "Notifications" 
        WHERE "id" = ?
    ');
    $notificationStmt->execute([$notificationId]);
    $notification = $notificationStmt->fetch(PDO::FETCH_ASSOC);

    if (!$notification) {
        sendJsonResponse(['error' => 'Notification not found'], 404);
    }

    // Check if the recipient already has an isSeen entry
    $checkStmt = $pdo->prepare('
        SELECT "isSeen" 
        FROM "NotificationRecipients" 
        WHERE "recipient" = ? AND "notification_id" = ?
    ');
    $checkStmt->execute([$recipient, $notificationId]);
    $result = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        if ($result['isSeen']) {
            sendJsonResponse(['error' => 'Notification already marked as seen'], 409);
        } else {
            // Mark the notification as seen
            $updateStmt = $pdo->prepare('
                UPDATE "NotificationRecipients" 
                SET "isSeen" = TRUE 
                WHERE "recipient" = ? AND "notification_id" = ?
            ');
            $updateStmt->execute([$recipient, $notificationId]);

            if ($updateStmt->rowCount() > 0) {
                sendJsonResponse(['message' => 'Notification marked as seen']);
            } else {
                sendJsonResponse(['error' => 'Failed to update notification'], 500);
            }
        }
    } else {
        // If isAll is true, create an entry if it doesn't exist
        if ($notification['isAll']) {
            $insertStmt = $pdo->prepare('
                INSERT INTO "NotificationRecipients" ("notification_id", "recipient", "isSeen") 
                VALUES (?, ?, 1)
            ');
            $insertStmt->execute([$notificationId, $recipient]);

            if ($insertStmt->rowCount() > 0) {
                sendJsonResponse(['message' => 'Notification marked as seen']);
            } else {
                sendJsonResponse(['error' => 'Failed to update notification'], 500);
            }
        } else {
            sendJsonResponse(['error' => 'Notification not found for the recipient'], 404);
        }
    }
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>

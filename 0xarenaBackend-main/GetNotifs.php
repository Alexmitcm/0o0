<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Retrieve recipient and pagination parameters
    $recipient = $_POST['recipient'] ?? null;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = 10;
    $offset = ($page - 1) * $limit;

    if (empty($recipient)) {
        sendJsonResponse(['error' => 'Invalid or missing recipient'], 400);
    }

    // Fetch notifications
    $stmt = $pdo->prepare('
        SELECT n."id", n."title", n."description", n."created_at", n."isAll", nr."isSeen"
        FROM "Notifications" n
        LEFT JOIN "NotificationRecipients" nr ON n."id" = nr."notification_id" AND nr."recipient" = ?
        WHERE nr."recipient" = ? OR n."isAll" = 1
        GROUP BY n."id", n."title", n."description", n."created_at", n."isAll", nr."isSeen"
        ORDER BY n."created_at" DESC
        LIMIT :limit OFFSET :offset
    ');
    
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute([$recipient, $recipient]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($notifications as &$notification) {
        if ($notification['isAll'] == 1 && $notification['isSeen'] === null) {
            $insertStmt = $pdo->prepare('INSERT INTO "NotificationRecipients" ("notification_id", "recipient", "isSeen") VALUES (?, ?, 0)');
            $insertStmt->execute([$notification['id'], $recipient]);
            $notification['isSeen'] = 0;
        }
    }

    $stmtTotal = $pdo->prepare('
        SELECT COUNT(DISTINCT n."id") AS total
        FROM "Notifications" n
        LEFT JOIN "NotificationRecipients" nr ON n."id" = nr."notification_id" AND nr."recipient" = ?
        WHERE nr."recipient" = ? OR n."isAll" = 1
    ');
    $stmtTotal->execute([$recipient, $recipient]);
    $totalNotifications = $stmtTotal->fetch(PDO::FETCH_ASSOC)['total'];
    $totalPages = ceil($totalNotifications / $limit);

    sendJsonResponse([
        'notifications' => $notifications,
        'page' => $page,
        'total_pages' => $totalPages,
        'total_notifications' => $totalNotifications
    ]);

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

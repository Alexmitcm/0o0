<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = 10; // Fixed limit
    $offset = ($page - 1) * $limit;
    $recipient = $_GET['recipient'] ?? '';

    if ($recipient) {
        // Prepare the query to fetch notifications for the specified recipient with pagination
        $stmt = $pdo->prepare('
            SELECT n."id", n."title", n."description", n."priority", n."type", n."isAll", n."created_at"
            FROM "Notifications" n
            JOIN "NotificationRecipients" nr ON n."id" = nr."notification_id"
            WHERE nr."recipient" = :recipient OR n."isAll"::boolean = true
            ORDER BY n."created_at" DESC
            LIMIT :limit OFFSET :offset
        ');
        $stmt->bindParam(':recipient', $recipient, PDO::PARAM_STR);
    } else {
        // Prepare the query to fetch all notifications with pagination
        $stmt = $pdo->prepare('
            SELECT n."id", n."title", n."description", n."priority", n."type", n."isAll", n."created_at"
            FROM "Notifications" n
            ORDER BY n."created_at" DESC
            LIMIT :limit OFFSET :offset
        ');
    }

    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($recipient) {
        // Get total number of notifications for the specified recipient for pagination
        $stmtTotal = $pdo->prepare('
            SELECT COUNT(DISTINCT n."id") AS total
            FROM "Notifications" n
            JOIN "NotificationRecipients" nr ON n."id" = nr."notification_id"
            WHERE nr."recipient" = :recipient OR n."isAll"::boolean = true
        ');
        $stmtTotal->bindParam(':recipient', $recipient, PDO::PARAM_STR);
        $stmtTotal->execute();
    } else {
        // Get total number of notifications for pagination
        $stmtTotal = $pdo->query('
            SELECT COUNT(*) AS total
            FROM "Notifications"
        ');
    }

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

<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Retrieve POST data from x-www-form-urlencoded request
    $title = $_POST['title'] ?? null;
    $description = $_POST['description'] ?? null;
    $priority = $_POST['priority'] ?? null;
    $type = $_POST['type'] ?? null;
    $isAll = isset($_POST['isAll']) ? ($_POST['isAll'] === 'true' ? 1 : 0) : null;
    $to = $_POST['to'] ?? [];

    if (!is_array($to)) {
        $to = array();
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare('INSERT INTO "Notifications" ("title", "description", "priority", "type", "isAll") VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$title, $description, $priority, $type, $isAll]);

    $notificationId = $pdo->lastInsertId();

    $stmt = $pdo->prepare('INSERT INTO "NotificationRecipients" ("notification_id", "recipient") VALUES (?, ?)');

    if (empty($to)) {
        $stmt->execute([$notificationId, 'empty']);
    } else {
        foreach ($to as $recipient) {
            if (!is_string($recipient)) {
                throw new InvalidArgumentException("Invalid recipient format");
            }
            $stmt->execute([$notificationId, $recipient]);
        }
    }

    $pdo->commit();

    sendJsonResponse(['message' => 'Notification created successfully', 'id' => $notificationId], 201);

} catch (InvalidArgumentException $e) {
    $pdo->rollBack();
    sendJsonResponse(['error' => $e->getMessage()], 400);
} catch (PDOException $e) {
    $pdo->rollBack();
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    $pdo->rollBack();
    sendJsonResponse(['error' => 'An unexpected error occurred: ' . $e->getMessage()], 500);
}
?>

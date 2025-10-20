<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    $updateStmt = $pdo->prepare('UPDATE "users" SET "todaysPoints" = 0');
    
    if ($updateStmt->execute()) {
        sendJsonResponse(['message' => 'todaysPoints reset to 0 for all users successfully']);
    } else {
        sendJsonResponse(['error' => 'Error updating record'], 500);
    }
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>

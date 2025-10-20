<?php
require_once '../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        if (!isset($_GET['id'])) {
            sendJsonResponse(['error' => 'No id provided'], 400);
        }

        $id = intval($_GET['id']);

        $sql = 'DELETE FROM "eq_levels_stamina" WHERE "id" = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $id]);

        if ($stmt->rowCount() > 0) {
            sendJsonResponse(['success' => 'Row deleted successfully']);
        } else {
            sendJsonResponse(['error' => 'No row found with the provided id'], 404);
        }
    } else {
        sendJsonResponse(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

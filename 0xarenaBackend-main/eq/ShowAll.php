<?php
require_once '../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch all records from eq_levels_stamina table ordered by creation_date descending
        $sql = 'SELECT * FROM "eq_levels_stamina" ORDER BY "creation_date" DESC';
        $stmt = $pdo->query($sql);
        $records = $stmt->fetchAll();

        sendJsonResponse(['records' => $records]);
    } else {
        sendJsonResponse(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get tournamentId from the request
    $tournamentId = $_REQUEST['tournamentId'] ?? null;

    // Check if tournamentId is provided
    if (!isset($tournamentId)) {
        sendJsonResponse(['error' => 'Tournament ID is not provided'], 404);
    }

    // Check if the tournament ID exists in the database
    $checkQuery = 'SELECT * FROM "tournaments" WHERE "tournamentId" = ?';
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->execute([$tournamentId]);
    $checkResult = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$checkResult) {
        sendJsonResponse(['error' => "Tournament with ID $tournamentId not found"], 404);
    }

    // SQL query to update isDisabled field for a tournament by tournamentId
    $updateQuery = 'UPDATE "tournaments" SET "isDisabled" = 1 WHERE "tournamentId" = ?';
    $updateStmt = $pdo->prepare($updateQuery);
    
    if ($updateStmt->execute([$tournamentId])) {
        sendJsonResponse(['message' => "Tournament with ID $tournamentId is now disabled"]);
    } else {
        sendJsonResponse(['error' => "Failed to disable tournament"], 400);
    }

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

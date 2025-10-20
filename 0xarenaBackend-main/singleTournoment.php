<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get tournament ID from GET request
    $tournamentId = $_GET['tournamentId'] ?? null;

    // Check if tournament ID is provided
    if (!$tournamentId) {
        sendJsonResponse(['error' => 'Tournament ID must be provided'], 400);
    }

    // Check if tournament exists
    $stmt = $pdo->prepare('SELECT * FROM "tournaments" WHERE "tournamentId" = ?');
    $stmt->execute([$tournamentId]);
    $tournament = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tournament) {
        sendJsonResponse(['error' => 'Tournament not found'], 404);
        exit;
    }

    // Get tournament data
    $stmt = $pdo->prepare('SELECT * FROM "tournaments" WHERE "tournamentId" = ?');
    $stmt->execute([$tournamentId]);

    // Check if the tournament exists
    if ($stmt->rowCount() > 0) {
        $tournamentData = $stmt->fetch(PDO::FETCH_ASSOC);
        sendJsonResponse($tournamentData);
    } else {
        sendJsonResponse(['error' => "Tournament with ID $tournamentId not found"], 404);
    }
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Define SQL query to sum all users' coins
    $sql = 'SELECT SUM("coins"::integer) AS total_coins FROM "users"';
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // Extract the total coins
    $totalCoins = $result["total_coins"] ?? 0;

    // Return the total coins as a JSON response
    sendJsonResponse([
        'total_coins' => $totalCoins
    ]);

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

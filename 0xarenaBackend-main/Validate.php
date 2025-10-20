<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Retrieve POST parameters
    $walletaddress = $_POST['walletaddress'] ?? null;
    $token = $_POST['token'] ?? null;

    if (!$walletaddress || !$token) {
        sendJsonResponse(['error' => 'Wallet address and token are required'], 400);
    }

    // Prepare SQL statement to check if the provided token and wallet address match any row in the table
    $stmt = $pdo->prepare('SELECT * FROM "users" WHERE "walletaddress" = ? AND "token" = ?');
    $stmt->execute([$walletaddress, $token]);

    if ($stmt->rowCount() > 0) {
        sendJsonResponse(['status' => 'valid']);
    } else {
        sendJsonResponse(['status' => 'invalid']);
    }
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

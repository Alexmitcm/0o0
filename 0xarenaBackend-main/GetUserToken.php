<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Check if walletaddress is provided in the POST request
    $postedWalletAddress = $_POST['walletaddress'] ?? null;

    if (!$postedWalletAddress) {
        sendJsonResponse(['error' => 'Wallet address is required'], 400);
    }

    // Retrieve user token from the users table based on walletaddress
    $sql = 'SELECT "token" FROM "users" WHERE "walletaddress" = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$postedWalletAddress]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData) {
        sendJsonResponse(['error' => 'User not found'], 404);
    }

    sendJsonResponse([
        "walletaddress" => $postedWalletAddress,
        "token" => $userData['token']
    ]);

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?> 
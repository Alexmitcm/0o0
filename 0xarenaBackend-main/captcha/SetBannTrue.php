<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = getJsonInput();
        
        if (isset($data['walletaddress']) && isset($data['ban_status'])) {
            $walletaddress = $data['walletaddress'];
            $ban_status = $data['ban_status'];

            $stmt = $pdo->prepare("UPDATE users SET PerminantBan = ? WHERE walletaddress = ?");
            $stmt->execute([$ban_status, $walletaddress]);

            if ($stmt->rowCount() > 0) {
                sendJsonResponse(["message" => "User ban status updated successfully."]);
            } else {
                sendJsonResponse(["message" => "No user found with the provided wallet address."], 404);
            }
        } else {
            sendJsonResponse(["error" => "Wallet address and ban status are required."], 400);
        }
    } else {
        sendJsonResponse(["error" => "Method not allowed"], 405);
    }

} catch (PDOException $e) {
    sendJsonResponse(["error" => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(["error" => "Error: " . $e->getMessage()], 500);
}

<?php
require_once '../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $walletaddress = isset($_GET['walletaddress']) ? $_GET['walletaddress'] : '';

        if (empty($walletaddress)) {
            sendJsonResponse(['error' => 'No wallet address provided'], 400);
        }

        // Directly query the values from the users table
        $sql = 'SELECT "Total_eq", "left_node", "right_node" FROM "users" WHERE "walletaddress" = :walletaddress';
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['walletaddress' => $walletaddress]);
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$userData) {
            sendJsonResponse(['error' => 'User not found'], 404);
        }

        $result = [
            'walletaddress' => htmlspecialchars($walletaddress),
            'left_node' => (int)$userData['left_node'],
            'right_node' => (int)$userData['right_node'],
            'Total_eq' => (int)$userData['Total_eq']
        ];

        sendJsonResponse($result);
    } else {
        sendJsonResponse(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>
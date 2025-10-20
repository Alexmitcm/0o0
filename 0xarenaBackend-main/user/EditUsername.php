<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = getJsonInput();
        
        if (!isset($data['walletaddress']) || !isset($data['token']) || !isset($data['Username'])) {
            sendJsonResponse(['error' => 'Missing required parameters'], 400);
        }

        $walletaddress = $data['walletaddress'];
        $token = $data['token'];
        $new_username = $data['Username'];

        // Check if username already exists
        $stmt = $pdo->prepare('SELECT COUNT(*) as "count" FROM "users" WHERE "username" = ?');
        $stmt->execute([$new_username]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result['count'] > 0) {
            sendJsonResponse(['error' => 'Username already exists'], 400);
        }

        // Check if user exists and can change username
        $stmt = $pdo->prepare('SELECT "IsUsernameChanged" FROM "users" WHERE "walletaddress" = ? AND "token" = ?');
        $stmt->execute([$walletaddress, $token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            if ($user['IsUsernameChanged'] == 0) {
                $stmt = $pdo->prepare('UPDATE "users" SET "username" = ?, "IsUsernameChanged" = 1 WHERE "walletaddress" = ? AND "token" = ?');
                $stmt->execute([$new_username, $walletaddress, $token]);
                
                if ($stmt->rowCount() > 0) {
                    sendJsonResponse(['success' => 'Username updated successfully']);
                } else {
                    sendJsonResponse(['error' => 'Failed to update username'], 500);
                }
            } else {
                sendJsonResponse(['error' => 'Username has already been changed and cannot be changed again'], 400);
            }
        } else {
            sendJsonResponse(['error' => 'User not found'], 404);
        }
    } else {
        sendJsonResponse(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => 'Error: ' . $e->getMessage()], 500);
}

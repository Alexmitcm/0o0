<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = getJsonInput();
        
        if (!isset($data['walletaddress']) || !isset($data['token']) || !isset($data['action'])) {
            sendJsonResponse(["error" => "Missing required parameters"], 400);
        }

        $walletaddress = $data['walletaddress'];
        $token = $data['token'];
        $action = $data['action'];

        switch ($action) {
            case 'check':
                $stmt = $pdo->prepare("SELECT is_captcha_banned FROM users WHERE walletaddress = ? AND token = ?");
                $stmt->execute([$walletaddress, $token]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($result) {
                    sendJsonResponse(['banned' => $result['is_captcha_banned']]);
                } else {
                    sendJsonResponse(['error' => 'User not found'], 404);
                }
                break;

            case 'updateBan':
                if (!isset($data['isBanned'])) {
                    sendJsonResponse(["error" => "Missing isBanned parameter"], 400);
                }
                
                $isCaptchaBanned = $data['isBanned'];
                $stmt = $pdo->prepare("UPDATE users SET is_captcha_banned = ? WHERE walletaddress = ? AND token = ?");
                $stmt->execute([$isCaptchaBanned, $walletaddress, $token]);
                
                if ($stmt->rowCount() > 0) {
                    sendJsonResponse(['success' => true]);
                } else {
                    sendJsonResponse(['success' => false, 'error' => 'User not found or token invalid'], 404);
                }
                break;

            default:
                sendJsonResponse(["error" => "Invalid action"], 400);
        }
    } else {
        sendJsonResponse(["error" => "Method not allowed"], 405);
    }

} catch (PDOException $e) {
    sendJsonResponse(["error" => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(["error" => "Error: " . $e->getMessage()], 500);
}
?>

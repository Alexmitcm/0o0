<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = getJsonInput();
        
        if (isset($data['walletaddress'])) {
            $walletaddress = $data['walletaddress'];
            
            // Check if user exists and get their current captcha count
            $stmt = $pdo->prepare("SELECT COALESCE(captcha_count::integer, 0) as captcha_count, COALESCE(is_captcha_banned::integer, 0) as is_captcha_banned FROM users WHERE walletaddress = ?");
            $stmt->execute([$walletaddress]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                if ($user['is_captcha_banned'] == 1) {
                    sendJsonResponse(["error" => "User is banned from captcha."], 403);
                }

                // Check manual captcha table
                $stmt = $pdo->prepare("SELECT quantity, minutes_interval FROM manualcaptcha WHERE walletaddress = ?");
                $stmt->execute([$walletaddress]);
                $manualCaptcha = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($manualCaptcha) {
                    // Update user's captcha count
                    $stmt = $pdo->prepare("UPDATE users SET captcha_count = COALESCE(captcha_count::integer, 0) + ? WHERE walletaddress = ? RETURNING captcha_count::integer as new_count");
                    $stmt->execute([$manualCaptcha['quantity'], $walletaddress]);
                    $result = $stmt->fetch(PDO::FETCH_ASSOC);

                    // Delete the record from manual captcha
                    $stmt = $pdo->prepare("DELETE FROM manualcaptcha WHERE walletaddress = ?");
                    $stmt->execute([$walletaddress]);

                    sendJsonResponse([
                        "message" => "Captcha count updated successfully",
                        "new_count" => $result['new_count']
                    ]);
                } else {
                    sendJsonResponse(["error" => "No manual captcha entry found for this wallet address"], 404);
                }
            } else {
                sendJsonResponse(["error" => "User not found"], 404);
            }
        } else {
            sendJsonResponse(["error" => "Wallet address not provided"], 400);
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

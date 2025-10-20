<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get wallet address and token from query parameters
    $walletAddress = $_GET['walletaddress'] ?? '';
    $token = $_GET['token'] ?? '';

    if (empty($walletAddress)) {
        sendJsonResponse(["error" => "Wallet address not provided."], 400);
    }

    if (empty($token)) {
        sendJsonResponse(["error" => "Token not provided."], 400);
    }

    // Prepare SQL statement to check if the provided token and wallet address match any row in the table
    $sql = 'SELECT * FROM "users" WHERE "walletaddress" = ? AND "token" = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$walletAddress, $token]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData) {
        sendJsonResponse(["error" => "Invalid credentials"], 401);
    }

    // Check if the user is banned
    if ($userData['banned'] == 1) {
        sendJsonResponse(["error" => "User is banned. cheat_count will not be updated."], 403);
    }

    // Prepare and bind the statement to update cheat_count if the user is not banned
    $updateSql = 'UPDATE "users" SET "cheat_count" = "cheat_count" + 1 WHERE "walletaddress" = ?';
    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->execute([$walletAddress]);

    if ($updateStmt->rowCount() > 0) {
        // Fetch updated user data
        $userSql = 'SELECT * FROM "users" WHERE "walletaddress" = ?';
        $userStmt = $pdo->prepare($userSql);
        $userStmt->execute([$walletAddress]);
        $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

        if ($userData['cheat_count'] > 10) {
            // Check if there is already a ban record for the user
            $checkSql = 'SELECT * FROM "play_history" WHERE "wallet_address" = ?';
            $checkStmt = $pdo->prepare($checkSql);
            $checkStmt->execute([$walletAddress]);
            $checkResult = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$checkResult) {
                // Set ban date to one day ahead
                $banDate = date('Y-m-d H:i:s', strtotime('+1 day'));

                // Begin transaction
                $pdo->beginTransaction();

                try {
                    // Insert ban record into play_history
                    $banSql = 'INSERT INTO "play_history" ("wallet_address", "Ban_date") VALUES (?, ?)';
                    $banStmt = $pdo->prepare($banSql);
                    $banStmt->execute([$walletAddress, $banDate]);

                    // Update user banned status and set coins to 0
                    $updateBannedSql = 'UPDATE "users" SET "banned" = 1, "coins" = 0 WHERE "walletaddress" = ?';
                    $updateBannedStmt = $pdo->prepare($updateBannedSql);
                    $updateBannedStmt->execute([$walletAddress]);

                    $pdo->commit();
                    $userData['banned'] = 1;
                    $userData['coins'] = 0;
                    sendJsonResponse([
                        "success" => "User cheat count updated and user banned. Coins set to 0.",
                        "user" => $userData
                    ]);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    sendJsonResponse(["error" => "Error processing ban: " . $e->getMessage()], 500);
                }
            } else {
                sendJsonResponse(["error" => "Ban record already exists for the user."], 409);
            }
        } else {
            sendJsonResponse([
                "success" => "User cheat count updated successfully.",
                "user" => $userData
            ]);
        }
    } else {
        sendJsonResponse(["error" => "No user found with the provided wallet address."], 404);
    }

} catch (PDOException $e) {
    sendJsonResponse(["error" => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(["error" => $e->getMessage()], 500);
}
?>

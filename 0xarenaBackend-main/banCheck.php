<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get the raw POST data
    $data = getJsonInput();
    $walletAddress = isset($data['wallet_address']) ? filter_var($data['wallet_address'], FILTER_SANITIZE_STRING) : '';

    if (empty($walletAddress)) {
        sendJsonResponse(["error" => "Invalid wallet address."], 400);
    }

    // Check if the user is banned and get the ban date
    $sql = 'SELECT "banned", (SELECT "Ban_date" FROM "play_history" WHERE "wallet_address" = ?) AS "Ban_date" 
            FROM "users" WHERE "walletaddress" = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$walletAddress, $walletAddress]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($userData) {
        $isBanned = $userData['banned'];
        $banDate = $userData['Ban_date'];

        if ($isBanned && $banDate) {
            $currentDate = new DateTime();
            $banEndDate = new DateTime($banDate);
            $interval = $currentDate->diff($banEndDate);
            $remainingTime = $interval->format('%H:%I:%S');

            if ($currentDate < $banEndDate) {
                sendJsonResponse(["banned" => true, "remaining_time" => $remainingTime]);
            } else {
                // Begin transaction
                $pdo->beginTransaction();

                try {
                    // Delete the record in play_history table
                    $deleteSql = 'DELETE FROM "play_history" WHERE "wallet_address" = ?';
                    $deleteStmt = $pdo->prepare($deleteSql);
                    $deleteStmt->execute([$walletAddress]);

                    // Update the users table: set banned and cheat_count to 0
                    $updateSql1 = 'UPDATE "users" SET "banned" = 0, "cheat_count" = 0 WHERE "walletaddress" = ?';
                    $updateStmt1 = $pdo->prepare($updateSql1);
                    $updateStmt1->execute([$walletAddress]);

                    // Update the users table: set coins to 0
                    $updateSql2 = 'UPDATE "users" SET "coins" = 0 WHERE "walletaddress" = ?';
                    $updateStmt2 = $pdo->prepare($updateSql2);
                    $updateStmt2->execute([$walletAddress]);

                    // Commit transaction
                    $pdo->commit();
                    sendJsonResponse(["banned" => "False and Updated records"]);

                } catch (Exception $e) {
                    // Rollback transaction on error
                    $pdo->rollBack();
                    error_log("Transaction failed: " . $e->getMessage());
                    sendJsonResponse(["error" => "Internal server error."], 500);
                }
            }
        } else {
            sendJsonResponse(["banned" => false]);
        }
    } else {
        sendJsonResponse(["error" => "User not found."], 404);
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    sendJsonResponse(["error" => "Internal server error."], 500);
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    sendJsonResponse(["error" => $e->getMessage()], 500);
}
?>
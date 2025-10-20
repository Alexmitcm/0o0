<?php
require_once '../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Recursive function to count all referred users and categorize them as left and right nodes
        function countReferredUsers($pdo, $walletaddress) {
            $sql = 'SELECT "walletaddress" FROM "users" WHERE "referer" = :walletaddress';
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['walletaddress' => $walletaddress]);
            $referredUsers = $stmt->fetchAll();

            $leftCount = 0;
            $rightCount = 0;

            foreach ($referredUsers as $index => $user) {
                if ($index % 2 == 0) {
                    $leftResult = countReferredUsers($pdo, $user['walletaddress']);
                    $leftCount += 1 + $leftResult['left'] + $leftResult['right'];
                } else {
                    $rightResult = countReferredUsers($pdo, $user['walletaddress']);
                    $rightCount += 1 + $rightResult['left'] + $rightResult['right'];
                }
            }

            return ['left' => $leftCount, 'right' => $rightCount];
        }

        // Fetch all users along with their coins
        $sql = 'SELECT "walletaddress", "coins" FROM "users"';
        $stmt = $pdo->query($sql);
        $users = $stmt->fetchAll();

        // Calculate and update for each user
        foreach ($users as $user) {
            $walletaddress = $user['walletaddress'];
            $coins = $user['coins'];

            // Calculate referred users
            $totalReferredUsers = countReferredUsers($pdo, $walletaddress);
            $total_eq = min($totalReferredUsers['left'], $totalReferredUsers['right']);

            // Prepare the SQL update query
            $updateSql = 'UPDATE "users" SET "left_node" = :left_node, "right_node" = :right_node, "Total_eq" = :Total_eq WHERE "walletaddress" = :walletaddress';
            $updateStmt = $pdo->prepare($updateSql);
            $updateStmt->execute([
                'left_node' => $totalReferredUsers['left'],
                'right_node' => $totalReferredUsers['right'],
                'Total_eq' => $total_eq,
                'walletaddress' => $walletaddress
            ]);
        }

        sendJsonResponse(['status' => 'success', 'message' => 'User data updated successfully']);
    } else {
        sendJsonResponse(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
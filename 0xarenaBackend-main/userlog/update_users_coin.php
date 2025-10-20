<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get all users
    $sql = 'SELECT "id", "walletaddress", "coins", "CreationDate" FROM "users"';
    $stmt = $pdo->query($sql);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $now = new DateTime();
    $updates = [];

    foreach ($users as $row) {
        $id = $row['id'];
        $wallet = $row['walletaddress'];
        $coins = intval($row['coins']);  // Treat coins as integer
        $creationDate = new DateTime($row['CreationDate']);
        $diff = $now->diff($creationDate);
        $daysSinceCreation = $diff->days;

        if ($diff->m < 2 && $diff->y == 0) {
            // User is less than 2 months old
            if ($coins > 20) {
                $apiUrl = "https://zeroxarenabackend.onrender.com/userlog/check_level_value.php?walletaddress=" . urlencode($wallet);
                $apiResponse = file_get_contents($apiUrl);
                $apiData = json_decode($apiResponse, true);

                if (isset($apiData['levelValue'])) {
                    $levelValue = intval($apiData['levelValue']);
                    $newCoins = intval($levelValue * $daysSinceCreation);
                    $updateSql = 'UPDATE "users" SET "coins" = ? WHERE "id" = ?';
                    $updateStmt = $pdo->prepare($updateSql);
                    $updateStmt->execute([$newCoins, $id]);
                    $updates[] = "✅ Updated user $id (under 2 months): coins set to $newCoins";
                } else {
                    $updates[] = "❌ API failed or no levelValue for user $id";
                }
            }
        } else {
            // User is older than 2 months
            $newCoins = intval($coins * 3);
            $updateSql = 'UPDATE "users" SET "coins" = ? WHERE "id" = ?';
            $updateStmt = $pdo->prepare($updateSql);
            $updateStmt->execute([$newCoins, $id]);
            $updates[] = "✅ Updated user $id (over 2 months): coins set to $newCoins";
        }
    }

    // Get total coins from the coins column (correctly casting it as integer)
    $totalSql = 'SELECT SUM("coins"::integer) AS "total" FROM "users"';
    $totalStmt = $pdo->query($totalSql);
    $totalRow = $totalStmt->fetch(PDO::FETCH_ASSOC);

    if ($totalRow && isset($totalRow['total'])) {
        $totalCoins = $totalRow['total'];
        $updates[] = "\n💰 Total coins (sum of 'coins' column): $totalCoins";
    } else {
        $updates[] = "\n❌ Failed to calculate total coins.";
    }

    // Return the results as JSON
    sendJsonResponse([
        'status' => 'success',
        'updates' => $updates
    ]);

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

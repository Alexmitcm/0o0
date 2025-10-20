<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

// Chunk size for batch processing
$chunkSize = 100;

try {
    $pdo = getDbConnection();

    // Get the total number of users to process
    $countSql = "SELECT COUNT(*) as total FROM users";
    $stmt = $pdo->query($countSql);
    $totalRecords = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Process records in chunks
    for ($offset = 0; $offset < $totalRecords; $offset += $chunkSize) {
        $fetchSql = "SELECT walletaddress, coins, todaysPoints, left_node, right_node, Total_eq 
                     FROM users LIMIT ? OFFSET ?";
        $stmt = $pdo->prepare($fetchSql);
        $stmt->execute([$chunkSize, $offset]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($rows)) {
            $insertSql = "INSERT INTO users_archive (walletaddress, coins, todaysPoints, left_node, right_node, total_eq) 
                          VALUES (?, ?, ?, ?, ?, ?)";
            $insertStmt = $pdo->prepare($insertSql);

            foreach ($rows as $row) {
                $insertStmt->execute([
                    $row['walletaddress'],
                    $row['coins'],
                    $row['todaysPoints'],
                    $row['left_node'],
                    $row['right_node'],
                    $row['Total_eq']
                ]);
            }
        }
    }

    // Keep only the latest 80 records for each walletaddress in `users_archive`
    $fetchWalletsSql = "SELECT DISTINCT walletaddress FROM users_archive";
    $stmt = $pdo->query($fetchWalletsSql);
    $wallets = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($wallets as $walletAddress) {
        // Delete records beyond the latest 80 for the current walletaddress
        $deleteSql = "DELETE FROM users_archive 
                      WHERE walletaddress = ? AND id NOT IN (
                          SELECT id FROM (
                              SELECT id FROM users_archive 
                              WHERE walletaddress = ? 
                              ORDER BY created_at DESC 
                              LIMIT 80
                          ) as temp
                      )";
        $deleteStmt = $pdo->prepare($deleteSql);
        $deleteStmt->execute([$walletAddress, $walletAddress]);
    }

    sendJsonResponse(["message" => "Data archived successfully, and old records removed for each walletaddress."]);

} catch (PDOException $e) {
    sendJsonResponse(["error" => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(["error" => $e->getMessage()], 500);
}
?>

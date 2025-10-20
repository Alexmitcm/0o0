<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Define the query:
    // - Select distinct walletaddress
    // - Must have created_at >= '2025-01-08'
    // - Must not exist (walletaddress) in any record before '2025-01-08'
    $sql = '
        SELECT DISTINCT ua."walletaddress"
        FROM "users_archive" AS ua
        WHERE ua."created_at" >= \'2025-01-26\'
          AND ua."walletaddress" NOT IN (
              SELECT "walletaddress"
              FROM "users_archive"
              WHERE "created_at" < \'2025-01-26\'
          )
    ';

    $stmt = $pdo->query($sql);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Open "php://output" so we can write directly to the downloaded file
    $output = fopen('php://output', 'w');

    // Add a header row to the CSV
    fputcsv($output, ['walletaddress']);

    // Fetch each row and write to CSV
    if ($result) {
        foreach ($result as $row) {
            fputcsv($output, [$row['walletaddress']]);
        }
    }

    // Clean up
    fclose($output);

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>
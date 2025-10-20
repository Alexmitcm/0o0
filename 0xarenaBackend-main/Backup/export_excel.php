<?php
require_once __DIR__ . '/../config.php';

try {
    // Create PDO connection using the centralized config
    $pdo = getDbConnection();

    // Prepare output headers for CSV
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=users_table_backup_' . date('Y-m-d_H-i-s') . '.csv');

    // Open "output" stream directly to the browser
    $output = fopen('php://output', 'w');

    // Query the `users` table
    $stmt = $pdo->query('SELECT * FROM "users"');

    // Fetch column names for the header
    $columnInfo = array_keys($stmt->fetch(PDO::FETCH_ASSOC));
    
    // Write the header row in CSV
    fputcsv($output, $columnInfo);

    // Reset pointer and fetch all rows
    $stmt->execute();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, $row);
    }

    // Close file pointer
    fclose($output);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    exit();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error: " . $e->getMessage()]);
    exit();
}
?>

<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get the column names from the 'users' table
    $tableName = '"users"';
    $columnsQuery = 'SELECT column_name FROM information_schema.columns WHERE table_name = \'users\'';
    $stmt = $pdo->query($columnsQuery);
    $columnNames = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Remove 'token' column from the array
    $filteredColumns = array_diff($columnNames, ['token']);

    // Construct the SELECT statement
    $selectColumns = implode(', ', array_map(function($col) { return '"' . $col . '"'; }, $filteredColumns));
    $sql = 'SELECT ' . $selectColumns . ' FROM "users"';

    $stmt = $pdo->query($sql);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJsonResponse($users);

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

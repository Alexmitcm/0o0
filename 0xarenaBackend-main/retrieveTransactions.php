<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get filter parameters from the URL
    $walletaddress = $_GET['walletaddress'] ?? null;
    $user_tx = $_GET['user_tx'] ?? null;
    $amount = $_GET['amount'] ?? null;
    $from_field = $_GET['from'] ?? null;
    $to_field = $_GET['to'] ?? null;
    
    // Pagination parameters
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;

    // Build the base SQL query for filtering
    $base_sql = 'FROM "withdraw_transactions" WHERE 1=1';
    $params = [];

    if ($walletaddress !== null) {
        $base_sql .= ' AND "walletaddress" = ?';
        $params[] = $walletaddress;
    }
    if ($user_tx !== null) {
        $base_sql .= ' AND "user_tx" = ?';
        $params[] = $user_tx;
    }
    if ($amount !== null) {
        $base_sql .= ' AND "amount" = ?';
        $params[] = $amount;
    }
    if ($from_field !== null) {
        $base_sql .= ' AND "from_field" = ?';
        $params[] = $from_field;
    }
    if ($to_field !== null) {
        $base_sql .= ' AND "to_field" = ?';
        $params[] = $to_field;
    }

    // Get total number of filtered records for pagination
    $total_sql = 'SELECT COUNT(*) AS total ' . $base_sql;
    $totalStmt = $pdo->prepare($total_sql);
    $totalStmt->execute($params);
    $total = $totalStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Now, get the actual data with pagination applied
    $data_sql = 'SELECT * ' . $base_sql . ' LIMIT ? OFFSET ?';
    $params[] = $limit;
    $params[] = $offset;
    
    $dataStmt = $pdo->prepare($data_sql);
    $dataStmt->execute($params);
    $data = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

    // Return the data as JSON
    sendJsonResponse([
        'data' => $data,
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => ceil($total / $limit)
    ]);

} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

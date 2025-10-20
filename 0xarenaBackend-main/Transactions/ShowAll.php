<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Set default values for pagination
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        // Define the base query
        $baseQuery = 'SELECT * FROM "tokentx"';
        $conditions = [];
        $params = [];

        // Define the list of allowed fields for filtering
        $allowedFields = [
            'blockNumber', 'timeStamp', 'hash', 'nonce', 'blockHash', 
            'sender', 'contractAddress', 'recipient', 'value', 'tokenName', 
            'tokenSymbol', 'tokenDecimal', 'transactionIndex', 'gas', 
            'gasPrice', 'gasUsed', 'cumulativeGasUsed', 'input', 
            'confirmations', 'address'
        ];

        // Loop through all possible query parameters
        foreach ($_GET as $field => $value) {
            if (in_array($field, $allowedFields) && $value !== '') {
                if ($field === 'address') {
                    $conditions[] = '("sender" = :sender OR "recipient" = :recipient)';
                    $params[':sender'] = $value;
                    $params[':recipient'] = $value;
                } else {
                    $conditions[] = '"' . $field . '" = :' . $field;
                    $params[':' . $field] = $value;
                }
            }
        }

        // If there are any conditions, append them to the base query
        if (count($conditions) > 0) {
            $baseQuery .= ' WHERE ' . implode(' AND ', $conditions);
        }

        // Count total rows
        $countQuery = 'SELECT COUNT(*) FROM "tokentx"';
        if (count($conditions) > 0) {
            $countQuery .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $countStmt = $pdo->prepare($countQuery);
        foreach ($params as $key => $val) {
            $countStmt->bindValue($key, $val);
        }
        $countStmt->execute();
        $totalRows = $countStmt->fetchColumn();

        // Calculate total pages
        $totalPages = ceil($totalRows / $limit);

        // Add pagination to the base query
        $baseQuery .= ' LIMIT :limit OFFSET :offset';

        // Prepare and execute the main query
        $stmt = $pdo->prepare($baseQuery);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        // Fetch results
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendJsonResponse([
            'page' => $page,
            'limit' => $limit,
            'total_pages' => $totalPages,
            'data' => $results
        ]);
    } else {
        sendJsonResponse(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => 'Error: ' . $e->getMessage()], 500);
}
?>

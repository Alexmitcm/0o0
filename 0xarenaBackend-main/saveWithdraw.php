<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get data from frontend
    $walletaddress = $_POST['walletaddress'] ?? null;
    $user_tx = $_POST['user_tx'] ?? null;
    $amount = $_POST['amount'] ?? null;
    $from = $_POST['From'] ?? null;
    $to = $_POST['To'] ?? null;

    if (!$walletaddress || !$user_tx || !$amount || !$from || !$to) {
        sendJsonResponse(['error' => 'Missing required parameters'], 400);
    }

    // Generate current date and time
    $date_of_transaction = date("Y-m-d H:i:s");

    // Insert data into the table
    $sql = 'INSERT INTO "withdraw_transactions" ("walletaddress", "user_tx", "amount", "from_field", "to_field", "date_of_transaction") 
            VALUES (?, ?, ?, ?, ?, ?)';
    
    $stmt = $pdo->prepare($sql);
    
    if ($stmt->execute([$walletaddress, $user_tx, $amount, $from, $to, $date_of_transaction])) {
        sendJsonResponse(['message' => 'Data stored successfully']);
    } else {
        sendJsonResponse(['error' => 'Failed to store data'], 500);
    }
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

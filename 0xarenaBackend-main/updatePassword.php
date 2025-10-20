<?php
require_once 'config.php';

// Set up CORS headers and error handling
setCorsHeaders();
setErrorHandling();

// Make sure this is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Method not allowed. Please use POST.'], 405);
}

// Get input data
$data = getJsonInput();

// Validate required parameters
if (!isset($data['walletaddress']) || !isset($data['token']) || !isset($data['password'])) {
    sendJsonResponse(['error' => 'Missing required parameters: walletaddress, token, password'], 400);
}

$walletAddress = trim($data['walletaddress']);
$token = trim($data['token']);
$newPassword = trim($data['password']);

// Validate wallet address format (basic check for 0x prefixed Ethereum address)
if (!preg_match('/^0x[a-fA-F0-9]{40}$/', $walletAddress)) {
    sendJsonResponse(['error' => 'Invalid wallet address format'], 400);
}

// Validate password length
if (strlen($newPassword) < 8) {
    sendJsonResponse(['error' => 'Password must be at least 8 characters long'], 400);
}

// Connect to database
$pdo = getDbConnection();

try {
    // First, check if the wallet address and token match a record
    $stmt = $pdo->prepare("SELECT id FROM users WHERE walletaddress = :walletaddress AND token = :token");
    $stmt->bindParam(':walletaddress', $walletAddress);
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        // No matching user found with this wallet address and token
        sendJsonResponse(['error' => 'Invalid credentials or user not found'], 401);
    }
    
    // User found, now update the password
    // First hash the password for security
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Generate a new token for additional security
    $newToken = bin2hex(random_bytes(32));
    
    // Begin transaction for atomicity
    $pdo->beginTransaction();
    
    // Update the password and token
    $updateStmt = $pdo->prepare("UPDATE users SET password = :password, token = :newToken WHERE walletaddress = :walletaddress AND token = :oldToken");
    $updateStmt->bindParam(':password', $hashedPassword);
    $updateStmt->bindParam(':newToken', $newToken);
    $updateStmt->bindParam(':walletaddress', $walletAddress);
    $updateStmt->bindParam(':oldToken', $token);
    $updateStmt->execute();
    
    // Check if the update was successful
    if ($updateStmt->rowCount() > 0) {
        $pdo->commit();
        sendJsonResponse([
            'success' => true, 
            'message' => 'Password updated successfully',
            'new_token' => $newToken
        ]);
    } else {
        $pdo->rollBack();
        sendJsonResponse(['error' => 'Failed to update password'], 500);
    }
    
} catch (PDOException $e) {
    // If transaction is active, roll it back
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Log the error but don't expose details to the client
    error_log("Password update error: " . $e->getMessage());
    sendJsonResponse(['error' => 'Database error occurred'], 500);
} catch (Exception $e) {
    // Handle other exceptions
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("General error: " . $e->getMessage());
    sendJsonResponse(['error' => 'An error occurred'], 500);
} 
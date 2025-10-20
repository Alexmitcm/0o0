<?php
require_once __DIR__ . '/../config.php';
setCorsHeaders();
setErrorHandling();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);

// Validate required parameters
if (!isset($data['walletaddress']) || !isset($data['code']) || !isset($data['new_password'])) {
    sendJsonResponse(['error' => 'Missing required parameters: walletaddress, code, new_password'], 400);
}

$walletAddress = trim($data['walletaddress']);
$code = trim($data['code']);
$newPassword = trim($data['new_password']);

// Validate wallet address format
if (!preg_match('/^0x[a-fA-F0-9]{40}$/', $walletAddress)) {
    sendJsonResponse(['error' => 'Invalid wallet address format'], 400);
}

// Validate password length
if (strlen($newPassword) < 8) {
    sendJsonResponse(['error' => 'Password must be at least 8 characters long'], 400);
}

try {
    $pdo = getDbConnection();
    
    // Check if the code is valid and not expired
    $stmt = $pdo->prepare("
        SELECT id 
        FROM users 
        WHERE walletaddress = :walletaddress 
        AND forget_password_code = :code 
        AND forget_password_expiry > NOW()
    ");
    
    $stmt->execute([
        ':walletaddress' => $walletAddress,
        ':code' => $code
    ]);
    
    if ($stmt->rowCount() === 0) {
        sendJsonResponse([
            'success' => false,
            'error' => 'Invalid or expired reset code'
        ], 400);
    }
    
    // Code is valid, update password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $newToken = bin2hex(random_bytes(32));
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Update password and clear reset code
        $updateStmt = $pdo->prepare("
            UPDATE users 
            SET password = :password,
                token = :newToken,
                forget_password_code = NULL,
                forget_password_expiry = NULL
            WHERE walletaddress = :walletaddress 
            AND forget_password_code = :code
        ");
        
        $updateStmt->execute([
            ':password' => $hashedPassword,
            ':newToken' => $newToken,
            ':walletaddress' => $walletAddress,
            ':code' => $code
        ]);
        
        if ($updateStmt->rowCount() > 0) {
            $pdo->commit();
            sendJsonResponse([
                'success' => true,
                'message' => 'Password updated successfully',
                'new_token' => $newToken
            ]);
        } else {
            throw new Exception('Failed to update password');
        }
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'error' => 'An error occurred while resetting password'
    ], 500);
} 
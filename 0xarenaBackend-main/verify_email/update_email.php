<?php
require_once __DIR__ . '/../config.php';
setCorsHeaders();
setErrorHandling();

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);
$walletAddress = isset($data['walletaddress']) ? trim($data['walletaddress']) : null;
$newEmail = isset($data['new_email']) ? trim($data['new_email']) : null;

if (!$walletAddress || !$newEmail) {
    sendJsonResponse(['success' => false, 'error' => 'walletaddress and new_email are required'], 400);
}

if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
    sendJsonResponse(['success' => false, 'error' => 'Invalid email format'], 400);
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare('SELECT 1 FROM users WHERE walletaddress = ?');
    $stmt->execute([$walletAddress]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        sendJsonResponse(['success' => false, 'error' => 'User not found.'], 404);
    }
    $update = $pdo->prepare('UPDATE users SET email = ?, isemailverified = 0 WHERE walletaddress = ?');
    $update->execute([$newEmail, $walletAddress]);
    sendJsonResponse(['success' => true, 'message' => 'Email updated. Please verify your new email address.']);
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
} 
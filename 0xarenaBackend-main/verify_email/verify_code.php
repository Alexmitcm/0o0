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
$code = isset($data['code']) ? trim($data['code']) : null;

if (!$walletAddress || !$code) {
    sendJsonResponse(['success' => false, 'error' => 'walletaddress and code are required'], 400);
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare('SELECT verification_id, expiration_validation FROM users WHERE walletaddress = ?');
    $stmt->execute([$walletAddress]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user || empty($user['verification_id']) || empty($user['expiration_validation'])) {
        sendJsonResponse(['success' => false, 'error' => 'No verification code found.'], 404);
    }

    $now = new DateTime();
    $expires = new DateTime($user['expiration_validation']);
    if ($user['verification_id'] !== $code || $now > $expires) {
        sendJsonResponse(['success' => false, 'error' => 'Invalid or expired code.'], 400);
    }

    // Update isemailverified, clear code and expiration
    $update = $pdo->prepare('UPDATE users SET isemailverified = 1, verification_id = NULL, expiration_validation = NULL WHERE walletaddress = ?');
    $update->execute([$walletAddress]);

    sendJsonResponse(['success' => true, 'message' => 'Email verified successfully.']);
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
} 
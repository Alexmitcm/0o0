<?php
require_once __DIR__ . '/../config.php';
setCorsHeaders();
setErrorHandling();

define('RESEND_API_KEY', 're_Msk1zKPW_635Arv3pRLSDrXDgRHoZqmFh'); // Place at the top

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);
$walletAddress = isset($data['walletaddress']) ? trim($data['walletaddress']) : null;

if (!$walletAddress) {
    sendJsonResponse(['success' => false, 'error' => 'walletaddress is required'], 400);
}

function generateVerificationCode($length = 6) {
    $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[random_int(0, $charactersLength - 1)];
    }
    return $randomString;
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare('SELECT email FROM users WHERE walletaddress = ?');
    $stmt->execute([$walletAddress]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user || empty($user['email'])) {
        sendJsonResponse(['success' => false, 'error' => 'User not found or email not set.'], 404);
    }

    // Generate a 6-digit code
    $code = generateVerificationCode(6);
    $expires = (new DateTime('+6 hours'))->format('Y-m-d H:i:s');

    // Save code and expiration
    $update = $pdo->prepare('UPDATE users SET verification_id = ?, expiration_validation = ? WHERE walletaddress = ?');
    $update->execute([$code, $expires, $walletAddress]);

    // Send email (using Resend API)
    $to = $user['email'];
    $subject = '0xArena Email Verification Code';
    $html = "<div style=\"font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;\">
        <div style=\"background: #181c2a; color: #fff; padding: 24px 0; text-align: center;\">
            <img src=\"https://backend.0xarena.com/logo.png\" alt=\"0xArena\" style=\"height: 48px; margin-bottom: 8px;\" />
            <h2 style=\"margin: 0; font-size: 2rem; letter-spacing: 1px;color: #dbdbdb;\">0xArena Email Verification</h2>
        </div>
        <div style=\"padding: 32px 24px 24px 24px; background: #fff; color: #222;\">
            <p style=\"font-size: 1.1rem; margin-bottom: 24px;\">Thank you for signing up with <a href=\"https://0xarena.com\" style=\"color: #007bff; text-decoration: none;\">0xArena.com</a>!</p>
            <p style=\"font-size: 1.1rem; margin-bottom: 16px;\">Your verification code is:</p>
            <div style=\"font-size: 2.2rem; font-weight: bold; letter-spacing: 6px; color: #181c2a; background: #f4f4f4; padding: 18px 0; border-radius: 6px; text-align: center; margin-bottom: 24px;\">$code</div>
            <p style=\"font-size: 1rem; color: #555;\">This code will expire in <b>6 hours</b>. Please enter it on the verification page to complete your registration.</p>
            <p style=\"font-size: 1rem; color: #555; margin-top: 32px;\">If you did not request this code, you can safely ignore this email.</p>
        </div>
        <div style=\"background: #181c2a; color: #fff; text-align: center; padding: 16px 0; font-size: 0.95rem;\">
            &copy; " . date('Y') . " <a href=\"https://0xarena.com\" style=\"color: #fff; text-decoration: underline;\">0xArena.com</a> &mdash; The Blockchain Gaming Arena
        </div>
    </div>";

    $payload = [
        'from' => '0xArena Team <verify@0xarena.com>',
        'to' => [$to],
        'subject' => $subject,
        'html' => $html,
        'text' => "Thank you for signing up with 0xArena.com!\n\nYour verification code is: $code\n\nThis code will expire in 6 hours. Please enter it on the verification page to complete your registration.\n\nIf you did not request this code, you can safely ignore this email.\n\n0xArena.com - The Blockchain Gaming Arena"
    ];

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . RESEND_API_KEY,
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode < 200 || $httpCode >= 300) {
        sendJsonResponse(['success' => false, 'error' => 'Failed to send verification email.'], 500);
    }

    sendJsonResponse(['success' => true, 'message' => 'Verification code sent to your email.']);
} catch (Exception $e) {
    sendJsonResponse(['success' => false, 'error' => $e->getMessage()], 500);
} 
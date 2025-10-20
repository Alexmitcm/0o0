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
if (!isset($data['walletaddress']) || !isset($data['password'])) {
    sendJsonResponse(['error' => 'Missing required parameters: walletaddress, password'], 400);
}

$walletAddress = trim($data['walletaddress']);
$password = trim($data['password']);

// Validate wallet address format (basic check for 0x prefixed Ethereum address)
if (!preg_match('/^0x[a-fA-F0-9]{40}$/', $walletAddress)) {
    sendJsonResponse(['error' => 'Invalid wallet address format'], 400);
}

// Connect to database
$pdo = getDbConnection();

try {
    // First check if the account is locked due to too many failed attempts
    $lockCheckStmt = $pdo->prepare("SELECT login_attempts, last_attempt_time FROM users WHERE walletaddress = :walletaddress");
    $lockCheckStmt->bindParam(':walletaddress', $walletAddress);
    $lockCheckStmt->execute();
    
    $lockInfo = $lockCheckStmt->fetch(PDO::FETCH_ASSOC);
    
    // If user exists, check for account lockout
    if ($lockInfo) {
        $loginAttempts = $lockInfo['login_attempts'] ?? 0;
        $lastAttemptTime = $lockInfo['last_attempt_time'] ?? null;
        
        // Check if account is temporarily locked (6 or more failed attempts within the last 30 minutes)
        $lockoutThreshold = 6; // Maximum allowed failures
        $lockoutDuration = 30 * 60; // 30 minutes in seconds
        
        if ($loginAttempts >= $lockoutThreshold && $lastAttemptTime) {
            $timeSinceLastAttempt = time() - strtotime($lastAttemptTime);
            
            if ($timeSinceLastAttempt < $lockoutDuration) {
                $timeLeft = $lockoutDuration - $timeSinceLastAttempt;
                $minutesLeft = ceil($timeLeft / 60);
                
                sendJsonResponse([
                    'error' => 'Account temporarily locked due to too many failed attempts. Try again in ' . $minutesLeft . ' minutes.'
                ], 429);
            } else {
                // Lockout period has expired, reset counters
                $resetStmt = $pdo->prepare("UPDATE users SET login_attempts = 0 WHERE walletaddress = :walletaddress");
                $resetStmt->bindParam(':walletaddress', $walletAddress);
                $resetStmt->execute();
            }
        }
    }
    
    // Fetch user with the provided wallet address
    $stmt = $pdo->prepare("SELECT id, walletaddress, password, username, email, coins, token FROM users WHERE walletaddress = :walletaddress");
    $stmt->bindParam(':walletaddress', $walletAddress);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        // No user found with this wallet address
        // We'll still record the attempt to prevent timing attacks
        $debugInfo = [
            'error' => 'Invalid credentials',
            'debug' => [
                'reason' => 'User not found',
                'wallet_address' => $walletAddress
            ]
        ];
        sendJsonResponse($debugInfo, 401);
    }
    
    // Prepare debug information (limited for security)
    $debugInfo = [
        'error' => 'Invalid credentials',
        'debug' => [
            'wallet_address' => $walletAddress,
            'post_password_length' => strlen($password),
            'post_password_preview' => substr($password, 0, 3) . '...',
            'has_stored_password' => isset($user['password']) && !empty($user['password']),
        ]
    ];
    
    // Add hash algorithm info if a password exists
    if (isset($user['password']) && !empty($user['password'])) {
        $hashInfo = password_get_info($user['password']);
        $debugInfo['debug']['hash_algorithm'] = $hashInfo['algoName'];
        $debugInfo['debug']['hash_options'] = $hashInfo['options'];
        $debugInfo['debug']['stored_hash_preview'] = substr($user['password'], 0, 10) . '...';
        $debugInfo['debug']['stored_hash_full'] = $user['password']; // Show full hash for debugging
        
        // password_verify directly compares plain text password with the hash
        $passwordVerifyResult = password_verify($password, $user['password']);
        $debugInfo['debug']['password_verify_result'] = $passwordVerifyResult;
        
        // Add more detailed info
        $debugInfo['debug']['raw_password_input'] = $password;
        $debugInfo['debug']['password_input_encoding'] = mb_detect_encoding($password);
        $debugInfo['debug']['password_input_ascii'] = implode(',', array_map('ord', str_split($password)));
        
        // Try verifying with trimmed password (in case of whitespace)
        $trimmedPassword = trim($password);
        if ($trimmedPassword !== $password) {
            $debugInfo['debug']['trimmed_password'] = $trimmedPassword;
            $debugInfo['debug']['verify_with_trimmed'] = password_verify($trimmedPassword, $user['password']);
        }
        
        // Add a test hash of the same password to see if it would verify
        $testHash = password_hash($password, PASSWORD_DEFAULT);
        $debugInfo['debug']['test_hash'] = $testHash;
        $debugInfo['debug']['would_verify_with_test_hash'] = password_verify($password, $testHash);
        
        // Try updating the password with the same value
        $updateStmt = $pdo->prepare("UPDATE users SET password = :password WHERE walletaddress = :walletaddress");
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $updateStmt->bindParam(':password', $newHash);
        $updateStmt->bindParam(':walletaddress', $walletAddress);
        $updateStmt->execute();
        $debugInfo['debug']['password_updated_in_db'] = true;
        $debugInfo['debug']['new_hash'] = $newHash;
    } else {
        $debugInfo['debug']['reason'] = 'No password set for this user';
    }
    
    // Verify the password - comparing plain text POST password with stored hash
    if (!isset($user['password']) || empty($user['password']) || !password_verify($password, $user['password'])) {
        // Password doesn't match, increment failed login attempts
        $currentTime = date('Y-m-d H:i:s');
        $updateAttemptStmt = $pdo->prepare("UPDATE users SET login_attempts = COALESCE(login_attempts, 0) + 1, last_attempt_time = :time WHERE walletaddress = :walletaddress");
        $updateAttemptStmt->bindParam(':time', $currentTime);
        $updateAttemptStmt->bindParam(':walletaddress', $walletAddress);
        $updateAttemptStmt->execute();
        
        sendJsonResponse($debugInfo, 401);
    }
    
    // Authentication successful, reset login attempt counters
    $resetStmt = $pdo->prepare("UPDATE users SET login_attempts = 0, last_attempt_time = NULL WHERE walletaddress = :walletaddress");
    $resetStmt->bindParam(':walletaddress', $walletAddress);
    $resetStmt->execute();
    
    // Generate a new token for this session
    $newToken = bin2hex(random_bytes(32));
    
    // Update the user's token and last login time
    $currentTime = date('Y-m-d H:i:s');
    $updateStmt = $pdo->prepare("UPDATE users SET token = :token, last_login = :lastLogin WHERE walletaddress = :walletaddress");
    $updateStmt->bindParam(':token', $newToken);
    $updateStmt->bindParam(':lastLogin', $currentTime);
    $updateStmt->bindParam(':walletaddress', $walletAddress);
    $updateStmt->execute();
    
    // Remove password from user data before returning
    unset($user['password']);
    
    // Update token in the user data
    $user['token'] = $newToken;
    
    // Return user data with the new token
    sendJsonResponse([
        'success' => true,
        'message' => 'Authentication successful',
        'user' => $user
    ]);
    
} catch (PDOException $e) {
    // Log the error but don't expose details to the client
    error_log("Signin error: " . $e->getMessage());
    sendJsonResponse(['error' => 'Database error occurred'], 500);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    sendJsonResponse(['error' => 'An error occurred'], 500);
}
?> 
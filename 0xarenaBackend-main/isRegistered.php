<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

// Function to get the token based on the wallet address
function getTokenByWalletAddress($walletAddress) {
    try {
        $pdo = getDbConnection();

        // Prepare and execute SQL query to get the token based on wallet address
        $sql = 'SELECT "token" FROM "users" WHERE "walletaddress" = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$walletAddress]);
        $token = $stmt->fetchColumn();

        // If the user exists, generate a session token and store it in the session
        if ($token !== false) {
            // Generate a session token
            $sessionToken = generateRandomToken($walletAddress);

            // Store the session token in the session
            session_start();
            $_SESSION['user_token'] = $sessionToken;

            // Return the session token
            return $sessionToken;
        }

        return null;
    } catch (PDOException $e) {
        error_log("Error in getTokenByWalletAddress: " . $e->getMessage());
        sendJsonResponse(['error' => 'Internal Server Error'], 500);
    }
}

// Function to generate a random token
function generateRandomToken($walletAddress) {
    // Get the last 15 characters of the wallet address
    $last15Characters = substr($walletAddress, -15);

    // Generate a SHA256 hash of the last 15 characters
    return hash('sha256', $last15Characters);
}

// Get parameter from the POST request
$walletAddress = $_POST['walletaddress'] ?? '';

// Validate input
if (!empty($walletAddress)) {
    // Call the getTokenByWalletAddress function
    $token = getTokenByWalletAddress($walletAddress);

    // Check if the user exists
    if ($token !== null) {
        sendJsonResponse(['token' => $token]);
    } else {
        sendJsonResponse(['error' => 'User not found'], 404);
    }
} else {
    sendJsonResponse(['error' => 'Wallet address is required'], 400);
}
?>

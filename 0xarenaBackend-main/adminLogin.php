<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // User credentials from POST
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        sendJsonResponse(['error' => 'Username and password are required'], 400);
    }

    // Hash the provided password using MD5 (not recommended for production)
    $hashedPassword = md5($password);

    // SQL query to check if the username and hashed password exist in the admin table
    $sql = 'SELECT * FROM "admin" WHERE "Email" = ? AND "password" = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$username, $hashedPassword]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        // Generate a session token
        $sessionToken = generateRandomToken();

        // Store the session token in the session
        session_start();
        $_SESSION['admin_token'] = $sessionToken;

        // Return the session token as a JSON response
        sendJsonResponse(['token' => $sessionToken]);
    } else {
        sendJsonResponse(['error' => 'Invalid username or password'], 401);
    }

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}

// Function to generate a random token
function generateRandomToken($length = 32) {
    return bin2hex(random_bytes($length));
}
?>

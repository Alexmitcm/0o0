<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

// Function to check if a user with the given wallet address already exists
function userExists($pdo, $walletAddress) {
    $stmt = $pdo->prepare('SELECT * FROM "users" WHERE "walletaddress" = ?');
    $stmt->execute([$walletAddress]);
    return $stmt->rowCount() > 0;
}

// Function to check if a user with the given wallet address already exists and return user data
function getUserData($pdo, $walletAddress) {
    $stmt = $pdo->prepare('SELECT "token", "referer" FROM "users" WHERE "walletaddress" = ?');
    $stmt->execute([$walletAddress]);
    if ($stmt->rowCount() > 0) {
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    return false;
}

// Function to sign up a user and store data in the database
function signUpUser($pdo, $username, $walletAddress, $email, $isEmailVerified, $referer) {
    $hashedToken = hash('sha256', substr($walletAddress, -15));
    session_start();
    $_SESSION['user_token'] = $hashedToken;

    try {
        $tableInfo = $pdo->query('SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = \'users\'')->fetchAll(PDO::FETCH_ASSOC);

        $sequenceName = null;
        foreach ($tableInfo as $column) {
            if ($column['column_name'] === 'id' && strpos($column['column_default'], 'nextval') !== false) {
                preg_match("/nextval\('(.*)'::regclass\)/", $column['column_default'], $matches);
                if (isset($matches[1])) {
                    $sequenceName = $matches[1];
                }
                break;
            }
        }

        $rolePremission = !empty($referer) ? 'Premium' : 'User';

        if ($sequenceName) {
            $sql = 'INSERT INTO "users" (
                "id", "username", "walletaddress", "email", "isemailverified", "token", "referer", "RolePremission",
                "coins", "Tether", "cheat_count", "banned", "todaysPoints", "IsUsernameChanged", "CreationDate",
                "LastCoinUpdated", "left_node", "right_node", "Total_eq", "is_captcha_banned"
            ) VALUES (
                nextval(\'' . $sequenceName . '\'), ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, NOW(), NULL, NULL, NULL, 0, 0
            )';
            $params = [$username, $walletAddress, $email, $isEmailVerified, $hashedToken, $referer, $rolePremission];
        } else {
            $sql = 'INSERT INTO "users" (
                "username", "walletaddress", "email", "isemailverified", "token", "referer", "RolePremission",
                "coins", "Tether", "cheat_count", "banned", "todaysPoints", "IsUsernameChanged", "CreationDate",
                "LastCoinUpdated", "left_node", "right_node", "Total_eq", "is_captcha_banned"
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, NOW(), NULL, NULL, NULL, 0, 0
            )';
            $params = [$username, $walletAddress, $email, $isEmailVerified, $hashedToken, $referer, $rolePremission];
        }

        $stmt = $pdo->prepare($sql);
        $success = $stmt->execute($params);

        if ($success) {
            sendJsonResponse([
                'token' => $hashedToken,
                'referer' => $referer
            ]);
        } else {
            sendJsonResponse(['error' => 'Failed to store user data'], 500);
        }
    } catch (PDOException $e) {
        sendJsonResponse([
            'error' => 'Error in signup: ' . $e->getMessage(),
            'sql' => $sql ?? 'No SQL prepared'
        ], 500);
    }
}

// Check if the request is a POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $pdo = getDbConnection();

        $username = $_POST['username'] ?? '';
        $walletAddress = $_POST['walletaddress'] ?? '';
        $email = $_POST['email'] ?? '';
        $isEmailVerified = $_POST['isemailverified'] ?? '';
        $referer = $_POST['referer'] ?? '';

        if (empty($username) || empty($walletAddress) || empty($email) || !isset($isEmailVerified)) {
            sendJsonResponse(['error' => 'Invalid input'], 400);
        }

        if (userExists($pdo, $walletAddress)) {
            $userData = getUserData($pdo, $walletAddress);
            sendJsonResponse([
                'token' => $userData['token'],
                'referer' => $userData['referer']
            ]);
        } else {
            signUpUser($pdo, $username, $walletAddress, $email, $isEmailVerified, $referer);
        }
    } catch (PDOException $e) {
        sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    } catch (Exception $e) {
        sendJsonResponse(['error' => $e->getMessage()], 500);
    }
} else {
    sendJsonResponse(['error' => 'Method not allowed'], 405);
}
?>

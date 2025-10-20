<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

// Read walletaddress parameter
if (!isset($_GET['walletaddress'])) {
    sendJsonResponse(["error" => "walletaddress parameter is required"], 400);
}

$walletAddress = htmlspecialchars($_GET['walletaddress']);

// New logic for level value based on creation date and node conditions
function calculateLevelValue($userData) {
    $creationDate = new DateTime($userData['CreationDate']);
    $currentDate = new DateTime();
    $interval = $creationDate->diff($currentDate);
    $daysSinceCreation = $interval->days;
    if ($daysSinceCreation < 30) {
        return 2000;
    }
    // Base stamina value
    $baseStamina = 500;

    // Check Total_eq value
    if (isset($userData['Total_eq'])) {
        // If eq is more than 2, give 2500 stamina
        if ($userData['Total_eq'] >= 2) {
            return 2500;
        }
        // If eq is 1, give 1500 stamina (unless account is older than 3 months)
        else if ($userData['Total_eq'] == 1) {
            // If account is older than 3 months (90 days), return base stamina
            if ($daysSinceCreation > 90) {
                return $baseStamina;
            }
            return 1500;
        }
    }

    // If account is older than 3 months, return base stamina (500) regardless of other conditions
    if ($daysSinceCreation > 90) {
        return $baseStamina;
    }
    else {
        return 1600;
    }
}

try {
    $pdo = getDbConnection();

    // Get user data
    $sql = 'SELECT "CreationDate", "Total_eq", "left_node", "right_node", "banned" FROM "users" WHERE "walletaddress" = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$walletAddress]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userData) {
        sendJsonResponse(["error" => "User not found"], 404);
    }

    // Check if user is banned
    if ($userData['banned'] == 1) {
        sendJsonResponse([
            "walletaddress" => $walletAddress,
            "levelValue" => 0
        ]);
    }

    // Calculate level value
    $levelValue = calculateLevelValue($userData);

    // Return the result
    sendJsonResponse([
        "walletaddress" => $walletAddress,
        "levelValue" => $levelValue
    ]);

} catch (PDOException $e) {
    sendJsonResponse(["error" => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(["error" => $e->getMessage()], 500);
}
?>

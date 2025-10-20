<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

// session_start();
// if (!isset($_SESSION['admin_token'])) {
//     // If the session is not set, return an unauthorized response
//     http_response_code(401); // Unauthorized
//     echo json_encode(['error' => 'Unauthorized access']);
//     exit();
// }

// Function to validate date format (e.g., YYYY-MM-DD HH:MM:SS)
function validateDate($date, $format = 'Y-m-d H:i:s') {
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}

// Function to sanitize and convert date format
function sanitizeDate($date) {
    // Remove 'T' and 'Z'
    $date = str_replace(['T', 'Z'], ' ', $date);
    // Convert to 'Y-m-d H:i:s' format
    $dateTime = new DateTime($date);
    return $dateTime->format('Y-m-d H:i:s');
}

// Function to sanitize string input (replacement for deprecated FILTER_SANITIZE_STRING)
function sanitizeString($str) {
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}

// Function to generate a random alphanumeric string of a given length
function generateRandomId($length) {
    $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    $randomString = '';

    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, strlen($characters) - 1)];
    }

    return $randomString;
}

try {
    $pdo = getDbConnection();

    // Validate and sanitize POST data
    $required_fields = ['gameName', 'startDate', 'endDate', 'tagForSeo', 'minimumCoin', 'minimumRefer', 'maximumRefer', 'storageCapacity', 'TournamentPrize'];
    foreach ($required_fields as $field) {
        if (!isset($_POST[$field])) {
            sendJsonResponse(['error' => "Missing field: $field"], 400);
        }
    }

    // Use the new sanitizeString function instead of FILTER_SANITIZE_STRING
    $gameName = sanitizeString($_POST['gameName']);
    $startDate = sanitizeDate($_POST['startDate']);
    $endDate = sanitizeDate($_POST['endDate']);
    $tagForSeo = sanitizeString($_POST['tagForSeo']);
    $minimumCoin = intval($_POST['minimumCoin']);
    $minimumRefer = intval($_POST['minimumRefer']);
    $maximumRefer = intval($_POST['maximumRefer']);
    $storageCapacity = intval($_POST['storageCapacity']);
    $tether = $_POST['TournamentPrize'];

    // Validate dates
    if (!validateDate($startDate) || !validateDate($endDate)) {
        sendJsonResponse(['error' => 'Invalid date format'], 400);
    }

    // Generate a random alphanumeric tournamentId
    $tournamentId = generateRandomId(10);

    // SQL query with prepared statement - using the exact column names from the database
    $sql = 'INSERT INTO "tournaments" (
        "CreationDate",
        "MinimumCoin",
        "MinimumRefer",
        "maximumRefer",
        "StorageCapacity",
        "CoinsGathered",
        "tournamentId",
        "TournamentPrize",
        "TournamentName",
        "StartDate",
        "EndDate",
        "TagForSeo",
        "isDisabled"
    ) VALUES (NOW(), ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, false)';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $minimumCoin,        // MinimumCoin
        $minimumRefer,       // MinimumRefer
        $maximumRefer,       // maximumRefer
        $storageCapacity,    // StorageCapacity
        $tournamentId,       // tournamentId
        $tether,            // TournamentPrize
        $gameName,          // TournamentName
        $startDate,         // StartDate
        $endDate,           // EndDate
        $tagForSeo,         // TagForSeo
    ]);

    sendJsonResponse([
        "message" => "Tournament record inserted successfully",
        "tournamentId" => $tournamentId,
        "tagForSeo" => $tagForSeo
    ]);

} catch (PDOException $e) {
    sendJsonResponse(['error' => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

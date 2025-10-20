<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Check if walletaddress is provided in the POST request
    $postedWalletAddress = $_POST['walletaddress'] ?? null;

    if (!$postedWalletAddress) {
        sendJsonResponse(['error' => 'Wallet address is required'], 400);
    }

    // Prepare SQL statement to get distinct tournamentIds for the specified wallet address
    $sqlTournamentIds = 'SELECT DISTINCT "tournamentId" FROM "userTransactions" WHERE "walletAddress" = ?';
    $stmtTournamentIds = $pdo->prepare($sqlTournamentIds);
    $stmtTournamentIds->execute([$postedWalletAddress]);
    $tournamentIdArray = $stmtTournamentIds->fetchAll(PDO::FETCH_COLUMN);

    // Retrieve user data from the users table based on walletaddress
    // Get all columns with SELECT *
    $sqlUser = 'SELECT * FROM "users" WHERE "walletaddress" = ?';
    $stmtUser = $pdo->prepare($sqlUser);
    $stmtUser->execute([$postedWalletAddress]);
    $userData = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$userData) {
        sendJsonResponse(['error' => 'User not found'], 404);
    }

    // Check if password exists and replace with has_pass flag
    if (isset($userData['password'])) {
        $hasPassword = !empty($userData['password']);
        $userData['has_pass'] = $hasPassword;
        unset($userData['password']); // Remove the actual password from the response
    } else {
        $userData['has_pass'] = false;
    }

    // Get the Total_eq from the API
    $curl = curl_init();
    $url = "https://zeroxarenabackend.onrender.com/eq/CountEq.php?walletaddress=" . urlencode($postedWalletAddress);
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    $response = curl_exec($curl);
    curl_close($curl);

    $responseData = json_decode($response, true);
    $totalEq = $responseData['Total_eq'] ?? 0;

    // Get the levelValue from check_level_value API
    $checkLevelUrl = "https://zeroxarenabackend.onrender.com/userlog/check_level_value.php?walletaddress=" . urlencode($postedWalletAddress);
    $levelApiResponse = file_get_contents($checkLevelUrl);
    if ($levelApiResponse !== false) {
        $levelApiData = json_decode($levelApiResponse, true);
        if (isset($levelApiData['levelValue'])) {
            $userData['staminaLevel'] = $levelApiData['levelValue'];
        }
    }

    sendJsonResponse([
        "Has_Tournaments" => !empty($tournamentIdArray),
        "tournamentIds" => $tournamentIdArray,
        "user" => $userData
    ]);

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

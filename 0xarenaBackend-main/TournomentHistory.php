<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get the wallet address from the POST request
    $walletAddress = $_POST['walletaddress'] ?? null;

    if (!$walletAddress) {
        sendJsonResponse([], 200);
    }

    // Fetch data from the API
    $apiUrl = 'ShowAllTournoSimple.php';
    $apiResponse = file_get_contents($apiUrl);
    
    if ($apiResponse === false) {
        sendJsonResponse(['error' => 'Failed to fetch data from the external API'], 500);
    }

    $tournaments = json_decode($apiResponse, true);
    if ($tournaments === null) {
        sendJsonResponse(['error' => 'Failed to decode JSON from the external API'], 500);
    }

    // Filter tournaments from the API based on the provided wallet address
    $filtered_tournaments = array_filter($tournaments, function($tournament) use ($walletAddress) {
        return isset($tournament['coinsGatheredPerWallet'][$walletAddress]);
    });

    // Get tournaments from database
    $stmt = $pdo->prepare('SELECT * FROM "tournaments" WHERE "walletaddress" = ?');
    $stmt->execute([$walletAddress]);
    $dbTournaments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Merge API filtered tournaments with DB tournaments
    foreach ($filtered_tournaments as &$api_tournament) {
        foreach ($dbTournaments as &$db_tournament) {
            if ($db_tournament['tournamentId'] == $api_tournament['tournamentId']) {
                // Add coins gathered from API to DB tournament
                $db_tournament['coinsGatheredPerWallet'][$walletAddress] = $api_tournament['coinsGatheredPerWallet'][$walletAddress];
                $db_tournament['walletAddresses'] = array_unique(array_merge($db_tournament['walletAddresses'] ?? [], [$walletAddress]));
                $api_tournament = $db_tournament; // Replace API tournament with enriched DB tournament
                break;
            }
        }
    }

    // Convert associative array to indexed array
    $filtered_tournaments = array_values($filtered_tournaments);

    // Sort the final array by CreationDate
    usort($filtered_tournaments, function($a, $b) {
        return strtotime($b['CreationDate']) - strtotime($a['CreationDate']);
    });

    sendJsonResponse($filtered_tournaments);

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

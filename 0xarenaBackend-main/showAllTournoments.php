<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // API URL
    $api_url = 'https://zeroxarenabackend.onrender.com/ShowAllTournoSimple.php';

    // Fetch data from the API
    $response = file_get_contents($api_url);

    if ($response === false) {
        sendJsonResponse(['error' => 'Failed to fetch data from the API'], 500);
    }

    // Decode JSON response
    $data = json_decode($response, true);

    if ($data === null) {
        sendJsonResponse(['error' => 'Failed to decode JSON data'], 500);
    }

    // Fetch tournament data from the database
    $sql = 'SELECT "tournamentId", "TournamentName", "StartDate", "EndDate", "MinimumCoin", "MinimumRefer", "maximumRefer", 
            "StorageCapacity", "TournamentPrize", "CreationDate", "isDisabled", "CoinsGathered", "TagForSeo"
            FROM "tournaments"';

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $tournament_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Create an associative array for quick lookup
    $tournament_lookup = [];
    foreach ($tournament_data as $row) {
        if (isset($row['tournamentId'])) {
            $tournament_lookup[$row['tournamentId']] = $row;
        }
    }

    // Enrich each tournament object with data from the tournaments table
    foreach ($data as &$tournament) {
        if (isset($tournament['tournamentId']) && isset($tournament_lookup[$tournament['tournamentId']])) {
            $tournament = array_merge($tournament, $tournament_lookup[$tournament['tournamentId']]);
        }
    }

    // Sort the data array by CreationDate in descending order
    usort($data, function($a, $b) {
        $dateA = isset($a['CreationDate']) ? strtotime($a['CreationDate']) : 0;
        $dateB = isset($b['CreationDate']) ? strtotime($b['CreationDate']) : 0;
        return $dateB - $dateA;
    });

    sendJsonResponse($data);

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

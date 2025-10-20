<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // API URL
    $api_url = 'ShowAllTournoSimple.php';

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
    $tournament_data = [];

    $sql = 'SELECT "tournamentId", "TournamentName", "StartDate", "EndDate", "MinimumCoin", "MinimumRefer", "maximumRefer", 
            "StorageCapacity", "TournamentPrize", "CreationDate", "isDisabled", "CoinsGathered", "TagForSeo"
            FROM "tournaments"';

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($result) {
        // Store tournament data in an associative array
        foreach ($result as $row) {
            $tournament_data[$row['tournamentId']] = $row;
        }
    }

    // Enrich each tournament object with data from the tournaments table
    foreach ($data as &$tournament) {
        $tournamentId = $tournament['tournamentId'];
        if (isset($tournament_data[$tournamentId])) {
            $tournament['TournamentName'] = $tournament_data[$tournamentId]['TournamentName'];
            $tournament['StartDate'] = $tournament_data[$tournamentId]['StartDate'];
            $tournament['EndDate'] = $tournament_data[$tournamentId]['EndDate'];
            $tournament['TagForSeo'] = $tournament_data[$tournamentId]['TagForSeo'];
            $tournament['MinimumCoin'] = $tournament_data[$tournamentId]['MinimumCoin'];
            $tournament['MinimumRefer'] = $tournament_data[$tournamentId]['MinimumRefer'];
            $tournament['maximumRefer'] = $tournament_data[$tournamentId]['maximumRefer'];
            $tournament['StorageCapacity'] = $tournament_data[$tournamentId]['StorageCapacity'];
            $tournament['CoinsGathered'] = $tournament_data[$tournamentId]['CoinsGathered'];
            $tournament['TournamentPrize'] = $tournament_data[$tournamentId]['TournamentPrize'];
            $tournament['isDisabled'] = $tournament_data[$tournamentId]['isDisabled'];
            $tournament['CreationDate'] = $tournament_data[$tournamentId]['CreationDate'];
        }
    }

    sendJsonResponse($data);

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

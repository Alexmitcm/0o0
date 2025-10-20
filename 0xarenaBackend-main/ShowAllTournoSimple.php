<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
try {
    $pdo = getDbConnection();

    // SQL query to combine tournament objects with the same tournamentId
    $sql = 'SELECT "tournamentId", "walletAddress", SUM("coinsGathered") AS "totalCoinsGathered"
            FROM "userTransactions"
            GROUP BY "tournamentId", "walletAddress"';

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $data = [];
    $selectedTournamentIds = [];

    foreach ($result as $row) {
        $tournamentId = $row['tournamentId'];
        $walletAddress = $row['walletAddress'];
        $totalCoinsGathered = (int)$row['totalCoinsGathered'];
        
        $selectedTournamentIds[] = $tournamentId;
        
        if (array_key_exists($tournamentId, $data)) {
            $data[$tournamentId]['walletAddresses'][] = $walletAddress;
            $data[$tournamentId]['coinsGatheredPerWallet'][$walletAddress] = $totalCoinsGathered;
        } else {
            $data[$tournamentId] = [
                'tournamentId' => $tournamentId,
                'walletAddresses' => [$walletAddress],
                'coinsGatheredPerWallet' => [
                    $walletAddress => $totalCoinsGathered
                ]
            ];
        }
    }

    // Fetch tournaments not selected from the first query
    if (!empty($selectedTournamentIds)) {
        $placeholders = str_repeat('?,', count($selectedTournamentIds) - 1) . '?';
        $sql = 'SELECT * FROM "tournaments" WHERE "tournamentId" NOT IN (' . $placeholders . ')';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($selectedTournamentIds);
    } else {
        $sql = 'SELECT * FROM "tournaments"';
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
    }

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($result as $row) {
        $tournamentId = $row['tournamentId'];
        if (!array_key_exists($tournamentId, $data)) {
            $data[$tournamentId] = [
                'tournamentId' => $tournamentId,
                'walletAddresses' => [],
                'coinsGatheredPerWallet' => []
            ];
        }
    }

    sendJsonResponse(array_values($data));

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

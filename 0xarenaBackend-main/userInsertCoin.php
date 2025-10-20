<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get data from POST
    $walletAddress = $_POST['walletAddress'] ?? $_POST['walletaddress'] ?? null;
    $amountOfCoin = $_POST['amountOfCoin'] ?? $_POST['amountofcoin'] ?? null;
    $tournamentId = $_POST['tournamentId'] ?? $_POST['tournamentid'] ?? null;

    // Check if required data is provided
    if (empty($walletAddress) || empty($amountOfCoin) || empty($tournamentId)) {
        // For debugging, show what parameters were received
        $receivedParams = [
            'received_params' => array_keys($_POST),
            'walletAddress' => $walletAddress,
            'amountOfCoin' => $amountOfCoin,
            'tournamentId' => $tournamentId
        ];
        sendJsonResponse([
            'error' => 'Wallet address, amount of coin, and tournament ID must be provided',
            'debug' => $receivedParams
        ], 400);
    }

    // Check total withdraw so far for this walletAddress
    $withdrawSumQuery = 'SELECT COALESCE(SUM("amount"), 0) AS "totalWithdraw" FROM "withdraw_transactions" WHERE "walletaddress" = ?';
    $stmt = $pdo->prepare($withdrawSumQuery);
    $stmt->execute([$walletAddress]);
    $totalWithdraw = $stmt->fetch(PDO::FETCH_ASSOC)['totalWithdraw'];

    // if ($totalWithdraw > 300000000) {
    //     sendJsonResponse(['error' => 'Withdrawal limit reached or exceeded. Transaction blocked.'], 403);
    // }

    // Check if the user has sufficient coins
    if (!hasSufficientCoins($pdo, $walletAddress, $amountOfCoin)) {
        sendJsonResponse(['error' => 'Insufficient coins for the transaction'], 405);
    }

    // Start a transaction
    $pdo->beginTransaction();

    try {
        // Update CoinsGathered for the specified tournament
        $updateQuery = 'UPDATE "tournaments" SET "CoinsGathered" = "CoinsGathered" + ? WHERE "tournamentId" = ?';
        $stmt = $pdo->prepare($updateQuery);
        $stmt->execute([$amountOfCoin, $tournamentId]);

        // Get tournament data
        $tournamentData = getTournamentData($pdo, $tournamentId);

        if ($tournamentData) {
            // Insert into userTransactions table
            $insertQuery = 'INSERT INTO "userTransactions" ("walletAddress", "tournamentId", "TournamentName", "startDate", "endDate", "coinsGathered") 
                          VALUES (?, ?, ?, ?, ?, ?)';
            $stmt = $pdo->prepare($insertQuery);
            $stmt->execute([
                $walletAddress,
                $tournamentId,
                $tournamentData['TournamentName'],
                $tournamentData['StartDate'],
                $tournamentData['EndDate'],
                $amountOfCoin
            ]);

            // Deduct coins from the user - with proper type casting
            $deductQuery = 'UPDATE "users" SET "coins" = CAST("coins" AS INTEGER) - ? WHERE "walletaddress" = ?';
            $stmt = $pdo->prepare($deductQuery);
            $stmt->execute([$amountOfCoin, $walletAddress]);

            // Insert into TournamentOfUsers table
            $insertTournamentOfUsersQuery = 'INSERT INTO "TournamentOfUsers" (tournomentid, "walletAddress") VALUES (?, ?)';
            $stmt = $pdo->prepare($insertTournamentOfUsersQuery);
            $stmt->execute([$tournamentId, $walletAddress]);

            // Commit the transaction
            $pdo->commit();

            sendJsonResponse([
                "message" => "Transaction completed successfully",
                "tournamentId" => $tournamentId,
                "walletaddress" => $walletAddress,
                "coinsDeducted" => $amountOfCoin,
                "coinsGathered" => $tournamentData['CoinsGathered']
            ]);
        } else {
            sendJsonResponse(['error' => "Tournament with ID $tournamentId not found"], 404);
        }
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}

// Function to check if the user has sufficient coins
function hasSufficientCoins($pdo, $walletAddress, $amountOfCoin) {
    $query = 'SELECT CAST("coins" AS INTEGER) as "coins" FROM "users" WHERE "walletaddress" = ?';
    $stmt = $pdo->prepare($query);
    $stmt->execute([$walletAddress]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result && $result['coins'] >= $amountOfCoin;
}

// Function to retrieve tournament data
function getTournamentData($pdo, $tournamentId) {
    $query = 'SELECT * FROM "tournaments" WHERE "tournamentId" = ?';
    $stmt = $pdo->prepare($query);
    $stmt->execute([$tournamentId]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
?>

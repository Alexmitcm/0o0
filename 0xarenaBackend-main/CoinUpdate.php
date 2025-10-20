<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();
 
// Validate and sanitize the input
$walletAddress = htmlspecialchars($_POST["wallet_address"] ?? '');
$amount = floatval($_POST["amount"] ?? 0);

if (empty($walletAddress)) {
    sendJsonResponse(["error" => "Wallet address is required"], 400);
}

if ($amount <= 0) {
    sendJsonResponse(["error" => "Amount must be greater than 0"], 400);
}

try {
    $pdo = getDbConnection();

    // Check if user is banned
    $checkUserBanSql = 'SELECT "banned"::integer FROM "users" WHERE "walletaddress" = ?';
    $userBanResult = $pdo->prepare($checkUserBanSql);
    $userBanResult->execute([$walletAddress]);

    if ($userBanResult->rowCount() > 0) {
        $userBanRow = $userBanResult->fetch(PDO::FETCH_ASSOC);
        if ($userBanRow["banned"] == 1) {
            sendJsonResponse(["message" => "You are banned"], 403);
        }
    }

    // Fetch user's data
    $totalPointsSql = '
        SELECT 
            COALESCE("todaysPoints"::integer, 0) as total_points,
            COALESCE("coins"::varchar, \'0\') as coins,
            COALESCE(NULLIF("LastCoinUpdated", \'\')::timestamp, \'1970-01-01 00:00:00\'::timestamp) as lastcoinupdated,
            COALESCE("is_captcha_banned"::integer, 0) as is_captcha_banned
        FROM "users" 
        WHERE "walletaddress" = ?';
    $totalPointsResult = $pdo->prepare($totalPointsSql);
    $totalPointsResult->execute([$walletAddress]);

    if ($totalPointsResult->rowCount() > 0) {
        $totalPointsRow = $totalPointsResult->fetch(PDO::FETCH_ASSOC);
    } else {
        sendJsonResponse(["error" => "User not found"], 404);
    }

    $totalPointsToday = intval($totalPointsRow['total_points']);
    $coins = $totalPointsRow['coins'];
    $lastCoinUpdated = $totalPointsRow['lastcoinupdated'];
    $isCaptchaBanned = intval($totalPointsRow['is_captcha_banned']);

    // Check if the user is captcha banned
    if ($isCaptchaBanned == 1) {
        sendJsonResponse(["message" => "You are banned from updating coins due to captcha restrictions"], 403);
    }

    // Check if the wallet address exists in the ManualCaptcha table
    $checkManualCaptchaSql = 'SELECT 1 FROM "ManualCaptcha" WHERE "Walletaddress" = ? LIMIT 1';
    $manualCaptchaResult = $pdo->prepare($checkManualCaptchaSql);
    $manualCaptchaResult->execute([$walletAddress]);

    if ($manualCaptchaResult->rowCount() > 0) {
        sendJsonResponse(["message" => "Wallet address is not authorized to update coins"], 403);
    }

    // Calculate the maximum allowable coins based on the time elapsed
    $currentTimestamp = time();
    $lastUpdatedTimestamp = strtotime($lastCoinUpdated);
    $secondsPassed = $currentTimestamp - $lastUpdatedTimestamp;
    $minutesPassed = floor($secondsPassed / 60);

    // Fetch total_eq using cURL
    $curl = curl_init();
    $url = "https://zeroxarenabackend.onrender.com/eq/CountEq.php?walletaddress=" . urlencode($walletAddress);
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    $response = curl_exec($curl);

    if ($response === false) {
        sendJsonResponse(["error" => "cURL Error: " . curl_error($curl)], 500);
    }

    curl_close($curl);

    $responseData = json_decode($response, true);
    $totalEq = intval($responseData['Total_eq'] ?? 0);

    // Check in eq_levels_stamina table
    $sqlStamina = '
        SELECT COALESCE("LevelValue"::integer, 0) as levelvalue 
        FROM "eq_levels_stamina" 
        WHERE ?::integer BETWEEN "min_eq" AND "max_eq" 
        LIMIT 1';
    $stmtStamina = $pdo->prepare($sqlStamina);
    $stmtStamina->execute([$totalEq]);

    $staminaLevel = 0;
    if ($stmtStamina->rowCount() > 0) {
        $row = $stmtStamina->fetch(PDO::FETCH_ASSOC);
        $staminaLevel = intval($row['levelvalue']);
    }

    // Add staminaLevel to the user data if found
    $levelValue = $staminaLevel;

    // Check creation dates
    $fromDate = '2023-01-01';
    $toDate = date('Y-m-d', strtotime('-90 days'));
    $minPercentage = 50;
    $maxPercentage = 170;

    $creationDatesSql = '
        SELECT "CreationDate"::timestamp 
        FROM "users" 
        WHERE "CreationDate" BETWEEN ?::timestamp AND ?::timestamp 
        ORDER BY "CreationDate" ASC';
    $creationDatesResult = $pdo->prepare($creationDatesSql);
    $creationDatesResult->execute([$fromDate, $toDate]);

    if ($creationDatesResult->rowCount() > 0) {
        $creationDates = [];
        while ($row = $creationDatesResult->fetch(PDO::FETCH_ASSOC)) {
            $creationDates[] = $row['CreationDate'];
        }

        $earliestDate = strtotime($creationDates[0]);
        $latestDate = strtotime(end($creationDates));
        $dateDifference = $latestDate - $earliestDate;

        if ($dateDifference > 0) {
            $percentage = $minPercentage + (($maxPercentage - $minPercentage) * 
                        (($latestDate - time()) / $dateDifference));
            $percentage = max($minPercentage, min($maxPercentage, $percentage));

            $adjustedLevelValue = $levelValue * ($percentage / 100);
            $levelValue = max($levelValue * ($minPercentage / 100), min($levelValue * ($maxPercentage / 100), $adjustedLevelValue));
        }
    }

    // Temporary Logic: If total_eq is 0 and CreationDate is within the range, set levelValue to 500
    if ($totalEq == 0) {
        $creationDateSql = '
            SELECT 1 
            FROM "users" 
            WHERE "walletaddress" = ? 
            AND "CreationDate" BETWEEN ?::timestamp AND ?::timestamp 
            LIMIT 1';
        $creationDateResult = $pdo->prepare($creationDateSql);
        $creationDateResult->execute([$walletAddress, $fromDate, $toDate]);

        if ($creationDateResult->rowCount() > 0) {
            $levelValue = 500;
        }
    }

    // Ensure levelValue is not negative
    $levelValue = max(0, intval($levelValue));

    // Fetch the "real" levelValue from check_level_value.php
    $checkLevelUrl = "https://zeroxarenabackend.onrender.com/userlog/check_level_value.php?walletaddress=" . urlencode($walletAddress);
    $apiResponse = file_get_contents($checkLevelUrl);
    if ($apiResponse !== false) {
        $apiData = json_decode($apiResponse, true);
        if (isset($apiData['levelValue'])) {
            $levelValue = intval($apiData['levelValue']);
        }
    }

    // Begin transaction
    $pdo->beginTransaction();

    try {
        if ($totalPointsToday + $amount <= $levelValue) {
            $updateSql = '
                UPDATE "users" 
                SET "coins" = (COALESCE(NULLIF("coins", \'\')::numeric, 0) + ?::numeric)::varchar,
                    "todaysPoints" = COALESCE("todaysPoints"::integer, 0) + ?::integer,
                    "LastCoinUpdated" = NOW()
                WHERE "walletaddress" = ?
                RETURNING 
                    COALESCE("todaysPoints"::integer, 0) as todayspoints,
                    COALESCE("coins"::varchar, \'0\') as coins';
            
            $stmtUpdate = $pdo->prepare($updateSql);
            $stmtUpdate->execute([$amount, $amount, $walletAddress]);
            
            if ($stmtUpdate->rowCount() > 0) {
                $updatedRow = $stmtUpdate->fetch(PDO::FETCH_ASSOC);
                $updatedTodaysPoints = intval($updatedRow['todayspoints']);
                $updatedCoins = $updatedRow['coins'];

                $pdo->commit();

                sendJsonResponse([
                    "message" => "Record updated successfully",
                    "todaysPoints" => $levelValue - $updatedTodaysPoints,
                    "coins" => $updatedCoins,
                    "levelValue" => $levelValue
                ]);
            } else {
                throw new Exception("Error updating record");
            }
        } else {
            // If the user would exceed the final levelValue, return without updating
            $updatedTotalPointsSql = '
                SELECT 
                    COALESCE("todaysPoints"::integer, 0) as todayspoints,
                    COALESCE("coins"::varchar, \'0\') as coins 
                FROM "users" 
                WHERE "walletaddress" = ?';
            $updatedTotalPointsResult = $pdo->prepare($updatedTotalPointsSql);
            $updatedTotalPointsResult->execute([$walletAddress]);

            if ($updatedTotalPointsResult->rowCount() > 0) {
                $updatedTotalPointsRow = $updatedTotalPointsResult->fetch(PDO::FETCH_ASSOC);
                $updatedTodaysPoints = intval($updatedTotalPointsRow['todayspoints']);
                $updatedCoins = $updatedTotalPointsRow['coins'];

                $pdo->commit();

                sendJsonResponse([
                    "message" => "err",
                    "todaysPoints" => $levelValue - $updatedTodaysPoints,
                    "coins" => $updatedCoins,
                    "levelValue" => $levelValue
                ]);
            } else {
                throw new Exception("Error fetching user data");
            }
        }
    } catch (Exception $e) {
        $pdo->rollBack();
        sendJsonResponse(["error" => $e->getMessage()], 500);
    }

} catch (PDOException $e) {
    sendJsonResponse(["error" => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(["error" => $e->getMessage()], 500);
}
?>

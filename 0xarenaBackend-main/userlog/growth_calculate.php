<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

// Check for wallet address in GET parameter
if (!isset($_GET['walletaddress'])) {
    sendJsonResponse(["error" => "walletaddress parameter is required"], 400);
}

$walletAddress = htmlspecialchars($_GET['walletaddress']);

// 1. Function to calculate growth percentage
function calculateGrowth($initial, $final) {
    if ($initial == 0) {
        // If initial is zero, any positive final is treated as 100% growth
        return $final > 0 ? 100 : 0;
    }
    return (($final - $initial) / $initial) * 100;
}

// 2. Compute growth for a slice of records
function computeGrowthForRange($rowsSlice) {
    // Need at least 2 records to compute growth
    if (count($rowsSlice) < 2) {
        return ["status" => "Not enough records"];
    }

    // Because the array is sorted DESC by created_at:
    // index 0 is the newest, last element is the oldest
    $initial = end($rowsSlice);   // oldest
    $final   = reset($rowsSlice); // newest

    // Calculate percentage growth
    $coinsGrowth        = calculateGrowth($initial['coins'],        $final['coins']);
    $leftNodeGrowth     = calculateGrowth($initial['left_node'],    $final['left_node']);
    $rightNodeGrowth    = calculateGrowth($initial['right_node'],   $final['right_node']);
    $totalEqGrowth      = calculateGrowth($initial['total_eq'],     $final['total_eq']);
    $todaysPointsGrowth = calculateGrowth($initial['todaysPoints'], $final['todaysPoints']);

    // Calculate absolute increase
    $coinsIncrease        = $final['coins']        - $initial['coins'];
    $leftNodeIncrease     = $final['left_node']    - $initial['left_node'];
    $rightNodeIncrease    = $final['right_node']   - $initial['right_node'];
    $totalEqIncrease      = $final['total_eq']     - $initial['total_eq'];
    $todaysPointsIncrease = $final['todaysPoints'] - $initial['todaysPoints'];

    // Combine into one array
    $growthData = [
        // Percentage growth
        "coins_growth"         => $coinsGrowth,
        "left_node_growth"     => $leftNodeGrowth,
        "right_node_growth"    => $rightNodeGrowth,
        "total_eq_growth"      => $totalEqGrowth,
        "todaysPoints_growth"  => $todaysPointsGrowth,

        // Absolute increase
        "coins_increased"         => $coinsIncrease,
        "left_node_increased"     => $leftNodeIncrease,
        "right_node_increased"    => $rightNodeIncrease,
        "total_eq_increased"      => $totalEqIncrease,
        "todaysPoints_increased"  => $todaysPointsIncrease,
    ];

    // If sum of the percentage growth fields is zero
    $sumOfPercentages = $coinsGrowth + $leftNodeGrowth + $rightNodeGrowth + $totalEqGrowth + $todaysPointsGrowth;

    if ($sumOfPercentages === 0) {
        return ["status" => "Zero growth", "growth" => $growthData];
    }

    // Otherwise, we consider it "Calculated"
    return ["status" => "Calculated", "growth" => $growthData];
}

try {
    $pdo = getDbConnection();

    // 3. Fetch up to 80 records for the wallet address
    $sql = 'SELECT "coins", "left_node", "right_node", "total_eq", "todaysPoints", "created_at"
            FROM "users_archive"
            WHERE "walletaddress" = ?
            ORDER BY "created_at" DESC
            LIMIT 80';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$walletAddress]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $countRows = count($rows);

    if ($countRows > 0) {
        // Compute growth for the various slices
        $growth2  = ($countRows >= 2)   ? computeGrowthForRange(array_slice($rows, 0, 2))   : ["status" => "Not enough records"];
        $growth7  = ($countRows >= 7)   ? computeGrowthForRange(array_slice($rows, 0, 7))   : ["status" => "Not enough records"];
        $growth30 = ($countRows >= 30)  ? computeGrowthForRange(array_slice($rows, 0, 30))  : ["status" => "Not enough records"];
        $growth40 = ($countRows >= 40)  ? computeGrowthForRange(array_slice($rows, 0, 40))  : ["status" => "Not enough records"];
        $growth60 = ($countRows >= 60)  ? computeGrowthForRange(array_slice($rows, 0, 60))  : ["status" => "Not enough records"];
        $growth80 = ($countRows >= 80)  ? computeGrowthForRange(array_slice($rows, 0, 80))  : ["status" => "Not enough records"];

        // Output JSON with all growth calculations
        sendJsonResponse([
            "walletaddress"     => $walletAddress,
            "growth_2_rows"     => $growth2,
            "growth_7_rows"     => $growth7,
            "growth_30_rows"    => $growth30,
            "growth_40_rows"    => $growth40,
            "growth_60_rows"    => $growth60,
            "growth_80_rows"    => $growth80
        ]);
    } else {
        // No records found
        sendJsonResponse([
            "error"         => "No records available for this wallet address",
            "walletaddress" => $walletAddress
        ], 404);
    }

} catch (PDOException $e) {
    sendJsonResponse(["error" => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(["error" => $e->getMessage()], 500);
}
?>

<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get query parameters
    $walletAddress = $_GET['walletaddress'] ?? null;
    $token = $_GET['token'] ?? null;

    if (!$walletAddress || !$token) {
        sendJsonResponse(['error' => 'Wallet address and token are required'], 400);
    }

    // Verify user credentials
    $stmt = $pdo->prepare('SELECT * FROM "users" WHERE "walletaddress" = ? AND "token" = ?');
    $stmt->execute([$walletAddress, $token]);

    if ($stmt->rowCount() === 0) {
        sendJsonResponse(['error' => 'Invalid credentials'], 403);
    }

    // Get user's referral tree
    $stmt = $pdo->prepare('
        WITH RECURSIVE referral_tree AS (
            -- Base case: start with the root user
            SELECT 
                u."walletaddress" as id,
                u."username",
                u."email",
                u."coins",
                u."Tether",
                u."CreationDate",
                u."isemailverified",
                u."referer" as referrer,
                u."cheat_count" as "Cheat Count",
                u."banned" as "Is banned",
                u."left_node",
                u."right_node",
                u."Total_eq",
                u."referer" as parentId
            FROM "users" u
            WHERE u."walletaddress" = ?
            
            UNION ALL
            
            -- Recursive case: get all referrals
            SELECT 
                u."walletaddress" as id,
                u."username",
                u."email",
                u."coins",
                u."Tether",
                u."CreationDate",
                u."isemailverified",
                u."referer" as referrer,
                u."cheat_count" as "Cheat Count",
                u."banned" as "Is banned",
                u."left_node",
                u."right_node",
                u."Total_eq",
                u."referer" as parentId
            FROM "users" u
            JOIN referral_tree rt ON u."referer" = rt.id
        )
        SELECT * FROM referral_tree
    ');
    $stmt->execute([$walletAddress]);
    $nodes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJsonResponse(['nodes' => $nodes]);
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

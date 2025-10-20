<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Get all users with their referral information
    $stmt = $pdo->prepare('
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
        ORDER BY u."CreationDate" DESC
    ');
    $stmt->execute();
    $nodes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJsonResponse(['nodes' => $nodes]);
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

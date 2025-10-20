<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Define SQL query to count premium users
    $sql = 'SELECT COUNT(*) AS premium_count FROM "users" WHERE "RolePremission" = \'Premium\'';
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // Extract the premium user count
    $premiumCount = $result["premium_count"];

    // Return the count as a JSON response
    sendJsonResponse($premiumCount);

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

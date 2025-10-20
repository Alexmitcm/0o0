<?php


// $allowed_domains = [
//     "https://zeroxarenafront.onrender.com",
//     "https://games-bmvb.onrender.com",
//     "https://admin-3zy5.onrender.com"
//      // New domain added here
// ];

// // Check if the request origin is in the list of allowed domains
// $origin = $_SERVER['HTTP_ORIGIN'];
// if (in_array($origin, $allowed_domains)) {
//     header("Access-Control-Allow-Origin: *");
// } else {
//     // Return a 403 Forbidden error for requests from disallowed origins
//     http_response_code(403);
//     exit();
// } // Allowing requests only from the specified domain

require_once 'config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Check if walletaddress and referer are provided in POST request
    if(isset($_POST['walletaddress']) && isset($_POST['referer'])) {
        $walletaddress = $_POST['walletaddress'];
        $referer = $_POST['referer'];

        // Check if user with the given walletaddress exists
        $checkUserStmt = $pdo->prepare('SELECT * FROM "users" WHERE "walletaddress" = ?');
        $checkUserStmt->execute([$walletaddress]);

        if ($checkUserStmt->rowCount() > 0) {
            // User with the provided walletaddress exists, proceed to update Referer and RolePremission
            $updateStmt = $pdo->prepare('UPDATE "users" SET "referer" = ?, "RolePremission" = \'Premium\' WHERE "walletaddress" = ?');
            
            if ($updateStmt->execute([$referer, $walletaddress])) {
                sendJsonResponse([
                    'status' => 'success',
                    'message' => 'Referer and RolePremission updated successfully'
                ]);
            } else {
                throw new Exception("Error updating Referer and RolePremission");
            }
        } else {
            sendJsonResponse([
                'status' => 'error',
                'message' => 'User with the provided walletaddress does not exist'
            ], 404);
        }
    } else {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'walletaddress or Referer not provided in POST request'
        ], 400);
    }
} catch (Exception $e) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Error: ' . $e->getMessage()
    ], 500);
}
?>

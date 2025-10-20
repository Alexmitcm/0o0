<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    // Handle POST request to insert new records
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $data = getJsonInput();
        $walletaddresses = $data['walletaddress']; // this should be an array
        $quantity = $data['quantity'];
        $minutes_interval = $data['minutes_interval'];
        $creation_date = date('Y-m-d H:i:s');

        if (is_array($walletaddresses)) {
            $stmt = $pdo->prepare("INSERT INTO manualcaptcha (walletaddress, quantity, minutes_interval, creation_date) VALUES (?, ?, ?, ?)");
            
            foreach ($walletaddresses as $walletaddress) {
                $stmt->execute([$walletaddress, $quantity, $minutes_interval, $creation_date]);
            }

            sendJsonResponse(["message" => "Records inserted successfully!"], 201);
        } else {
            sendJsonResponse(["error" => "'walletaddress' should be an array."], 400);
        }
    }

    // Handle GET request to retrieve data
    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        if (isset($_GET['walletaddress'])) {
            $walletaddress = $_GET['walletaddress'];
            $stmt = $pdo->prepare("SELECT * FROM manualcaptcha WHERE walletaddress = ?");
            $stmt->execute([$walletaddress]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if ($data) {
                sendJsonResponse($data);
            } else {
                sendJsonResponse(["error" => "No records found for the given walletaddress."], 404);
            }
        } else {
            $stmt = $pdo->query("SELECT * FROM manualcaptcha");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            sendJsonResponse($data);
        }
    }

    // Handle DELETE request to delete a specific record by walletaddress
    if ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
        $data = getJsonInput();
        $walletaddress = $data['walletaddress'] ?? null;

        if ($walletaddress) {
            $stmt = $pdo->prepare("DELETE FROM manualcaptcha WHERE walletaddress = ?");
            $stmt->execute([$walletaddress]);

            if ($stmt->rowCount() > 0) {
                sendJsonResponse(["message" => "Record deleted successfully."]);
            } else {
                sendJsonResponse(["error" => "Record not found."], 404);
            }
        } else {
            sendJsonResponse(["error" => "No walletaddress specified."], 400);
        }
    }

} catch (PDOException $e) {
    sendJsonResponse(["error" => "Database error: " . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(["error" => "Error: " . $e->getMessage()], 500);
}

?>

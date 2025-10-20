<?php
require_once '../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch all columns from the users table
        $sql = 'SELECT * FROM "users"';
        $stmt = $pdo->query($sql);
        $users = $stmt->fetchAll();

        // If there are no users, return an empty CSV file
        if (empty($users)) {
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment;filename="users_data.csv"');
            echo "No data available";
            exit();
        }

        // Prepare CSV header based on the column names
        $columns = array_keys($users[0]);
        $csvContent = implode(",", $columns) . "\n"; // CSV header

        // Loop through the results and append to CSV
        foreach ($users as $user) {
            $row = array_map(function($value) {
                return htmlspecialchars($value); // Ensure values are properly encoded
            }, array_values($user));
            $csvContent .= implode(",", $row) . "\n";
        }

        // Set headers to download the CSV file
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment;filename="users_data.csv"');

        // Output the CSV content
        echo $csvContent;
    } else {
        sendJsonResponse(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

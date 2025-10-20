<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getJsonInput();

    if ($data && is_array($data)) {
        // Create a temporary file
        $filename = 'data_' . uniqid() . '.csv';
        $filepath = __DIR__ . '/' . $filename;

        // Open the file for writing
        $file = fopen($filepath, 'w');

        // Fetch the headers
        $headers = array_keys($data[0]);
        fputcsv($file, $headers);

        // Fetch the data
        foreach ($data as $row) {
            fputcsv($file, $row);
        }

        // Close the file
        fclose($file);

        // Return the file path as a response
        sendJsonResponse(['file' => $filename]);
    } else {
        sendJsonResponse(['error' => 'Invalid data provided'], 400);
    }
} else {
    sendJsonResponse(['error' => 'Invalid request method'], 405);
}
?>

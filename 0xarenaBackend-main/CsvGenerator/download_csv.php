<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

if (isset($_GET['file'])) {
    $filename = basename($_GET['file']);
    $filepath = __DIR__ . '/' . $filename;

    if (file_exists($filepath)) {
        // Set headers to force download
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        readfile($filepath);

        // Delete the file after download
        unlink($filepath);
        exit();
    } else {
        sendJsonResponse(["error" => "File not found"], 404);
    }
} else {
    sendJsonResponse(["error" => "No file specified"], 400);
}
?>

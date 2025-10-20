<?php
require_once "config.php";
setCorsHeaders();

try {
    $pdo = getDbConnection();

    // Only fetch slides that are not expired
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("SELECT id, title, start_time, end_time, image_data, image_type FROM hero_slides ORDER BY start_time ASC");
    $stmt->execute();
    $slides = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['active'] = ($row['end_time'] > $now) ? 1 : 0;
        $imageData = $row['image_data'];
        if (is_resource($imageData)) {
            $imageData = stream_get_contents($imageData);
        }
        $row['image_base64'] = 'data:' . $row['image_type'] . ';base64,' . base64_encode($imageData);
        unset($row['image_data'], $row['image_type']);
        $slides[] = $row;
    }

    sendJsonResponse(['slides' => $slides]);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>
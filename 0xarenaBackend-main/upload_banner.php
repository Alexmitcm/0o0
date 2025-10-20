<?php
require_once "config.php";
setCorsHeaders();

$pdo = getDbConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = $_POST['title'];
    $start_time = $_POST['start_time'];
    $end_time = $_POST['end_time'];
    $image_data = file_get_contents($_FILES['image']['tmp_name']);
    $image_type = $_FILES['image']['type'];

    $stmt = $pdo->prepare("INSERT INTO hero_slides (title, start_time, end_time, image_data, image_type) VALUES (?, ?, ?, ?, ?)");
    $stmt->bindParam(1, $title);
    $stmt->bindParam(2, $start_time);
    $stmt->bindParam(3, $end_time);
    $stmt->bindParam(4, $image_data, PDO::PARAM_LOB);
    $stmt->bindParam(5, $image_type);
    $stmt->execute();
    sendJsonResponse(['success' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Support both ?id=... and JSON body
    $id = null;
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['id'])) {
            $id = (int)$input['id'];
        }
    }
    if (!$id) {
        sendJsonResponse(['error' => 'Missing or invalid id'], 400);
    }
    $stmt = $pdo->prepare("DELETE FROM hero_slides WHERE id = ?");
    $stmt->bindParam(1, $id, PDO::PARAM_INT);
    $stmt->execute();
    if ($stmt->rowCount() > 0) {
        sendJsonResponse(['success' => true, 'deleted_id' => $id]);
    } else {
        sendJsonResponse(['error' => 'Slide not found or already deleted'], 404);
    }
}
?>
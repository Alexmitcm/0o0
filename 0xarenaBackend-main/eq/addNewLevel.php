<?php
require_once '../config.php';

setCorsHeaders();
setErrorHandling();

try {
    $pdo = getDbConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = getJsonInput();
        
        $min_eq = isset($data['min_eq']) ? intval($data['min_eq']) : null;
        $max_eq = isset($data['max_eq']) ? intval($data['max_eq']) : null;
        $LevelValue = isset($data['LevelValue']) ? intval($data['LevelValue']) : null;

        if ($min_eq === null || $max_eq === null || $LevelValue === null) {
            sendJsonResponse(['error' => 'Missing required parameters'], 400);
        }

        $sql = 'INSERT INTO "eq_levels_stamina" ("min_eq", "max_eq", "LevelValue", "creation_date") VALUES (:min_eq, :max_eq, :LevelValue, NOW())';
        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ':min_eq' => $min_eq,
            ':max_eq' => $max_eq,
            ':LevelValue' => $LevelValue
        ]);

        sendJsonResponse(['success' => 'Record inserted successfully']);
    } else {
        sendJsonResponse(['error' => 'Method not allowed'], 405);
    }

} catch (PDOException $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

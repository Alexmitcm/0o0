<?php
require_once 'config.php';

setCorsHeaders();
setErrorHandling();

// Function to create data tree and count children
function buildTreeWithCount($data, $parent = null) {
    $tree = [];
    foreach ($data as $row) {
        if ($row['referer'] == $parent) {
            $children = buildTreeWithCount($data, $row['walletaddress']);
            if ($children) {
                $row['children'] = $children;
                $row['count'] = count($children);
            }
            $tree[] = $row;
        }
    }
    return $tree;
}

try {
    $pdo = getDbConnection();

    // Fetch all users with their referrers
    $stmt = $pdo->prepare('SELECT "walletaddress", "referer" FROM "users"');
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($users)) {
        // Build the data tree and count children for the first two nodes
        $tree = buildTreeWithCount($users);
        sendJsonResponse($tree);
    } else {
        sendJsonResponse(['message' => 'No records found']);
    }
} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
?>

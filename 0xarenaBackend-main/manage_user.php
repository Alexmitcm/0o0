<?php
require_once 'config.php';

try { $pdo = getDbConnection(); } catch (Exception $e) { die('Database connection failed: ' . $e->getMessage()); }

$createMessage = '';
$retrieveResult = null;

// Handle Create User form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['form']) && $_POST['form'] === 'create') {
    $fields = ['username', 'walletaddress', 'email', 'isemailverified', 'token', 'referer', 'coins', 'left_node', 'right_node', 'total_eq', 'todaysPoints'];
    $placeholders = array_fill(0, count($fields), '?');
    $values = [];
    foreach ($fields as $f) {
        $values[] = $_POST[$f] ?? null;
    }
    $columns = array_map(function($f) { return '"' . $f . '"'; }, $fields);
    $sql = 'INSERT INTO "users" (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        $createMessage = 'User created successfully.';
    } catch (PDOException $e) {
        $createMessage = 'Error creating user: ' . $e->getMessage();
    }
}

// Handle Retrieve User form submission
if (isset($_GET['form']) && $_GET['form'] === 'retrieve') {
    $wallet = $_GET['walletaddress'] ?? '';
    if ($wallet) {
        $stmt = $pdo->prepare('SELECT * FROM "users" WHERE "walletaddress" = ?');
        $stmt->execute([$wallet]);
        $retrieveResult = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$retrieveResult) {
            $retrieveResult = ['error' => 'User not found'];
        }
    }
}
?>
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Manage Users</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0; padding: 0;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            box-sizing: border-box;
        }
        .form-section {
            background: #fff;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            margin-top: 0;
            font-size: 1.5em;
            color: #333;
        }
        .form-group {
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
        }
        .form-group label {
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-group input {
            padding: 10px;
            font-size: 1em;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        button {
            padding: 10px 15px;
            font-size: 1em;
            background-color: #007BFF;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #0056b3;
        }
        .table-container {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table th, table td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        table th {
            background-color: #f2f2f2;
        }
        @media (min-width: 600px) {
            .form-group {
                flex-direction: row;
                align-items: center;
            }
            .form-group label {
                flex: 1 0 200px;
                margin-bottom: 0;
            }
            .form-group input {
                flex: 2;
            }
        }
    </style>
</head>
<body>
<div class="container">
    <div class="form-section">
        <h1>Create New User</h1>
        <?php if ($createMessage): ?>
            <p><?php echo htmlspecialchars($createMessage); ?></p>
        <?php endif; ?>
        <form method='post'>
            <input type='hidden' name='form' value='create'>
            <?php foreach ([ 'username', 'walletaddress', 'email', 'isemailverified', 'token', 'referer', 'coins', 'left_node', 'right_node', 'total_eq', 'todaysPoints' ] as $f): ?>
                <div class="form-group">
                    <label for='<?php echo $f; ?>'><?php echo ucfirst($f); ?>:</label>
                    <input type='text' id='<?php echo $f; ?>' name='<?php echo $f; ?>' required>
                </div>
            <?php endforeach; ?>
            <button type='submit'>Create User</button>
        </form>
    </div>
    <div class="form-section">
        <h1>Retrieve User</h1>
        <form method='get'>
            <input type='hidden' name='form' value='retrieve'>
            <div class="form-group">
                <label for='walletaddress'>Wallet Address:</label>
                <input type='text' id='walletaddress' name='walletaddress' value='<?php echo htmlspecialchars($_GET['walletaddress'] ?? ''); ?>' required>
            </div>
            <button type='submit'>Retrieve User</button>
        </form>
        <?php if ($retrieveResult): ?>
            <div class="table-container">
                <h2>User Details</h2>
                <table>
                    <?php foreach ($retrieveResult as $col => $val): ?>
                        <tr><th><?php echo htmlspecialchars($col); ?></th><td><?php echo htmlspecialchars($val); ?></td></tr>
                    <?php endforeach; ?>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>
</body>
</html> 
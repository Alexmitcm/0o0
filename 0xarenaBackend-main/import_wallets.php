<?php
require_once 'config.php';

// Initialize variables for tracking
$totalRecords = 0;
$addedRecords = 0;
$skippedRecords = 0;
$addedWallets = [];
$errors = [];

// Function to process CSV file
function processCSV($pdo, $csvFilePath) {
    global $totalRecords, $addedRecords, $skippedRecords, $addedWallets, $errors;
    
    if (!file_exists($csvFilePath)) {
        return ["error" => "CSV file not found: $csvFilePath"];
    }
    
    // Open the CSV file
    $file = fopen($csvFilePath, 'r');
    if (!$file) {
        return ["error" => "Unable to open CSV file"];
    }
    
    // Begin transaction for better performance and data integrity
    $pdo->beginTransaction();
    
    try {
        // Prepare the check query
        $checkStmt = $pdo->prepare('SELECT 1 FROM "users" WHERE "walletaddress" = ? LIMIT 1');
        
        // Prepare the insert query
        $insertStmt = $pdo->prepare('
            INSERT INTO "users" (
                "username",
                "walletaddress",
                "email",
                "isemailverified",
                "token",
                "referer",
                "RolePremission",
                "coins",
                "Tether",
                "cheat_count",
                "banned",
                "todaysPoints",
                "IsUsernameChanged",
                "CreationDate",
                "LastCoinUpdated",
                "left_node",
                "right_node",
                "Total_eq",
                "is_captcha_banned"
            ) VALUES (
                \'0xarena_user_\' || FLOOR(random() * 100000)::int,
                ?,
                \'user\' || FLOOR(random() * 100000)::int || \'@0xarena.com\',
                0,
                ?,
                ?,
                \'Premium\',
                0, 0, 0, 0, 0, 0, NOW(), NULL, NULL, NULL, 0, 0
            )
        ');
        
        // Process each line in the CSV
        while (($line = fgetcsv($file)) !== false) {
            $totalRecords++;
            
            if (count($line) < 2) {
                $errors[] = "Line $totalRecords: Invalid format, expected at least 2 columns";
                continue;
            }
            
            $walletAddress = trim($line[0]);
            $referer = trim($line[1]);
            
            // Check if wallet address already exists
            $checkStmt->execute([$walletAddress]);
            if ($checkStmt->fetchColumn()) {
                $skippedRecords++;
                continue; // Skip if already exists
            }
            
            // Generate a token based on wallet address
            $token = hash('sha256', $walletAddress . time() . rand(1000, 9999));
            
            // Insert the new user
            $insertStmt->execute([$walletAddress, $token, $referer]);
            $addedRecords++;
            $addedWallets[] = $walletAddress;
        }
        
        // Commit transaction
        $pdo->commit();
        
        // Close the file
        fclose($file);
        
        return [
            "success" => true,
            "totalRecords" => $totalRecords,
            "addedRecords" => $addedRecords,
            "skippedRecords" => $skippedRecords,
            "addedWallets" => $addedWallets,
            "errors" => $errors
        ];
    } catch (Exception $e) {
        // Rollback in case of error
        $pdo->rollBack();
        return ["error" => "Database error: " . $e->getMessage()];
    }
}

// Process form submission
$result = null;
$csvFilePath = 'Registered_Wallets.csv'; // Default path

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // If file was uploaded
    if (isset($_FILES['csvFile']) && $_FILES['csvFile']['error'] === UPLOAD_ERR_OK) {
        $uploadedFile = $_FILES['csvFile']['tmp_name'];
        $csvFilePath = $uploadedFile;
    }
    
    try {
        $pdo = getDbConnection();
        $result = processCSV($pdo, $csvFilePath);
    } catch (Exception $e) {
        $result = ["error" => "Error: " . $e->getMessage()];
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Import Wallet Addresses</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="file"] {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 100%;
        }
        button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 15px;
            font-size: 16px;
            cursor: pointer;
            border-radius: 4px;
        }
        button:hover {
            background-color: #45a049;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .success {
            color: #4CAF50;
        }
        .error {
            color: #f44336;
        }
        .details {
            margin-top: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        table, th, td {
            border: 1px solid #ddd;
        }
        th, td {
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .wallets-list {
            max-height: 300px;
            overflow-y: auto;
            margin-top: 15px;
            border: 1px solid #ddd;
            padding: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Import Wallet Addresses</h1>
        
        <!-- Upload Form -->
        <form action="" method="post" enctype="multipart/form-data">
            <div class="form-group">
                <label for="csvFile">Upload CSV File (or use default Registered_Wallets.csv):</label>
                <input type="file" name="csvFile" id="csvFile">
                <small>Format: Column A = walletAddress, Column B = referer</small>
            </div>
            <button type="submit">Process CSV</button>
        </form>
        
        <!-- Results -->
        <?php if ($result): ?>
            <div class="result <?php echo isset($result['error']) ? 'error' : 'success'; ?>">
                <?php if (isset($result['error'])): ?>
                    <h3>Error</h3>
                    <p><?php echo htmlspecialchars($result['error']); ?></p>
                <?php else: ?>
                    <h3>Import Results</h3>
                    <div class="details">
                        <table>
                            <tr>
                                <th>Total Records</th>
                                <td><?php echo $result['totalRecords']; ?></td>
                            </tr>
                            <tr>
                                <th>Added Records</th>
                                <td><?php echo $result['addedRecords']; ?></td>
                            </tr>
                            <tr>
                                <th>Skipped Records (Already Exist)</th>
                                <td><?php echo $result['skippedRecords']; ?></td>
                            </tr>
                            <tr>
                                <th>Errors</th>
                                <td><?php echo count($result['errors']); ?></td>
                            </tr>
                        </table>
                        
                        <?php if (count($result['errors']) > 0): ?>
                            <h4>Error Details:</h4>
                            <ul>
                                <?php foreach ($result['errors'] as $error): ?>
                                    <li><?php echo htmlspecialchars($error); ?></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                        
                        <?php if (count($result['addedWallets']) > 0): ?>
                            <h4>Added Wallet Addresses (<?php echo count($result['addedWallets']); ?>):</h4>
                            <div class="wallets-list">
                                <?php foreach ($result['addedWallets'] as $wallet): ?>
                                    <div><?php echo htmlspecialchars($wallet); ?></div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>
</body>
</html> 
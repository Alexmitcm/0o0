<?php
require_once __DIR__ . '/../config.php';

setCorsHeaders();
setErrorHandling();

// Array of addresses
$addresses = [
    '0x3bC03e9793d2E67298fb30871a08050414757Ca7', // Referral address
    '0x10E7F9feB9096DCBb94d59D6874b07657c965981', // Unbalanced game address
    '0x65f83111e525C8a577C90298377e56E72C24aCb2'  // Gamevault game address
];

// Base API URL
$baseUrl = "https://api.arbiscan.io/api?module=account&action=tokentx&contractaddress=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9&page=1&offset=10000&startblock=0&endblock=99999999&sort=desc&apikey=68VNDTYKGYFHYACCY35W4XSWS8F729ZI41";

try {
    $pdo = getDbConnection();

    // Initialize the multi-cURL handler
    $mh = curl_multi_init();
    $curlArray = [];

    // Create a cURL handle for each address and store them in an associative array
    foreach ($addresses as $address) {
        $ch = curl_init();
        $url = $baseUrl . "&address=" . urlencode($address);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_multi_add_handle($mh, $ch);
        $curlArray[$address] = $ch;
    }

    // Execute all queries simultaneously
    $running = null;
    do {
        curl_multi_exec($mh, $running);
        usleep(100000); // 100ms
    } while ($running);

    // Delete all records from tokentx table before insertion
    $pdo->exec("DELETE FROM tokentx");

    // Prepare SQL statement for inserting records
    $sql = "INSERT INTO tokentx (
                blockNumber, timeStamp, hash, nonce, blockHash, sender, 
                contractAddress, recipient, value, tokenName, tokenSymbol, 
                tokenDecimal, transactionIndex, gas, gasPrice, gasUsed, 
                cumulativeGasUsed, input, confirmations, address
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )";
    $stmt = $pdo->prepare($sql);

    // Collect results, parse them, and insert into database
    foreach ($curlArray as $address => $ch) {
        $response = curl_multi_getcontent($ch);
        if (!curl_errno($ch)) {
            $data = json_decode($response, true);
            if (json_last_error() === JSON_ERROR_NONE && isset($data['status']) && $data['status'] === '1') {
                foreach ($data['result'] as $tx) {
                    $stmt->execute([
                        $tx['blockNumber'] ?? null,
                        $tx['timeStamp'] ?? null,
                        $tx['hash'] ?? null,
                        $tx['nonce'] ?? null,
                        $tx['blockHash'] ?? null,
                        $tx['from'] ?? null,
                        $tx['contractAddress'] ?? null,
                        $tx['to'] ?? null,
                        $tx['value'] ?? null,
                        $tx['tokenName'] ?? null,
                        $tx['tokenSymbol'] ?? null,
                        $tx['tokenDecimal'] ?? null,
                        $tx['transactionIndex'] ?? null,
                        $tx['gas'] ?? null,
                        $tx['gasPrice'] ?? null,
                        $tx['gasUsed'] ?? null,
                        $tx['cumulativeGasUsed'] ?? null,
                        $tx['input'] ?? null,
                        $tx['confirmations'] ?? null,
                        $address
                    ]);
                }
            } else {
                error_log("No transactions found or API returned an error for address: $address");
            }
        } else {
            error_log("cURL Error for address $address: " . curl_error($ch));
        }
        curl_multi_remove_handle($mh, $ch);
        curl_close($ch);
    }

    curl_multi_close($mh);
    sendJsonResponse(['status' => 'success', 'message' => 'Transactions updated successfully']);

} catch (PDOException $e) {
    sendJsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
} catch (Exception $e) {
    sendJsonResponse(['error' => 'Error: ' . $e->getMessage()], 500);
}
?>

<!-- index.php -->
<?php
// Initialize config status variable before including config.php
$configLoaded = true;

// Include config file
require_once 'config.php';

// Use functions from config.php
setCorsHeaders();
setErrorHandling();

// Gather request information
$requestInfo = [
    'success' => true,
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => [
        'php_version' => PHP_VERSION,
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
        'request_time' => date('Y-m-d H:i:s', $_SERVER['REQUEST_TIME'] ?? time()),
        'current_directory' => __DIR__
    ],
    'request' => [
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown',
        'uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
        'query_string' => $_SERVER['QUERY_STRING'] ?? '',
        'host' => $_SERVER['HTTP_HOST'] ?? 'Unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
        'origin' => $_SERVER['HTTP_ORIGIN'] ?? 'Not set',
        'referer' => $_SERVER['HTTP_REFERER'] ?? 'Not set',
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Not set'
    ],
    'headers' => [],
    'config_status' => [
        'loaded' => $configLoaded,
        'functions' => []
    ],
    'get_params' => $_GET,
    'post_params' => []
];

// Safely get POST parameters
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    if (!empty($input)) {
        $jsonData = json_decode($input, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $requestInfo['post_params'] = $jsonData;
        } else {
            // Try to parse as form data
            parse_str($input, $formData);
            if (!empty($formData)) {
                $requestInfo['post_params'] = $formData;
            } else {
                $requestInfo['post_params'] = $_POST;
            }
        }
    } else {
        $requestInfo['post_params'] = $_POST;
    }
}

// Get all headers
$allHeaders = [];
if (function_exists('getallheaders')) {
    $allHeaders = getallheaders();
} else {
    foreach ($_SERVER as $name => $value) {
        if (substr($name, 0, 5) === 'HTTP_') {
            $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
            $allHeaders[$headerName] = $value;
        }
    }
}
$requestInfo['headers'] = $allHeaders;

// Check if config functions exist
if ($configLoaded) {
    $configFunctions = [
        'setCorsHeaders',
        'setErrorHandling',
        'getDbConnection',
        'sendJsonResponse',
        'getRequestOrigin',
        'isOriginAllowed'
    ];
    
    foreach ($configFunctions as $function) {
        $requestInfo['config_status']['functions'][$function] = function_exists($function);
    }
    
    // Add detected origin if that function exists
    if (function_exists('getRequestOrigin')) {
        $requestInfo['request']['detected_origin'] = getRequestOrigin();
    }
    
    // Add database connection status
    if (function_exists('getDbConnection')) {
        try {
            $pdo = getDbConnection();
            $requestInfo['config_status']['database_connection'] = 'Success';
        } catch (Exception $e) {
            $requestInfo['config_status']['database_connection'] = 'Failed: ' . $e->getMessage();
        }
    }
}

// Send the JSON response
echo json_encode($requestInfo, JSON_PRETTY_PRINT);
exit();
?>

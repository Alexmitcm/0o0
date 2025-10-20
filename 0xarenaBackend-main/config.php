<?php
// Database configuration
define('DB_HOST', 'dpg-d052c4p5pdvs73aircrg-a');
define('DB_PORT', '5432');
define('DB_NAME', 'grgvtdow_cryptic_50b2');
define('DB_USER', 'grgvtdow_cryptic_user');
define('DB_PASS', 'TjlrWO1T5iDvVdtbezicb0NBtvA1uWf1');

// CORS configuration
define('ALLOW_ALL_ORIGINS', false); // Set to true to allow all origins, false to restrict to allowed domains
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);
// Allowed domains
$allowed_domains = [
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "0xarena.com",
    "https://0xarena.com",
    "https://zeroxarenafront.onrender.com",
    "https://zeroxarenabackend.onrender.com",
    "https://games-bmvb.onrender.com",
    "https://admin-3zy5.onrender.com",
    "https://zeroxarenafronttest.onrender.com"
];

// CORS configuration
function setCorsHeaders() {
    header('Content-Type: application/json');
    header("Access-Control-Allow-Headers: *");
    header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");

    // Get the request origin
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Set Access-Control-Allow-Origin header
    if (ALLOW_ALL_ORIGINS) {
        header("Access-Control-Allow-Origin: *");
    } else {
        // Check if origin is in allowed domains
        if (in_array($origin, $GLOBALS['allowed_domains'])) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            header("Access-Control-Allow-Origin: *");
        }
    }

    // Handle preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit();
    }
}

// Function to get the request origin from various possible headers
function getRequestOrigin() {
    $origin = '';
    
    // Check HTTP_ORIGIN first
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $origin = $_SERVER['HTTP_ORIGIN'];
    }
    // Check HTTP_REFERER if ORIGIN is not available
    elseif (isset($_SERVER['HTTP_REFERER'])) {
        $referer = parse_url($_SERVER['HTTP_REFERER']);
        $origin = $referer['scheme'] . '://' . $referer['host'];
        if (isset($referer['port'])) {
            $origin .= ':' . $referer['port'];
        }
    }
    // Check REMOTE_ADDR if neither ORIGIN nor REFERER is available
    elseif (isset($_SERVER['REMOTE_ADDR'])) {
        $origin = $_SERVER['REMOTE_ADDR'];
    }
    
    return $origin;
}

// Function to check if the request is from a web service
function isWebServiceRequest() {
    // Check if the request is coming from a known web service
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $isWebService = false;
    
    // List of known web service user agents or patterns
    $webServicePatterns = [
        'curl',
        'wget',
        'python-requests',
        'PostmanRuntime',
        'axios',
        'fetch',
        'node-fetch',
        'okhttp',
        'rest-client'
    ];
    
    foreach ($webServicePatterns as $pattern) {
        if (stripos($userAgent, $pattern) !== false) {
            $isWebService = true;
            break;
        }
    }
    
    return $isWebService;
}

// Database connection function
function getDbConnection() {
    try {
        $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";user=" . DB_USER . ";password=" . DB_PASS;
        $pdo = new PDO($dsn);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
        exit();
    }
}

// Error handling configuration
function setErrorHandling() {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
    ini_set('error_log', 'error_log.txt');
}

// Function to check if request origin is allowed
function isOriginAllowed($origin) {
    global $allowed_domains;
    return ALLOW_ALL_ORIGINS || in_array($origin, $allowed_domains);
}

// Function to get JSON input
function getJsonInput() {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON input"]);
        exit();
    }
    return $data;
}

// Function to send JSON response
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}
?>
<?php
// Set CORS headers first, before any output or errors
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple router for API endpoints
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove query string and get path
$path = parse_url($request_uri, PHP_URL_PATH);

// Handle different base paths - try to strip the base path
$base_paths = ['/scan/backend/api', '/backend/api', '/api', ''];
$original_path = $path;
foreach ($base_paths as $base) {
    if (!empty($base) && strpos($path, $base) === 0) {
        $path = substr($path, strlen($base));
        break;
    }
}

// If path still starts with /, remove it
$path = ltrim($path, '/');
$path = rtrim($path, '/');

// Debug logging (remove in production)
error_log("Router - Request URI: " . $request_uri);
error_log("Router - Parsed path: " . $path);
error_log("Router - Method: " . $request_method);

// Route to appropriate file
// Handle lookup tables route
if ($path === 'lookup' || $path === 'lookup/') {
    require_once __DIR__ . '/lookup.php';
    exit();
}
// Handle auth/login route
elseif (preg_match('#^auth/login/?$#', $path)) {
    if ($request_method === 'POST') {
        require_once __DIR__ . '/auth/login.php';
        exit();
    } else {
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed for login"]);
        exit();
    }
} elseif (preg_match('#^lawyers/(\d+)$#', $path, $matches)) {
    $_GET['id'] = $matches[1];
    require_once __DIR__ . '/lawyers/detail.php';
} elseif ($path === 'lawyers' || $path === 'lawyers/' || strpos($path, 'lawyers?') === 0){
    require_once __DIR__ . '/lawyers/index.php';
} elseif ($path === 'dashboard/reports' || strpos($path, 'dashboard/reports') === 0) {
    require_once __DIR__ . '/dashboard/reports.php';
} elseif ($path === 'export/export' || strpos($path, 'export/export') === 0) {
    require_once __DIR__ . '/export/export.php';
} elseif ($path === 'staff' || strpos($path, 'staff') === 0) {
    require_once __DIR__ . '/staff/index.php';
} elseif ($path === 'funding' || strpos($path, 'funding') === 0) {
    require_once __DIR__ . '/funding/index.php';
} else {
    http_response_code(404);
    echo json_encode([
        "message" => "Endpoint not found", 
        "path" => $path,
        "request_uri" => $request_uri,
        "method" => $request_method
    ]);
    error_log("Router - 404: Path='$path', URI='$request_uri', Method='$request_method'");
}
?>


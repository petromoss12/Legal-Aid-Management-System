<?php
// Simple test endpoint to verify server is accessible
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

echo json_encode([
    "status" => "success",
    "message" => "Backend server is accessible",
    "timestamp" => date('Y-m-d H:i:s'),
    "request_method" => $_SERVER['REQUEST_METHOD'],
    "request_uri" => $_SERVER['REQUEST_URI'] ?? 'N/A'
]);


<?php
// Test script to verify login endpoint is accessible
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

echo json_encode([
    "status" => "Login endpoint test",
    "message" => "If you see this, the login endpoint is accessible",
    "request_method" => $_SERVER['REQUEST_METHOD'] ?? 'N/A',
    "request_uri" => $_SERVER['REQUEST_URI'] ?? 'N/A',
    "note" => "This is a test endpoint. Use /auth/login for actual login."
]);


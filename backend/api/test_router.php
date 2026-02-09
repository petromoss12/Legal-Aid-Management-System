<?php
// Test script to verify router is working
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

echo json_encode([
    "status" => "Router test",
    "request_uri" => $_SERVER['REQUEST_URI'] ?? 'N/A',
    "request_method" => $_SERVER['REQUEST_METHOD'] ?? 'N/A',
    "script_name" => $_SERVER['SCRIPT_NAME'] ?? 'N/A',
    "path_info" => $_SERVER['PATH_INFO'] ?? 'N/A'
]);


<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    handleGetLookups($db);
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}

function handleGetLookups($db) {
    try {
        $result = [];

        // Get areas of law
        $areaStmt = $db->prepare("SELECT area_id, area_name FROM areas_of_law ORDER BY area_name");
        $areaStmt->execute();
        $result['areasOfLaw'] = $areaStmt->fetchAll(PDO::FETCH_ASSOC);

        // Get services
        $servStmt = $db->prepare("SELECT service_id, service_name FROM services ORDER BY service_name");
        $servStmt->execute();
        $result['services'] = $servStmt->fetchAll(PDO::FETCH_ASSOC);

        // Get target clients
        $clientStmt = $db->prepare("SELECT client_id, client_type FROM target_clients ORDER BY client_type");
        $clientStmt->execute();
        $result['targetClients'] = $clientStmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode($result);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}
?>

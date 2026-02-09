<?php
header("Content-Type: application/json");

try {
    require_once '../config/database.php';
    
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        echo json_encode(["error" => "Database connection failed"]);
        exit;
    }
    
    // Test queries
    $tests = [];
    
    // 1. Check lawyer count
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM lawyer_profiles");
    $stmt->execute();
    $tests['lawyer_profiles_count'] = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // 2. Get all lawyers
    $stmt = $db->prepare("SELECT * FROM lawyer_profiles");
    $stmt->execute();
    $tests['all_lawyers'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 3. Check areas_of_law
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM areas_of_law");
    $stmt->execute();
    $tests['areas_of_law_count'] = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // 4. Get all areas_of_law
    $stmt = $db->prepare("SELECT * FROM areas_of_law");
    $stmt->execute();
    $tests['all_areas_of_law'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 5. Check services
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM services");
    $stmt->execute();
    $tests['services_count'] = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // 6. Check target_clients
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM target_clients");
    $stmt->execute();
    $tests['target_clients_count'] = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // 7. Check locations for any lawyer
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM locations");
    $stmt->execute();
    $tests['locations_count'] = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode($tests, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>

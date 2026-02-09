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
    
    $db->beginTransaction();
    
    // Insert areas_of_law
    $areasData = [
        'Criminal Law',
        'Civil Law',
        'Family Law',
        'Commercial Law',
        'Constitutional Law',
        'Labor Law',
        'Property Law',
        'Immigration Law'
    ];
    
    $stmt = $db->prepare("INSERT INTO areas_of_law (area_name) VALUES (:name)");
    foreach ($areasData as $area) {
        try {
            $stmt->bindValue(':name', $area);
            $stmt->execute();
        } catch (PDOException $e) {
            // Area might already exist, continue
        }
    }
    
    // Insert services
    $servicesData = [
        'Legal Representation',
        'Legal Advice/Counselling',
        'Mediation/ADR',
        'Legal Education',
        'Document Drafting'
    ];
    
    $stmt = $db->prepare("INSERT INTO services (service_name) VALUES (:name)");
    foreach ($servicesData as $service) {
        try {
            $stmt->bindValue(':name', $service);
            $stmt->execute();
        } catch (PDOException $e) {
            // Service might already exist, continue
        }
    }
    
    // Insert target clients
    $clientsData = [
        'Women',
        'Children',
        'Persons with Disabilities',
        'Prisoners',
        'Refugees',
        'General Public'
    ];
    
    $stmt = $db->prepare("INSERT INTO target_clients (client_type) VALUES (:type)");
    foreach ($clientsData as $client) {
        try {
            $stmt->bindValue(':type', $client);
            $stmt->execute();
        } catch (PDOException $e) {
            // Client type might already exist, continue
        }
    }
    
    $db->commit();
    
    // Verify the inserts
    $results = [];
    
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM areas_of_law");
    $stmt->execute();
    $results['areas_of_law_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM services");
    $stmt->execute();
    $results['services_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM target_clients");
    $stmt->execute();
    $results['target_clients_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $results['message'] = 'Lookup tables populated successfully!';
    
    echo json_encode($results);
    
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>

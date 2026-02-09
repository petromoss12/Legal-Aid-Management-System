<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../utils/jwt.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$user = getAuthUser();

if (!$user || $user['role'] !== 'ADMIN') {
    http_response_code(403);
    echo json_encode(["message" => "Admin access required"]);
    exit();
}

switch ($method) {
    case 'GET':
        $lawyer_id = $_GET['lawyer_id'] ?? null;
        handleGetFunding($db, $lawyer_id);
        break;
    case 'POST':
        handleCreateFunding($db);
        break;
    case 'PUT':
        handleUpdateFunding($db);
        break;
    case 'DELETE':
        handleDeleteFunding($db);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
}

function handleGetFunding($db, $lawyer_id) {
    try {
        if ($lawyer_id) {
            $query = "SELECT * FROM funding WHERE lawyer_id = :lawyer_id ORDER BY year DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':lawyer_id', $lawyer_id);
        } else {
            $query = "SELECT f.*, lp.name as lawyer_name 
                      FROM funding f
                      JOIN lawyer_profiles lp ON f.lawyer_id = lp.lawyer_id
                      ORDER BY f.year DESC, f.amount DESC";
            $stmt = $db->prepare($query);
        }
        
        $stmt->execute();
        $funding = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["data" => $funding]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}

function handleCreateFunding($db) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $query = "INSERT INTO funding 
                  (lawyer_id, funding_source, amount, adequacy, year)
                  VALUES 
                  (:lawyer_id, :funding_source, :amount, :adequacy, :year)
                  RETURNING funding_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':lawyer_id', $data['lawyer_id']);
        $stmt->bindParam(':funding_source', $data['funding_source']);
        $stmt->bindParam(':amount', $data['amount']);
        $stmt->bindParam(':adequacy', $data['adequacy']);
        $stmt->bindParam(':year', $data['year']);
        $stmt->execute();
        
        $funding_id = $stmt->fetchColumn();
        
        http_response_code(201);
        echo json_encode(["message" => "Funding record created successfully", "funding_id" => $funding_id]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}

function handleUpdateFunding($db) {
    $data = json_decode(file_get_contents("php://input"), true);
    $funding_id = $data['funding_id'] ?? null;
    
    if (!$funding_id) {
        http_response_code(400);
        echo json_encode(["message" => "Funding ID is required"]);
        return;
    }
    
    try {
        $query = "UPDATE funding SET
                  funding_source = :funding_source, amount = :amount,
                  adequacy = :adequacy, year = :year
                  WHERE funding_id = :funding_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':funding_id', $funding_id);
        $stmt->bindParam(':funding_source', $data['funding_source']);
        $stmt->bindParam(':amount', $data['amount']);
        $stmt->bindParam(':adequacy', $data['adequacy']);
        $stmt->bindParam(':year', $data['year']);
        $stmt->execute();
        
        echo json_encode(["message" => "Funding record updated successfully"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}

function handleDeleteFunding($db) {
    $funding_id = $_GET['funding_id'] ?? null;
    
    if (!$funding_id) {
        http_response_code(400);
        echo json_encode(["message" => "Funding ID is required"]);
        return;
    }
    
    try {
        $query = "DELETE FROM funding WHERE funding_id = :funding_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':funding_id', $funding_id);
        $stmt->execute();
        
        echo json_encode(["message" => "Funding record deleted successfully"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}
?>


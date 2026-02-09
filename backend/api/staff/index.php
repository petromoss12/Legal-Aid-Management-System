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
        handleGetStaff($db, $lawyer_id);
        break;
    case 'POST':
        handleCreateStaff($db);
        break;
    case 'PUT':
        handleUpdateStaff($db);
        break;
    case 'DELETE':
        handleDeleteStaff($db);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
}

function handleGetStaff($db, $lawyer_id) {
    try {
        if ($lawyer_id) {
            $query = "SELECT * FROM staff WHERE lawyer_id = :lawyer_id ORDER BY name";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':lawyer_id', $lawyer_id);
        } else {
            $query = "SELECT * FROM staff ORDER BY name";
            $stmt = $db->prepare($query);
        }
        
        $stmt->execute();
        $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["data" => $staff]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}

function handleCreateStaff($db) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $query = "INSERT INTO staff 
                  (lawyer_id, name, role, gender, age, education_level, 
                   specialization, years_of_practice, practicing_certificate_status)
                  VALUES 
                  (:lawyer_id, :name, :role, :gender, :age, :education_level,
                   :specialization, :years_of_practice, :practicing_certificate_status)
                  RETURNING staff_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':lawyer_id', $data['lawyer_id']);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':role', $data['role']);
        $stmt->bindParam(':gender', $data['gender']);
        $stmt->bindParam(':age', $data['age']);
        $stmt->bindParam(':education_level', $data['education_level']);
        $stmt->bindParam(':specialization', $data['specialization']);
        $stmt->bindParam(':years_of_practice', $data['years_of_practice']);
        $stmt->bindParam(':practicing_certificate_status', $data['practicing_certificate_status']);
        $stmt->execute();
        
        $staff_id = $stmt->fetchColumn();
        
        http_response_code(201);
        echo json_encode(["message" => "Staff member created successfully", "staff_id" => $staff_id]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}

function handleUpdateStaff($db) {
    $data = json_decode(file_get_contents("php://input"), true);
    $staff_id = $data['staff_id'] ?? null;
    
    if (!$staff_id) {
        http_response_code(400);
        echo json_encode(["message" => "Staff ID is required"]);
        return;
    }
    
    try {
        $query = "UPDATE staff SET
                  name = :name, role = :role, gender = :gender, age = :age,
                  education_level = :education_level, specialization = :specialization,
                  years_of_practice = :years_of_practice, 
                  practicing_certificate_status = :practicing_certificate_status
                  WHERE staff_id = :staff_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':staff_id', $staff_id);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':role', $data['role']);
        $stmt->bindParam(':gender', $data['gender']);
        $stmt->bindParam(':age', $data['age']);
        $stmt->bindParam(':education_level', $data['education_level']);
        $stmt->bindParam(':specialization', $data['specialization']);
        $stmt->bindParam(':years_of_practice', $data['years_of_practice']);
        $stmt->bindParam(':practicing_certificate_status', $data['practicing_certificate_status']);
        $stmt->execute();
        
        echo json_encode(["message" => "Staff member updated successfully"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}

function handleDeleteStaff($db) {
    $staff_id = $_GET['staff_id'] ?? null;
    
    if (!$staff_id) {
        http_response_code(400);
        echo json_encode(["message" => "Staff ID is required"]);
        return;
    }
    
    try {
        $query = "DELETE FROM staff WHERE staff_id = :staff_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':staff_id', $staff_id);
        $stmt->execute();
        
        echo json_encode(["message" => "Staff member deleted successfully"]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}
?>


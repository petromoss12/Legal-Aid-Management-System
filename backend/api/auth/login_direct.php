<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// Direct access login endpoint (bypasses router for testing)
// Set CORS headers first
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["message" => "Database connection failed"]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
    exit();
}

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid JSON: " . json_last_error_msg()]);
    exit();
}

if (!isset($data->username) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["message" => "Username and password are required"]);
    exit();
}

try {
    $query = "SELECT user_id, username, password_hash, role FROM users WHERE username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $data->username);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        //echo password_hash("admin321", PASSWORD_DEFAULT);
        
        if (password_verify($data->password, $user['password_hash'])) {
            $token = generateJWT($user['user_id'], $user['role']);
            
            http_response_code(200);
            echo json_encode([
                "message" => "Login successful",
                "token" => $token,
                "user" => [
                    "user_id" => $user['user_id'],
                    "username" => $user['username'],
                    "role" => $user['role']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Invalid password"]);
        }
    } else {
        http_response_code(401);
        echo json_encode(["message" => "User not found"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
?>


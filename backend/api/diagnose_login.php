<?php
// Diagnostic script to test login functionality
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../utils/jwt.php';

$results = [];

// Test 1: Database connection
$database = new Database();
$db = $database->getConnection();
if ($db) {
    $results['database_connection'] = '✅ Connected';
} else {
    $results['database_connection'] = '❌ Failed';
    echo json_encode($results);
    exit();
}

// Test 2: Check if admin user exists
try {
    $query = "SELECT user_id, username, role, LENGTH(password_hash) as hash_length FROM users WHERE username = 'admin'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $results['admin_user_exists'] = '✅ Yes';
        $results['admin_user_id'] = $user['user_id'];
        $results['admin_role'] = $user['role'];
        $results['password_hash_length'] = $user['hash_length'];
    } else {
        $results['admin_user_exists'] = '❌ No - Admin user not found';
    }
} catch (PDOException $e) {
    $results['admin_user_exists'] = '❌ Error: ' . $e->getMessage();
}

// Test 3: Test password verification
if (isset($_GET['password'])) {
    $test_password = $_GET['password'];
    try {
        $query = "SELECT password_hash FROM users WHERE username = 'admin'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($test_password, $user['password_hash'])) {
                $results['password_test'] = '✅ Password matches!';
            } else {
                $results['password_test'] = '❌ Password does NOT match';
            }
        }
    } catch (PDOException $e) {
        $results['password_test'] = '❌ Error: ' . $e->getMessage();
    }
} else {
    $results['password_test'] = 'ℹ️ Add ?password=YOUR_PASSWORD to test';
}

// Test 4: Check JWT generation
try {
    $test_token = generateJWT(1, 'ADMIN');
    if ($test_token) {
        $results['jwt_generation'] = '✅ Working';
    } else {
        $results['jwt_generation'] = '❌ Failed';
    }
} catch (Exception $e) {
    $results['jwt_generation'] = '❌ Error: ' . $e->getMessage();
}

// Test 5: Check router path
$results['router_info'] = [
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'N/A',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'N/A',
    'note' => 'Login endpoint should be at /scan/backend/api/auth/login'
];

echo json_encode($results, JSON_PRETTY_PRINT);

?>


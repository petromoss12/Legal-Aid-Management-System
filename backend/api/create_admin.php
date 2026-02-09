<?php
// Script to create/update admin user
// Usage: Run this file once via browser or command line to set up admin user

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die("Database connection failed!\n");
}

// Default admin credentials
$username = 'admin';
$password = 'admin123'; // Change this in production!
$role = 'ADMIN';

// Hash the password
$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    // Check if admin user exists
    $checkQuery = "SELECT user_id FROM users WHERE username = :username";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':username', $username);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        // Update existing admin
        $updateQuery = "UPDATE users SET password_hash = :password_hash, role = :role WHERE username = :username";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':password_hash', $password_hash);
        $updateStmt->bindParam(':role', $role);
        $updateStmt->bindParam(':username', $username);
        $updateStmt->execute();
        
        echo "Admin user updated successfully!\n";
        echo "Username: $username\n";
        echo "Password: $password\n";
        echo "Password Hash: $password_hash\n";
    } else {
        // Insert new admin
        $insertQuery = "INSERT INTO users (username, password_hash, role) VALUES (:username, :password_hash, :role)";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->bindParam(':username', $username);
        $insertStmt->bindParam(':password_hash', $password_hash);
        $insertStmt->bindParam(':role', $role);
        $insertStmt->execute();
        
        echo "Admin user created successfully!\n";
        echo "Username: $username\n";
        echo "Password: $password\n";
        echo "Password Hash: $password_hash\n";
    }
    
    echo "\nYou can now login with:\n";
    echo "Username: admin\n";
    echo "Password: admin123\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

?>


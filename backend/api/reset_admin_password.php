<?php
// Script to reset admin password
// Usage: Open this file in your browser: http://localhost/scan/backend/api/reset_admin_password.php

header("Content-Type: text/html; charset=utf-8");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die("<h2 style='color: red;'>❌ Database connection failed!</h2><p>Please check your database configuration in backend/config/database.php</p>");
}

// Get password from URL parameter or use default
$new_password = $_GET['password'] ?? 'admin123';
$username = 'admin';

// Hash the password
$password_hash = password_hash($new_password, PASSWORD_DEFAULT);

echo "<!DOCTYPE html><html><head><title>Reset Admin Password</title>";
echo "<style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    .credentials { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
</style></head><body>";

echo "<h1>🔐 Reset Admin Password</h1>";

try {
    // Check if admin user exists
    $checkQuery = "SELECT user_id, username, role FROM users WHERE username = :username";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':username', $username);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        // Update existing admin
        $updateQuery = "UPDATE users SET password_hash = :password_hash WHERE username = :username";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':password_hash', $password_hash);
        $updateStmt->bindParam(':username', $username);
        $updateStmt->execute();
        
        echo "<div class='success'>";
        echo "<h2>✅ Admin password updated successfully!</h2>";
        echo "</div>";
        
        echo "<div class='credentials'>";
        echo "<h3>📝 Your Login Credentials:</h3>";
        echo "<p><strong>Username:</strong> <code>admin</code></p>";
        echo "<p><strong>Password:</strong> <code>" . htmlspecialchars($new_password) . "</code></p>";
        echo "</div>";
        
        echo "<div class='info'>";
        echo "<h3>ℹ️ Next Steps:</h3>";
        echo "<ol>";
        echo "<li>Go to <a href='http://localhost:3000/login' target='_blank'>http://localhost:3000/login</a></li>";
        echo "<li>Login with the credentials above</li>";
        echo "<li><strong>Important:</strong> Change this password after first login for security!</li>";
        echo "</ol>";
        echo "</div>";
        
    } else {
        // Create new admin user
        $insertQuery = "INSERT INTO users (username, password_hash, role) VALUES (:username, :password_hash, 'ADMIN')";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->bindParam(':username', $username);
        $insertStmt->bindParam(':password_hash', $password_hash);
        $insertStmt->execute();
        
        echo "<div class='success'>";
        echo "<h2>✅ Admin user created successfully!</h2>";
        echo "</div>";
        
        echo "<div class='credentials'>";
        echo "<h3>📝 Your Login Credentials:</h3>";
        echo "<p><strong>Username:</strong> <code>admin</code></p>";
        echo "<p><strong>Password:</strong> <code>" . htmlspecialchars($new_password) . "</code></p>";
        echo "</div>";
    }
    
    // Verify the password hash
    $verifyQuery = "SELECT password_hash FROM users WHERE username = :username";
    $verifyStmt = $db->prepare($verifyQuery);
    $verifyStmt->bindParam(':username', $username);
    $verifyStmt->execute();
    $user = $verifyStmt->fetch(PDO::FETCH_ASSOC);
    
    if (password_verify($new_password, $user['password_hash'])) {
        echo "<div class='info'>";
        echo "<p>✅ Password verification test: <strong>PASSED</strong></p>";
        echo "<p>The password hash is correct and ready to use.</p>";
        echo "</div>";
    } else {
        echo "<div class='error'>";
        echo "<p>⚠️ Password verification test: <strong>FAILED</strong></p>";
        echo "<p>There may be an issue with password hashing. Please try again.</p>";
        echo "</div>";
    }
    
    echo "<div class='info'>";
    echo "<h3>💡 To set a custom password:</h3>";
    echo "<p>Add <code>?password=YOUR_PASSWORD</code> to the URL</p>";
    echo "<p>Example: <code>http://localhost/scan/backend/api/reset_admin_password.php?password=MySecurePassword123</code></p>";
    echo "<p><strong>Note:</strong> Make sure your password is strong and secure!</p>";
    echo "</div>";
    
} catch (PDOException $e) {
    echo "<div class='error'>";
    echo "<h2>❌ Error occurred:</h2>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</div>";
}

echo "</body></html>";
?>


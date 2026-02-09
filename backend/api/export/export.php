<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../../utils/jwt.php';

$user = getAuthUser();
if (!$user || $user['role'] !== 'ADMIN') {
    http_response_code(403);
    echo json_encode(["message" => "Admin access required"]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

$format = $_GET['format'] ?? 'csv';
$type = $_GET['type'] ?? 'lawyers';

try {
    if ($format === 'csv') {
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="' . $type . '_' . date('Y-m-d') . '.csv"');
        
        $output = fopen('php://output', 'w');
        
        if ($type === 'lawyers') {
            $query = "SELECT 
                        lp.lawyer_id, lp.name, lp.provider_type, lp.registration_status,
                        lp.license_status, lp.phone, lp.email, lp.website,
                        lp.mode_of_operation, lp.verified
                      FROM lawyer_profiles lp
                      ORDER BY lp.name";
            
            fputcsv($output, ['ID', 'Name', 'Provider Type', 'Registration Status', 
                             'License Status', 'Phone', 'Email', 'Website', 
                             'Mode of Operation', 'Verified']);
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                fputcsv($output, $row);
            }
        }
        
        fclose($output);
    } elseif ($format === 'pdf') {
        // For PDF, you would need a library like TCPDF or FPDF
        // This is a simplified version - you may want to use a proper PDF library
        header('Content-Type: application/json');
        echo json_encode(["message" => "PDF export requires additional library setup"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Export error: " . $e->getMessage()]);
}
?>


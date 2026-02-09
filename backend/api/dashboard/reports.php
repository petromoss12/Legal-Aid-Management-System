<?php
// Ensure CORS headers are sent before any other output
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/jwt.php';

$user = getAuthUser();
if (!$user || $user['role'] !== 'ADMIN') {
    http_response_code(403);
    echo json_encode(["message" => "Admin access required"]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

$report_type = $_GET['type'] ?? 'overview';

try {
    switch ($report_type) {
        case 'lawyers_by_region':
            $query = "SELECT loc.region, COUNT(DISTINCT lp.lawyer_id) as count
                      FROM locations loc
                      JOIN lawyer_profiles lp ON loc.lawyer_id = lp.lawyer_id
                      GROUP BY loc.region
                      ORDER BY count DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'areas_of_law_coverage':
            $query = "SELECT aol.area_name, COUNT(DISTINCT laol.lawyer_id) as lawyer_count
                      FROM areas_of_law aol
                      LEFT JOIN lawyer_area_of_law laol ON aol.area_id = laol.area_id
                      GROUP BY aol.area_name
                      ORDER BY lawyer_count DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'license_status':
            $query = "SELECT license_status, COUNT(*) as count
                      FROM lawyer_profiles
                      WHERE license_status IS NOT NULL
                      GROUP BY license_status";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'funding_distribution':
            $query = "SELECT 
                        lp.name,
                        SUM(f.amount) as total_funding,
                        COUNT(CASE WHEN f.adequacy = 'Adequate' THEN 1 END) as adequate_count,
                        COUNT(CASE WHEN f.adequacy = 'Inadequate' THEN 1 END) as inadequate_count
                      FROM funding f
                      JOIN lawyer_profiles lp ON f.lawyer_id = lp.lawyer_id
                      GROUP BY lp.lawyer_id, lp.name
                      ORDER BY total_funding DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'reporting_status':
            $query = "SELECT 
                        lp.name,
                        r.reporting_frequency,
                        r.last_submitted,
                        CASE 
                            WHEN r.reporting_frequency = 'Weekly' AND r.last_submitted < CURRENT_DATE - INTERVAL '7 days' THEN 'Overdue'
                            WHEN r.reporting_frequency = 'Monthly' AND r.last_submitted < CURRENT_DATE - INTERVAL '30 days' THEN 'Overdue'
                            WHEN r.reporting_frequency = 'Quarterly' AND r.last_submitted < CURRENT_DATE - INTERVAL '90 days' THEN 'Overdue'
                            ELSE 'Current'
                        END as status
                      FROM reports r
                      JOIN lawyer_profiles lp ON r.lawyer_id = lp.lawyer_id
                      ORDER BY r.last_submitted DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'compliance_issues':
            $query = "SELECT 
                        ci.issue_type,
                        COUNT(*) as count,
                        lp.name
                      FROM compliance_issues ci
                      JOIN lawyer_profiles lp ON ci.lawyer_id = lp.lawyer_id
                      GROUP BY ci.issue_type, lp.name
                      ORDER BY count DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'staff_retention':
            $query = "SELECT 
                        lp.name,
                        COUNT(s.staff_id) as total_staff,
                        COUNT(CASE WHEN s.role = 'Advocate' THEN 1 END) as advocates,
                        COUNT(CASE WHEN s.role = 'Lawyer' THEN 1 END) as lawyers,
                        COUNT(CASE WHEN s.role = 'Paralegal' THEN 1 END) as paralegals
                      FROM lawyer_profiles lp
                      LEFT JOIN staff s ON lp.lawyer_id = s.lawyer_id
                      GROUP BY lp.lawyer_id, lp.name
                      ORDER BY total_staff DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        default:
            // Overview
            $overview = [];
            
            $totalLawyers = $db->query("SELECT COUNT(*) FROM lawyer_profiles")->fetchColumn();
            $activeLicenses = $db->query("SELECT COUNT(*) FROM lawyer_profiles WHERE license_status = 'ACTIVE'")->fetchColumn();
            $verifiedProfiles = $db->query("SELECT COUNT(*) FROM lawyer_profiles WHERE verified = true")->fetchColumn();
            $totalStaff = $db->query("SELECT COUNT(*) FROM staff")->fetchColumn();
            
            $overview = [
                'total_lawyers' => (int)$totalLawyers,
                'active_licenses' => (int)$activeLicenses,
                'verified_profiles' => (int)$verifiedProfiles,
                'total_staff' => (int)$totalStaff
            ];
            
            $data = $overview;
    }

    echo json_encode(["data" => $data]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
}
?>


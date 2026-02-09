<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../utils/jwt.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$lawyer_id = $_GET['id'] ?? null;

if (!$lawyer_id) {
    http_response_code(400);
    echo json_encode(["message" => "Lawyer ID is required"]);
    exit();
}

switch ($method) {
    case 'GET':
        handleGetLawyer($db, $lawyer_id);
        break;
    case 'PUT':
        $user = getAuthUser();
        if (!$user || $user['role'] !== 'ADMIN') {
            http_response_code(403);
            echo json_encode(["message" => "Admin access required"]);
            exit();
        }
        handleUpdateLawyer($db, $lawyer_id, $user['user_id']);
        break;
    case 'DELETE':
        $user = getAuthUser();
        if (!$user || $user['role'] !== 'ADMIN') {
            http_response_code(403);
            echo json_encode(["message" => "Admin access required"]);
            exit();
        }
        handleDeleteLawyer($db, $lawyer_id);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
}

function handleGetLawyer($db, $lawyer_id) {
    try {
        $query = "SELECT * FROM lawyer_profiles WHERE lawyer_id = :lawyer_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':lawyer_id', $lawyer_id);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["message" => "Lawyer not found"]);
            return;
        }

        $lawyer = $stmt->fetch(PDO::FETCH_ASSOC);

        // Get locations
        $locStmt = $db->prepare("SELECT * FROM locations WHERE lawyer_id = :lawyer_id");
        $locStmt->bindParam(':lawyer_id', $lawyer_id);
        $locStmt->execute();
        $lawyer['locations'] = $locStmt->fetchAll(PDO::FETCH_ASSOC);

        // Get areas of law
        $areaStmt = $db->prepare("
            SELECT aol.area_name, laol.case_percentage 
            FROM lawyer_area_of_law laol
            JOIN areas_of_law aol ON laol.area_id = aol.area_id
            WHERE laol.lawyer_id = :lawyer_id
        ");
        $areaStmt->bindParam(':lawyer_id', $lawyer_id);
        $areaStmt->execute();
        $lawyer['areas_of_law'] = $areaStmt->fetchAll(PDO::FETCH_ASSOC);

        // Get services
        $servStmt = $db->prepare("
            SELECT s.service_name 
            FROM lawyer_services ls
            JOIN services s ON ls.service_id = s.service_id
            WHERE ls.lawyer_id = :lawyer_id
        ");
        $servStmt->bindParam(':lawyer_id', $lawyer_id);
        $servStmt->execute();
        $lawyer['services'] = $servStmt->fetchAll(PDO::FETCH_COLUMN);

        // Get target clients
        $clientStmt = $db->prepare("
            SELECT tc.client_type 
            FROM lawyer_target_clients ltc
            JOIN target_clients tc ON ltc.client_id = tc.client_id
            WHERE ltc.lawyer_id = :lawyer_id
        ");
        $clientStmt->bindParam(':lawyer_id', $lawyer_id);
        $clientStmt->execute();
        $lawyer['target_clients'] = $clientStmt->fetchAll(PDO::FETCH_COLUMN);

        // Get staff
        $staffStmt = $db->prepare("SELECT * FROM staff WHERE lawyer_id = :lawyer_id");
        $staffStmt->bindParam(':lawyer_id', $lawyer_id);
        $staffStmt->execute();
        $lawyer['staff'] = $staffStmt->fetchAll(PDO::FETCH_ASSOC);

        // Get funding
        $fundStmt = $db->prepare("SELECT * FROM funding WHERE lawyer_id = :lawyer_id");
        $fundStmt->bindParam(':lawyer_id', $lawyer_id);
        $fundStmt->execute();
        $lawyer['funding'] = $fundStmt->fetchAll(PDO::FETCH_ASSOC);

        // Get reports
        $reportStmt = $db->prepare("SELECT * FROM reports WHERE lawyer_id = :lawyer_id");
        $reportStmt->bindParam(':lawyer_id', $lawyer_id);
        $reportStmt->execute();
        $lawyer['reports'] = $reportStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($lawyer);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}

function handleUpdateLawyer($db, $lawyer_id, $user_id) {
    $data = json_decode(file_get_contents("php://input"), true);

    try {
        $db->beginTransaction();

        // Update main profile
        $query = "UPDATE lawyer_profiles SET
                  name = :name, provider_type = :provider_type, 
                  registration_status = :registration_status,
                  license_status = :license_status, phone = :phone,
                  email = :email, website = :website,
                  mode_of_operation = :mode_of_operation, verified = :verified
                  WHERE lawyer_id = :lawyer_id";

        $stmt = $db->prepare($query);
        $stmt->bindParam(':lawyer_id', $lawyer_id);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':provider_type', $data['provider_type']);
        $stmt->bindParam(':registration_status', $data['registration_status']);
        $stmt->bindParam(':license_status', $data['license_status']);
        $stmt->bindParam(':phone', $data['phone']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':website', $data['website']);
        $stmt->bindParam(':mode_of_operation', $data['mode_of_operation']);
        $verified = $data['verified'] ?? false;
        $stmt->bindParam(':verified', $verified, PDO::PARAM_BOOL);
        $stmt->execute();

        // Delete and reinsert locations
        $delLoc = $db->prepare("DELETE FROM locations WHERE lawyer_id = :lawyer_id");
        $delLoc->bindParam(':lawyer_id', $lawyer_id);
        $delLoc->execute();

        if (isset($data['locations']) && is_array($data['locations'])) {
            $locQuery = "INSERT INTO locations (lawyer_id, region, district, ward, village, street) 
                         VALUES (:lawyer_id, :region, :district, :ward, :village, :street)";
            $locStmt = $db->prepare($locQuery);
            foreach ($data['locations'] as $location) {
                $locStmt->bindParam(':lawyer_id', $lawyer_id);
                $locStmt->bindParam(':region', $location['region']);
                $locStmt->bindParam(':district', $location['district']);
                $locStmt->bindParam(':ward', $location['ward']);
                $locStmt->bindParam(':village', $location['village']);
                $locStmt->bindParam(':street', $location['street']);
                $locStmt->execute();
            }
        }

        // Delete and reinsert areas of law
        $delArea = $db->prepare("DELETE FROM lawyer_area_of_law WHERE lawyer_id = :lawyer_id");
        $delArea->bindParam(':lawyer_id', $lawyer_id);
        $delArea->execute();

        if (isset($data['areas_of_law']) && is_array($data['areas_of_law'])) {
            $areaQuery = "INSERT INTO lawyer_area_of_law (lawyer_id, area_id, case_percentage)
                          VALUES (:lawyer_id, 
                                  (SELECT area_id FROM areas_of_law WHERE area_name = :area_name),
                                  :case_percentage)";
            $areaStmt = $db->prepare($areaQuery);
            foreach ($data['areas_of_law'] as $area) {
                $areaStmt->bindParam(':lawyer_id', $lawyer_id);
                $areaStmt->bindParam(':area_name', $area['area_name']);
                $areaStmt->bindParam(':case_percentage', $area['case_percentage']);
                $areaStmt->execute();
            }
        }

        // Delete and reinsert services
        $delServ = $db->prepare("DELETE FROM lawyer_services WHERE lawyer_id = :lawyer_id");
        $delServ->bindParam(':lawyer_id', $lawyer_id);
        $delServ->execute();

        if (isset($data['services']) && is_array($data['services'])) {
            $servQuery = "INSERT INTO lawyer_services (lawyer_id, service_id)
                          VALUES (:lawyer_id, 
                                  (SELECT service_id FROM services WHERE service_name = :service_name))";
            $servStmt = $db->prepare($servQuery);
            foreach ($data['services'] as $service) {
                $servStmt->bindParam(':lawyer_id', $lawyer_id);
                $servStmt->bindParam(':service_name', $service);
                $servStmt->execute();
            }
        }

        // Delete and reinsert target clients
        $delClient = $db->prepare("DELETE FROM lawyer_target_clients WHERE lawyer_id = :lawyer_id");
        $delClient->bindParam(':lawyer_id', $lawyer_id);
        $delClient->execute();

        if (isset($data['target_clients']) && is_array($data['target_clients'])) {
            $clientQuery = "INSERT INTO lawyer_target_clients (lawyer_id, client_id)
                            VALUES (:lawyer_id,
                                    (SELECT client_id FROM target_clients WHERE client_type = :client_type))";
            $clientStmt = $db->prepare($clientQuery);
            foreach ($data['target_clients'] as $client) {
                $clientStmt->bindParam(':lawyer_id', $lawyer_id);
                $clientStmt->bindParam(':client_type', $client);
                $clientStmt->execute();
            }
        }

        // Log update history
        $historyQuery = "INSERT INTO profile_update_history (lawyer_id, updated_by, update_description)
                         VALUES (:lawyer_id, :updated_by, :description)";
        $historyStmt = $db->prepare($historyQuery);
        $description = $data['update_description'] ?? "Profile updated";
        $historyStmt->bindParam(':lawyer_id', $lawyer_id);
        $historyStmt->bindParam(':updated_by', $user_id);
        $historyStmt->bindParam(':description', $description);
        $historyStmt->execute();

        $db->commit();
        echo json_encode(["message" => "Lawyer profile updated successfully"]);
    } catch (PDOException $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}

function handleDeleteLawyer($db, $lawyer_id) {
    try {
        $query = "DELETE FROM lawyer_profiles WHERE lawyer_id = :lawyer_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':lawyer_id', $lawyer_id);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            echo json_encode(["message" => "Lawyer profile deleted successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Lawyer not found"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}
?>


<?php
// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set CORS headers first, before any output or errors
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    require_once '../../config/database.php';
    require_once '../../utils/jwt.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server configuration error: " . $e->getMessage()]);
    error_log("Configuration error: " . $e->getMessage());
    exit();
}

$database = new Database();
$db = $database->getConnection();

// Check if database connection failed
if (!$db) {
    http_response_code(500);
    echo json_encode(["message" => "Database connection failed. Please check your database configuration."]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Public search - no auth required
        handleGetLawyers($db);
        break;
    case 'POST':
        // Create lawyer profile - admin only
        $user = getAuthUser();
        if (!$user || $user['role'] !== 'ADMIN') {
            http_response_code(403);
            echo json_encode(["message" => "Admin access required"]);
            exit();
        }
        handleCreateLawyer($db, $user['user_id']);
        break;
    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
}

function handleGetLawyers($db) {
    $search = $_GET['search'] ?? '';
    $region = $_GET['region'] ?? '';
    $area_of_law = $_GET['area_of_law'] ?? '';
    $service = $_GET['service'] ?? '';
    $license_status = $_GET['license_status'] ?? '';
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 20);
    $offset = ($page - 1) * $limit;

    $query = "SELECT DISTINCT 
                lp.lawyer_id, lp.name, lp.provider_type, lp.registration_status,
                lp.license_status, lp.phone, lp.email, lp.website, 
                lp.mode_of_operation, lp.verified
              FROM lawyer_profiles lp
              LEFT JOIN locations loc ON lp.lawyer_id = loc.lawyer_id
              LEFT JOIN lawyer_area_of_law laol ON lp.lawyer_id = laol.lawyer_id
              LEFT JOIN areas_of_law aol ON laol.area_id = aol.area_id
              LEFT JOIN lawyer_services ls ON lp.lawyer_id = ls.lawyer_id
              LEFT JOIN services s ON ls.service_id = s.service_id
              WHERE 1=1";

    $params = [];

    if ($search) {
        $query .= " AND (lp.name ILIKE :search OR lp.email ILIKE :search)";
        $params[':search'] = "%$search%";
    }

    if ($region) {
        $query .= " AND loc.region = :region";
        $params[':region'] = $region;
    }

    if ($area_of_law) {
        $query .= " AND aol.area_name = :area_of_law";
        $params[':area_of_law'] = $area_of_law;
    }

    if ($service) {
        $query .= " AND s.service_name = :service";
        $params[':service'] = $service;
    }

    if ($license_status) {
        $query .= " AND lp.license_status = :license_status";
        $params[':license_status'] = $license_status;
    }

    $query .= " ORDER BY lp.name LIMIT :limit OFFSET :offset";

    try {
        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $lawyers = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $lawyer_id = $row['lawyer_id'];
            
            // Get locations
            $locStmt = $db->prepare("SELECT * FROM locations WHERE lawyer_id = :lawyer_id");
            $locStmt->bindParam(':lawyer_id', $lawyer_id);
            $locStmt->execute();
            $row['locations'] = $locStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get areas of law with percentages
            $areaStmt = $db->prepare("
                SELECT aol.area_name, laol.case_percentage 
                FROM lawyer_area_of_law laol
                JOIN areas_of_law aol ON laol.area_id = aol.area_id
                WHERE laol.lawyer_id = :lawyer_id
            ");
            $areaStmt->bindParam(':lawyer_id', $lawyer_id);
            $areaStmt->execute();
            $row['areas_of_law'] = $areaStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get services
            $servStmt = $db->prepare("
                SELECT s.service_name 
                FROM lawyer_services ls
                JOIN services s ON ls.service_id = s.service_id
                WHERE ls.lawyer_id = :lawyer_id
            ");
            $servStmt->bindParam(':lawyer_id', $lawyer_id);
            $servStmt->execute();
            $row['services'] = $servStmt->fetchAll(PDO::FETCH_COLUMN);

            // Get target clients
            $clientStmt = $db->prepare("
                SELECT tc.client_type 
                FROM lawyer_target_clients ltc
                JOIN target_clients tc ON ltc.client_id = tc.client_id
                WHERE ltc.lawyer_id = :lawyer_id
            ");
            $clientStmt->bindParam(':lawyer_id', $lawyer_id);
            $clientStmt->execute();
            $row['target_clients'] = $clientStmt->fetchAll(PDO::FETCH_COLUMN);

            $lawyers[] = $row;
        }

        // Get total count
        $countQuery = str_replace("SELECT DISTINCT lp.lawyer_id, lp.name", "SELECT COUNT(DISTINCT lp.lawyer_id)", $query);
        $countQuery = preg_replace('/ORDER BY.*$/', '', $countQuery);
        $countQuery = preg_replace('/LIMIT.*$/', '', $countQuery);
        $countStmt = $db->prepare($countQuery);
        foreach ($params as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetchColumn();

        echo json_encode([
            "data" => $lawyers,
            "total" => $total,
            "page" => $page,
            "limit" => $limit
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    }
}

function handleCreateLawyer($db, $user_id) {
    // Check database connection
    if (!$db) {
        http_response_code(500);
        echo json_encode(["message" => "Database connection failed"]);
        return;
    }

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    // Check if JSON decode failed
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid JSON data: " . json_last_error_msg()]);
        return;
    }

    // Check if data is null or empty
    if ($data === null || !is_array($data)) {
        http_response_code(400);
        echo json_encode(["message" => "No data received or invalid data format"]);
        return;
    }

    // Validate required fields
    if (empty($data['name']) || empty($data['provider_type'])) {
        http_response_code(400);
        echo json_encode(["message" => "Name and provider type are required"]);
        return;
    }

    try {
        $db->beginTransaction();

        // Create user account if provided
        $lawyer_user_id = null;
        if (isset($data['username']) && isset($data['password']) && !empty($data['username']) && !empty($data['password'])) {
            $userQuery = "INSERT INTO users (username, password_hash, role) VALUES (:username, :password_hash, 'LAWYER') RETURNING user_id";
            $userStmt = $db->prepare($userQuery);
            $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
            $userStmt->bindValue(':username', $data['username']);
            $userStmt->bindValue(':password_hash', $password_hash);
            $userStmt->execute();
            $lawyer_user_id = $userStmt->fetchColumn();
        }

        // Create lawyer profile
        $query = "INSERT INTO lawyer_profiles 
                  (user_id, name, provider_type, registration_status, license_status, 
                   phone, email, website, mode_of_operation, verified)
                  VALUES 
                  (:user_id, :name, :provider_type, :registration_status, :license_status,
                   :phone, :email, :website, :mode_of_operation, :verified)
                  RETURNING lawyer_id";

        $stmt = $db->prepare($query);
        if ($lawyer_user_id !== null) {
            $stmt->bindValue(':user_id', $lawyer_user_id, PDO::PARAM_INT);
        } else {
            $stmt->bindValue(':user_id', null, PDO::PARAM_NULL);
        }
        $stmt->bindValue(':name', $data['name']);
        $stmt->bindValue(':provider_type', $data['provider_type']);
        $registration_status = !empty($data['registration_status']) ? $data['registration_status'] : null;
        $stmt->bindValue(':registration_status', $registration_status, $registration_status !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $license_status = !empty($data['license_status']) ? $data['license_status'] : null;
        $stmt->bindValue(':license_status', $license_status, $license_status !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $phone = !empty($data['phone']) ? $data['phone'] : null;
        $stmt->bindValue(':phone', $phone, $phone !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $email = !empty($data['email']) ? $data['email'] : null;
        $stmt->bindValue(':email', $email, $email !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $website = !empty($data['website']) ? $data['website'] : null;
        $stmt->bindValue(':website', $website, $website !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $mode_of_operation = !empty($data['mode_of_operation']) ? $data['mode_of_operation'] : null;
        $stmt->bindValue(':mode_of_operation', $mode_of_operation, $mode_of_operation !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $verified = isset($data['verified']) ? (bool)$data['verified'] : false;
        $stmt->bindValue(':verified', $verified, PDO::PARAM_BOOL);
        $stmt->execute();

        $lawyer_id = $stmt->fetchColumn();
        
        if (!$lawyer_id) {
            throw new PDOException("Failed to create lawyer profile");
        }

        // Insert locations
        if (isset($data['locations']) && is_array($data['locations'])) {
            $locQuery = "INSERT INTO locations (lawyer_id, region, district, ward, village, street) 
                         VALUES (:lawyer_id, :region, :district, :ward, :village, :street)";
            $locStmt = $db->prepare($locQuery);
            foreach ($data['locations'] as $location) {
                if (!empty($location['region'])) {
                    $locStmt->bindValue(':lawyer_id', $lawyer_id, PDO::PARAM_INT);
                    $locStmt->bindValue(':region', $location['region']);
                    $locStmt->bindValue(':district', $location['district'] ?? null);
                    $locStmt->bindValue(':ward', $location['ward'] ?? null);
                    $locStmt->bindValue(':village', $location['village'] ?? null);
                    $locStmt->bindValue(':street', $location['street'] ?? null);
                    $locStmt->execute();
                }
            }
        }

        // Insert areas of law
        if (isset($data['areas_of_law']) && is_array($data['areas_of_law']) && count($data['areas_of_law']) > 0) {
            $areaQuery = "INSERT INTO lawyer_area_of_law (lawyer_id, area_id, case_percentage)
                          VALUES (:lawyer_id, 
                                  (SELECT area_id FROM areas_of_law WHERE area_name = :area_name),
                                  :case_percentage)";
            $areaStmt = $db->prepare($areaQuery);
            foreach ($data['areas_of_law'] as $area) {
                if (!empty($area['area_name'])) {
                    // Verify area exists
                    $checkArea = $db->prepare("SELECT area_id FROM areas_of_law WHERE area_name = :area_name");
                    $checkArea->bindValue(':area_name', $area['area_name']);
                    $checkArea->execute();
                    if ($checkArea->fetchColumn()) {
                        $areaStmt->bindValue(':lawyer_id', $lawyer_id, PDO::PARAM_INT);
                        $areaStmt->bindValue(':area_name', $area['area_name']);
                        $areaStmt->bindValue(':case_percentage', $area['case_percentage'] ?? 0, PDO::PARAM_INT);
                        $areaStmt->execute();
                    }
                }
            }
        }

        // Insert services
        if (isset($data['services']) && is_array($data['services']) && count($data['services']) > 0) {
            $servQuery = "INSERT INTO lawyer_services (lawyer_id, service_id)
                          VALUES (:lawyer_id, 
                                  (SELECT service_id FROM services WHERE service_name = :service_name))";
            $servStmt = $db->prepare($servQuery);
            foreach ($data['services'] as $service) {
                if (!empty($service)) {
                    // Verify service exists
                    $checkService = $db->prepare("SELECT service_id FROM services WHERE service_name = :service_name");
                    $checkService->bindValue(':service_name', $service);
                    $checkService->execute();
                    if ($checkService->fetchColumn()) {
                        $servStmt->bindValue(':lawyer_id', $lawyer_id, PDO::PARAM_INT);
                        $servStmt->bindValue(':service_name', $service);
                        $servStmt->execute();
                    }
                }
            }
        }

        // Insert target clients
        if (isset($data['target_clients']) && is_array($data['target_clients']) && count($data['target_clients']) > 0) {
            $clientQuery = "INSERT INTO lawyer_target_clients (lawyer_id, client_id)
                            VALUES (:lawyer_id,
                                    (SELECT client_id FROM target_clients WHERE client_type = :client_type))";
            $clientStmt = $db->prepare($clientQuery);
            foreach ($data['target_clients'] as $client) {
                if (!empty($client)) {
                    // Verify client type exists
                    $checkClient = $db->prepare("SELECT client_id FROM target_clients WHERE client_type = :client_type");
                    $checkClient->bindValue(':client_type', $client);
                    $checkClient->execute();
                    if ($checkClient->fetchColumn()) {
                        $clientStmt->bindValue(':lawyer_id', $lawyer_id, PDO::PARAM_INT);
                        $clientStmt->bindValue(':client_type', $client);
                        $clientStmt->execute();
                    }
                }
            }
        }

        // Log update history
        $historyQuery = "INSERT INTO profile_update_history (lawyer_id, updated_by, update_description)
                         VALUES (:lawyer_id, :updated_by, :description)";
        $historyStmt = $db->prepare($historyQuery);
        $description = "Profile created";
        $historyStmt->bindValue(':lawyer_id', $lawyer_id, PDO::PARAM_INT);
        $historyStmt->bindValue(':updated_by', $user_id, PDO::PARAM_INT);
        $historyStmt->bindValue(':description', $description);
        $historyStmt->execute();

        $db->commit();
        http_response_code(201);
        echo json_encode(["message" => "Lawyer profile created successfully", "lawyer_id" => $lawyer_id]);
    } catch (PDOException $e) {
        if ($db && $db->inTransaction()) {
            $db->rollBack();
        }
        error_log("PDO Error in handleCreateLawyer: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(["message" => "Error in adding lawyer: " . $e->getMessage()]);
    } catch (Exception $e) {
        if ($db && $db->inTransaction()) {
            $db->rollBack();
        }
        error_log("General Error in handleCreateLawyer: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(["message" => "Error in adding lawyer: " . $e->getMessage()]);
    }
}

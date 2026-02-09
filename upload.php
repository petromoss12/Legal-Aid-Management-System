<?php
// Optional autoload if PhpSpreadsheet is installed via Composer
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
}

$resultsDir = __DIR__ . '/results';
if (!is_dir($resultsDir)) {
    mkdir($resultsDir, 0755, true);
}

if (!isset($_FILES['excel'])) {
    echo 'No file uploaded.';
    exit;
}

$uploaded = $_FILES['excel'];
if ($uploaded['error'] !== UPLOAD_ERR_OK) {
    echo 'Upload error: ' . $uploaded['error'];
    exit;
}

$tmpName = $uploaded['tmp_name'];
$origName = $uploaded['name'];
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

$data = [];
$headers = [];

// If PhpSpreadsheet is available and the file is a spreadsheet, use it
if (($ext === 'xlsx' || $ext === 'xls' || $ext === 'ods') && class_exists('PhpOffice\\PhpSpreadsheet\\IOFactory')) {
    try {
        $spreadsheet = PhpOffice\PhpSpreadsheet\IOFactory::load($tmpName);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);
        // Convert associative columns to indexed arrays and extract header
        if (count($rows) > 0) {
            $first = array_shift($rows);
            $headers = array_values($first);
            foreach ($rows as $r) {
                $data[] = array_values($r);
            }
        }
    } catch (Exception $e) {
        echo 'Failed to read spreadsheet: ' . htmlspecialchars($e->getMessage());
        exit;
    }
} else {
    // Fallback: parse as CSV
    if (($handle = fopen($tmpName, 'r')) !== false) {
        $firstLine = fgets($handle);
        rewind($handle);
        $delim = (strpos($firstLine, ';') !== false) ? ';' : ',';
        $rowIndex = 0;
        while (($row = fgetcsv($handle, 0, $delim)) !== false) {
            if ($rowIndex === 0) {
                $headers = $row;
            } else {
                $data[] = $row;
            }
            $rowIndex++;
        }
        fclose($handle);
    } else {
        echo 'Unable to open uploaded file as CSV.';
        exit;
    }
}

// Ensure we have headers
if (empty($headers)) {
    $maxCols = 0;
    foreach ($data as $r) {
        $maxCols = max($maxCols, count($r));
    }
    for ($i = 0; $i < $maxCols; $i++) {
        $headers[] = 'col' . ($i + 1);
    }
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
$base = $scheme . '://' . $host . $scriptDir;

$links = [];
foreach ($data as $i => $row) {
    $rowAssoc = [];
    foreach ($headers as $k => $h) {
        $rowAssoc[trim($h)] = isset($row[$k]) ? $row[$k] : '';
    }

    // Determine a student id
    $idKeys = ['student_id', 'studentid', 'id', 'regno', 'registration', 'roll'];
    $id = null;
    foreach ($idKeys as $key) {
        foreach ($rowAssoc as $hk => $hv) {
            if (strcasecmp($hk, $key) === 0 && strlen(trim($hv)) > 0) {
                $id = trim($hv);
                break 2;
            }
        }
    }
    if (!$id) {
        $id = 'student_' . ($i + 1);
    }

    $fileSafe = preg_replace('/[^A-Za-z0-9_-]/', '_', $id) . '.html';
    $resultUrl = $base . '/results/' . $fileSafe;

    // Build student HTML
    $html = '<!doctype html><html><head><meta charset="utf-8"><title>Result: ' . htmlspecialchars($id) . '</title>'; 
    $html .= '<style>body{font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:18px;padding:0 12px}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:left}</style>';
    $html .= '</head><body>';
    $html .= '<h2>Student Result</h2>';
    $html .= '<table>'; 
    foreach ($rowAssoc as $k => $v) {
        $html .= '<tr><th>' . htmlspecialchars($k) . '</th><td>' . nl2br(htmlspecialchars($v)) . '</td></tr>';
    }
    $html .= '</table>';

    $qrUrl = 'https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=' . urlencode($resultUrl);
    $html .= '<h3>QR (link to this page)</h3>';
    $html .= '<p><img src="' . htmlspecialchars($qrUrl) . '" alt="QR"></p>';
    $html .= '<p><a href="' . htmlspecialchars($resultUrl) . '" target="_blank">Open this result</a></p>';
    $html .= '</body></html>';

    file_put_contents($resultsDir . '/' . $fileSafe, $html);

    $links[] = ['id' => $id, 'file' => $fileSafe, 'url' => $resultUrl, 'qr' => $qrUrl];
}

// Output summary
echo '<h3>Generated ' . count($links) . ' student pages</h3>';
echo '<table><tr><th>Student</th><th>View</th><th>QR</th></tr>';
foreach ($links as $l) {
    echo '<tr>';
    echo '<td>' . htmlspecialchars($l['id']) . '</td>';
    echo '<td><a href="results/' . htmlspecialchars($l['file']) . '" target="_blank">Open</a></td>';
    echo '<td><img src="' . htmlspecialchars($l['qr']) . '" style="width:80px;height:80px"></td>';
    echo '</tr>';
}
echo '</table>';
exit;

?>

<?php
/**
 * POST /api/submit.php
 * Rejestruje kod finałowy uczestnika w pliku JSON.
 *
 * Request:  Content-Type: application/json
 *           { "final_code": "1234-AB", "source": "gh-pages" }
 * Response: { "ok": true, "result": "created"|"already_exists", "final_code": "..." }
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/_helpers.php';

cors_headers();

// Obsługa preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

// Weryfikacja Content-Type
$ct = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($ct, 'application/json') === false) {
    json_response(['ok' => false, 'error' => 'invalid_payload'], 400);
}

// Parsowanie payloadu
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
    json_response(['ok' => false, 'error' => 'invalid_payload'], 400);
}

// Walidacja final_code: format 4 cyfry, myślnik, 2 wielkie litery
$final_code = trim((string)($body['final_code'] ?? ''));
if (!preg_match('/^[0-9]{4}-[A-Z]{2}$/', $final_code)) {
    json_response(['ok' => false, 'error' => 'invalid_code_format'], 400);
}

// Zapis do JSON
$data = read_json();
$now  = now();

if (isset($data[$final_code])) {
    // Kod już istnieje – odśwież updated_at i odpowiedz already_exists
    $data[$final_code]['updated_at'] = $now;
    write_json($data);
    json_response(['ok' => true, 'result' => 'already_exists', 'final_code' => $final_code]);
}

// Nowy wpis
$data[$final_code] = [
    'final_code'  => $final_code,
    'full_name'   => '',
    'created_at'  => $now,
    'updated_at'  => $now,
    'status'      => 'new',
];

if (!write_json($data)) {
    json_response(['ok' => false, 'error' => 'storage_write_failed'], 500);
}

json_response(['ok' => true, 'result' => 'created', 'final_code' => $final_code]);

<?php
/**
 * POST /api/update-name.php
 * Aktualizuje imię i nazwisko uczestnika powiązane z kodem finałowym.
 *
 * Request:  Content-Type: application/json
 *           { "final_code": "1234-AB", "full_name": "Jan Kowalski" }
 * Response: { "ok": true, "result": "updated", "final_code": "...", "full_name": "..." }
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

// Walidacja final_code
$final_code = trim((string)($body['final_code'] ?? ''));
if (!preg_match('/^[0-9]{4}-[A-Z]{2}$/', $final_code)) {
    json_response(['ok' => false, 'error' => 'invalid_code_format'], 400);
}

// Walidacja full_name
$full_name = trim((string)($body['full_name'] ?? ''));
if (mb_strlen($full_name) > FULL_NAME_MAX_LEN) {
    json_response(['ok' => false, 'error' => 'full_name_too_long'], 400);
}

// Znajdź i zaktualizuj rekord
$data = read_json();

if (!isset($data[$final_code])) {
    json_response(['ok' => false, 'error' => 'final_code_not_found'], 404);
}

$data[$final_code]['full_name']  = $full_name;
$data[$final_code]['updated_at'] = now();

if (!write_json($data)) {
    json_response(['ok' => false, 'error' => 'storage_write_failed'], 500);
}

json_response([
    'ok'         => true,
    'result'     => 'updated',
    'final_code' => $final_code,
    'full_name'  => $full_name,
]);

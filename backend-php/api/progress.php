<?php
/**
 * POST /api/progress.php
 * Aktualizuje liczbę odkrytych kart dla sesji gracza.
 *
 * Request:  Content-Type: application/json
 *           { "final_code": "1234-AB", "discovered_count": 3 }
 * Response: { "ok": true }
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

// Walidacja discovered_count
$discovered_count = (int)($body['discovered_count'] ?? -1);
if ($discovered_count < 0 || $discovered_count > TOTAL_CARDS) {
    json_response(['ok' => false, 'error' => 'invalid_discovered_count'], 400);
}

// Znajdź wpis i zaktualizuj
$data = read_json();

if (!isset($data[$final_code])) {
    json_response(['ok' => false, 'error' => 'final_code_not_found'], 404);
}

$data[$final_code]['discovered_count'] = $discovered_count;
$data[$final_code]['updated_at']       = now();

// Po zebraniu wszystkich kart – oznacz jako ukończone
if ($discovered_count >= TOTAL_CARDS) {
    $data[$final_code]['status'] = 'completed';
}

if (!write_json($data)) {
    json_response(['ok' => false, 'error' => 'storage_write_failed'], 500);
}

json_response(['ok' => true]);

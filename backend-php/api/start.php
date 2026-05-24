<?php
/**
 * POST /api/start.php
 * Rejestruje nową sesję gracza i zwraca wygenerowany kod finałowy.
 * Wywoływany przy pierwszym otwarciu gry po starcie.
 *
 * Request:  Content-Type: application/json
 *           { "source": "gh-pages" }
 * Response: { "ok": true, "final_code": "1234-AB" }
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

$data = read_json();
$now  = now();

// Generuj unikalny kod finałowy (pętla do momentu znalezienia wolnego)
$max_attempts = 20;
$final_code   = null;
for ($i = 0; $i < $max_attempts; $i++) {
    $candidate = generate_final_code();
    if (!isset($data[$candidate])) {
        $final_code = $candidate;
        break;
    }
}

if ($final_code === null) {
    json_response(['ok' => false, 'error' => 'code_generation_failed'], 500);
}

$data[$final_code] = [
    'final_code'       => $final_code,
    'full_name'        => '',
    'created_at'       => $now,
    'updated_at'       => $now,
    'status'           => 'playing',
    'discovered_count' => 0,
];

if (!write_json($data)) {
    json_response(['ok' => false, 'error' => 'storage_write_failed'], 500);
}

json_response(['ok' => true, 'final_code' => $final_code]);

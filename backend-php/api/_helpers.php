<?php
/**
 * Funkcje pomocnicze backendu urny.
 * Wymaga stałych DATA_FILE, ALLOWED_ORIGIN, FULL_NAME_MAX_LEN z config/config.php.
 */

/**
 * Ustawia nagłówki CORS tylko dla dozwolonego originu z config.php.
 * Panel admina nie wywołuje tej funkcji.
 */
function cors_headers(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === ALLOWED_ORIGIN) {
        header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
}

/**
 * Wysyła odpowiedź JSON i kończy wykonywanie skryptu.
 */
function json_response(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Odczytuje plik JSON z wpisami uczestników.
 * Zwraca tablicę asocjacyjną [final_code => entry].
 */
function read_json(): array
{
    if (!file_exists(DATA_FILE)) {
        return [];
    }
    $fh = fopen(DATA_FILE, 'r');
    if ($fh === false) {
        return [];
    }
    flock($fh, LOCK_SH);
    $content = stream_get_contents($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

/**
 * Zapisuje tablicę wpisów do pliku JSON w sposób atomowy.
 * Zwraca true jeśli zapis się powiódł.
 */
function write_json(array $data): bool
{
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $dir = dirname(DATA_FILE);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    // Zapis do pliku tymczasowego, potem atomowy rename
    $tmp = DATA_FILE . '.tmp.' . bin2hex(random_bytes(6));
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    if (!rename($tmp, DATA_FILE)) {
        @unlink($tmp);
        return false;
    }
    return true;
}

/**
 * Zwraca aktualny czas jako ISO 8601 z offset strony serwera.
 */
function now(): string
{
    return date('c');
}

/**
 * Generuje losowy kod finałowy w formacie 4 cyfry + myślnik + 2 wielkie litery.
 * Alfabet liter wyklucza I, O (podobne do cyfr).
 */
function generate_final_code(): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    $num = random_int(1111, 9999);
    $l1  = $alphabet[random_int(0, strlen($alphabet) - 1)];
    $l2  = $alphabet[random_int(0, strlen($alphabet) - 1)];
    return sprintf('%d-%s%s', $num, $l1, $l2);
}

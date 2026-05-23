<?php
/**
 * Konfiguracja backendu urny.
 *
 * Przed wdrożeniem ustaw:
 *   1. ADMIN_PASSWORD_HASH – wygeneruj hash przez:
 *        php -r "echo password_hash('TWOJE_HASLO', PASSWORD_BCRYPT);"
 *      i wklej wynik poniżej.
 *   2. ALLOWED_ORIGIN – dokładny adres GitHub Pages bez końcowego slasha,
 *        np. https://twoj-login.github.io
 */

// Hash hasła administratora panelu.
// Dopóki nie zmienisz tego placeholdera, panel admina jest niedostępny.
define('ADMIN_PASSWORD_HASH', 'REPLACE_WITH_BCRYPT_HASH');

// Dozwolony origin frontendu (GitHub Pages). Bez końcowego slasha.
define('ALLOWED_ORIGIN', 'https://REPLACE_WITH_YOUR_GITHUB_PAGES_ORIGIN');

// Ścieżka do pliku JSON z danymi uczestników.
define('DATA_FILE', __DIR__ . '/../storage/entries.json');

// Nazwa sesji PHP dla panelu admina.
define('SESSION_NAME', 'rogra_admin');

// Maksymalna długość pola imię i nazwisko (znaki).
define('FULL_NAME_MAX_LEN', 120);

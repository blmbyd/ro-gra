# Co piszczy w trawie w naszym parku 🌿

Prosta aplikacja webowa do gry terenowej na festyn. Użytkownicy skanują kody QR ukryte w parku i odkrywają 7 kart z ciekawostkami o parkowych stworzeniach. Po zebraniu wszystkich kart otrzymują unikalny kod finałowy.

## Losowanie nagród i odbiór upominków

- Zabawa odbywa się podczas festynu w parku w godzinach **13:00–17:00**.
- Po zebraniu wszystkich 7 kart uczestnik zgłasza się do **Rady Osiedla**, aby odebrać upominek.
- Losowanie głównej nagrody odbywa się na **scenie między 16:00 a 16:30**.

---

## Struktura projektu

```
index.html          – strona główna aplikacji
style.css           – style (mobile-first)
app.js              – logika: karty, localStorage, kody QR, kod finałowy, integracja API
img/                – zdjęcia (podmień przed wdrożeniem)
  mapa.jpg          – mapa parku (opcjonalna)
  card-1.jpg … card-7.jpg
README.md
backend-php/        – backend urny (wdrażany oddzielnie przez FTP, nie na GitHub Pages)
  config/
    config.php      – konfiguracja: hasło admina (hash), origin GH Pages, ścieżka do JSON
  api/
    _helpers.php    – funkcje pomocnicze: CORS, JSON read/write, odpowiedzi
    submit.php      – POST: rejestracja kodu finałowego
    update-name.php – POST: zapis imienia i nazwiska uczestnika
  admin/
    index.php       – panel administracyjny: lista zgłoszeń widoczna publicznie, akcje (edycja/usuwanie) wymagał logowania
  storage/
    .htaccess       – blokada bezpośredniego dostępu HTTP do katalogu
    entries.json    – dane uczestników (tworzony automatycznie przy pierwszym zapisie)
```

---

## Uruchomienie lokalne

Otwórz `index.html` bezpośrednio w przeglądarce **lub** uruchom dowolny serwer HTTP, np.:

```bash
# Python 3
python -m http.server 8080
# następnie otwórz http://localhost:8080
```

Aby przetestować skanowanie QR, dodaj parametr `q` do URL:

```
http://localhost:8080/?q=AB3K7
```

---

## Publikacja na GitHub Pages

1. Wejdź w ustawienia repozytorium → **Settings → Pages**.
2. W sekcji *Source* wybierz gałąź `main` i katalog `/ (root)`.
3. Kliknij **Save**.
4. Po chwili aplikacja będzie dostępna pod adresem:
   `https://<użytkownik>.github.io/<repozytorium>/`

Kody QR powinny kierować na URL w formacie:

```
https://<użytkownik>.github.io/<repozytorium>/?q=<TOKEN>
```

---

## Tokeny QR kart (dane demonstracyjne)

| Karta | Stworzenie          | Token   |
|-------|---------------------|---------|
| 1     | Jeż europejski      | AB3K7   |
| 2     | Biedronka           | QR2NP   |
| 3     | Wróbel domowy       | XH4WM   |
| 4     | Żaba trawna         | G9LT6   |
| 5     | Motyl rusałka pawik | C4JVZ   |
| 6     | Trzmiel ziemny      | B7NYU   |
| 7     | Mrówka rudnica      | M3RGK   |

> **Przed wdrożeniem** wygeneruj nowe, tajne tokeny (5 znaków z alfabetu `ABCDEFGHJKLMNPQRSTUVWXYZ2346789`) i zaktualizuj tablicę `CARDS` w pliku `app.js`.

---

## Podmiana treści

Wszystkie dane kart są zdefiniowane w tablicy `CARDS` na początku pliku `app.js`:

```js
const CARDS = [
  {
    id: 1,
    token: 'AB3K7',       // ← zmień na docelowy token QR
    title: 'Jeż europejski',
    desc: 'Ciekawostka…', // ← zmień opis
    image: 'img/card-1.jpg'     // ← podmień plik w img/
  },
  // ...
];
```

Aby podmienić mapę, umieść plik `img/mapa.jpg` w repozytorium.

---

## Tajne akcje dla organizatora

Aplikacja obsługuje dwa ukryte parametry URL przeznaczone dla organizatora lub do testowania. Parametr `admin` ma priorytet nad parametrem `q` – jeśli oba są obecne w URL, akcja administracyjna wygrywa.

### Reset postępu

Czyści zapisane odkrycia i kod finałowy. Gra wraca do stanu 0/7.

```
https://<adres-aplikacji>/?admin=reset
```

### Odsłonięcie wszystkich kart

Odkrywa wszystkie 7 kart i zawsze generuje nowy kod finałowy. Przydatne do demonstracji przed festynem.

```
https://<adres-aplikacji>/?admin=reveal-all
```

W obu przypadkach parametr `admin` jest automatycznie usuwany z paska adresu po wykonaniu akcji.

---

## Backend urny – rejestracja uczestników

Katalog `backend-php/` zawiera osobny backend PHP do zbierania zgłoszeń. Działa na innym hostingu niż GitHub Pages i komunikuje się z frontendem przez HTTPS API. Frontend wysyła kod finałowy automatycznie po zebraniu wszystkich 7 kart, a uczestnik może opcjonalnie wpisać imię i nazwisko w ekranie końcowym.

### Wymagania hostingu PHP

- PHP 8.0 lub nowszy
- Możliwość zapisu pliku w katalogu `storage/` (uprawnienia np. 755 lub 775)
- HTTPS (wymagane przez przeglądarkę przy wywołaniach z GitHub Pages)

### Krok 1 – Wgraj pliki PHP na serwer przez FTP

Wgraj **wyłącznie zawartość katalogu `backend-php/`** na serwer PHP. Nie wgrywaj całego repo.

Przykładowa struktura na serwerze:
```
public_html/              (lub inny webroot)
  config/
    config.php
  api/
    _helpers.php
    submit.php
    update-name.php
  admin/
    index.php
  storage/
    .htaccess
```

### Krok 2 – Ustaw hasło administratora

Wygeneruj hash hasła poleceniem:

```bash
php -r "echo password_hash('TWOJE_HASLO', PASSWORD_BCRYPT);"
```

Wklej wynik do pliku `config/config.php` jako wartość stałej `ADMIN_PASSWORD_HASH`.

### Krok 3 – Ustaw origin GitHub Pages

W pliku `config/config.php` zmień wartość `ALLOWED_ORIGIN` na dokładny adres swojej aplikacji na GitHub Pages, np.:

```php
define('ALLOWED_ORIGIN', 'https://twoj-login.github.io');
```

Bez końcowego slasha. Bez tej zmiany przeglądarka zablokuje zapytania CORS z frontendu.

### Krok 4 – Ustaw adres API w frontendzie

W pliku `app.js` znajdź stałą `API_BASE_URL` i wpisz adres serwera PHP (bez końcowego slasha):

```js
const API_BASE_URL = 'https://twoj-serwer.pl';
```

Potem zrób `git push` – frontend na GitHub Pages zacznie wysyłać zgłoszenia do API.

### Panel administracyjny

Panel jest dostępny bezpośrednio pod adresem serwera PHP, np.:

```
https://twoj-serwer.pl/admin/
```

Nie jest linkowany ani opisany publicznie.

**Widok publiczny (bez logowania):** lista wszystkich zgłoszeń z filtrowaniem i sortowaniem, statystyki oraz formularz logowania. Brak możliwości modyfikacji danych.

**Widok administracyjny (po zalogowaniu):** dodatkowo dostępne przyciski edycji i usuwania wpisów, formularz zmiany statusu oraz przycisk usunięcia wszystkich zgłoszeń. Status wpisu: **Nowe** / **Odebrane** / **Nieprawidłowe**.

### Dane uczestników

Wszystkie zgłoszenia są zapisywane w pliku `storage/entries.json`. Każdy wpis zawiera:

| Pole         | Opis                                      |
|--------------|-------------------------------------------|
| `final_code` | Kod finałowy (klucz główny, np. `1234-AB`) |
| `full_name`  | Imię i nazwisko (opcjonalne)              |
| `status`     | `new` / `claimed` / `invalid`             |
| `created_at` | Data pierwszego zgłoszenia (ISO 8601)     |
| `updated_at` | Data ostatniej aktualizacji               |

### Wdrożenie – podsumowanie

| Cel               | Jak                                    |
|-------------------|----------------------------------------|
| Frontend          | `git push` → GitHub Pages automatycznie |
| Backend PHP       | FTP – tylko katalog `backend-php/`     |
| Konfiguracja API  | Zmień `API_BASE_URL` w `app.js`        |
| Hasło admina      | `ADMIN_PASSWORD_HASH` w `config.php`   |

---

## Reset stanu przez konsolę (alternatywa)

Stan gry zapisany jest w `localStorage` przeglądarki. Aby go wyczyścić ręcznie:

1. Otwórz *Narzędzia deweloperskie* (F12) → zakładka **Application** → **Local Storage**.
2. Usuń klucze `rogra_discovered` i `rogra_final_code`.

Lub wklej w konsoli przeglądarki:

```js
localStorage.removeItem('rogra_discovered');
localStorage.removeItem('rogra_final_code');
location.reload();
```

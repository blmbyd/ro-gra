# Co piszczy w trawie w naszym parku 🌿

Prosta aplikacja webowa do gry terenowej na festyn. Użytkownicy skanują kody QR ukryte w parku i odkrywają 7 kart z ciekawostkami o parkowych stworzeniach. Po zebraniu wszystkich kart otrzymują unikalny kod finałowy.

---

## Struktura projektu

```
index.html     – strona główna aplikacji
style.css      – style (mobile-first)
app.js         – logika: karty, localStorage, kody QR, kod finałowy
images/        – zdjęcia (podmień przed wdrożeniem)
  map.jpg      – mapa parku (opcjonalna)
  card-1.jpg   – zdjęcie karty 1
  card-2.jpg   – zdjęcie karty 2
  ...
  card-7.jpg   – zdjęcie karty 7
README.md
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
    image: 'images/card-1.jpg', // ← podmień plik w images/
    emoji: '🦔'           // ← emoji jako fallback gdy brak zdjęcia
  },
  // ...
];
```

Aby podmienić mapę, umieść plik `images/map.jpg` w repozytorium.

---

## Tajne akcje dla organizatora / testów

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

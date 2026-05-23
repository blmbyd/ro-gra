/* Data i godzina startu gry */
const GAME_START = new Date('2026-05-24T13:00:00+02:00').getTime();

/* =============================================
   DANE KART
   Aby podmienić treści: edytuj tablicę CARDS.
   Każda karta ma:
     id      – unikalny numer (1-7)
     token   – 5-znakowy token QR (alfabet: ABCDEFGHJKLMNPQRSTUVWXYZ2346789)
     title   – nazwa stworzenia
     desc    – ciekawostka
     image   – ścieżka do zdjęcia (względna od index.html)
     emoji   – wyświetlany gdy brak zdjęcia
   ============================================= */
const CARDS = [
  {
    id: 1,
    token: 'AB3K7',
    title: 'Zagraj w Szachy',
    desc: 'Szachy to jedna z najstarszych gier na świecie – ma ponad 1500 lat! Dawno temu zamiast pionków na planszy stały figurki prawdziwych słoni bojowych i rydwanów.',
    task: 'Policz, ile małych kwadracików (pól) znajduje się na całej szachownicy. Podpowiedź: jest ich więcej niż 50!',
    image: 'img/card-1.jpg',
    emoji: '♟️'
  },
  {
    id: 2,
    token: 'QR2NP',
    title: 'Ścieżka dydaktyczna',
    desc: 'Kiedy kładziesz się spać, w parku zaczyna się wielka impreza! Na tej tablicy ukryły się zwierzęta, które uwielbiają ciemność. Jedno z nich ma tysiące igieł, a w nocy drepcze po parku i poluje na ślimaki.',
    task: 'W jak małą szczelinę (ile centymetrów) potrafi wcisnąć się najmniejszy nietoperz?',
    image: 'img/card-2.jpg',
    emoji: '🦔'
  },
  {
    id: 3,
    token: 'XH4WM',
    title: 'Wybieg dla psów',
    desc: 'Psy potrafią rozpoznać Twój nastrój po samym zapachu! Ich nosy są tak niesamowite, że wyczuwają nawet to, czy jesteś wesoły, czy zmęczony.',
    task: 'Wyobraź sobie, że biegniesz po torze przeszkód tak szybko jak zwinny piesek. Zrób 5 pajacyków na start!',
    image: 'img/card-3.jpg',
    emoji: '�'
  },
  {
    id: 4,
    token: 'G9LT6',
    title: 'Wioska Smerfów',
    desc: 'Smerfy mają dokładnie po 3 jabłka wzrostu i mieszkają w domkach z grzybów. Ten niebieski stworek na pniu pilnuje wejścia do ich leśnego świata!',
    task: 'Zawołaj głośno: „Jak ja nie cierpię smerfów!” głosem Gargamela.',
    image: 'img/card-4.jpg',
    emoji: '🍄'
  },
  {
    id: 5,
    token: 'C4JVZ',
    title: 'Dąb "Skaut"',
    desc: 'Ten dąb to żywy pomnik! Został posadzony na cześć harcerzy z drużyny „Zielona Siódemka”, która powstała aż 100 lat temu. Harcerze (nazywani też skautami) uwielbiają przyrodę, potrafią rozpalać ogniska bez zapałek i posługują się tajnymi szyframi.',
    task: 'Odszukaj pod drzewem pamiątkowy kamień. Jaki numer ma ukryta na nim harcerska drużyna?',
    image: 'img/card-5.jpg',
    emoji: '🌳'
  },
  {
    id: 6,
    token: 'B7NYU',
    title: 'Wiewiórka Baśka',
    desc: 'Wiewiórki to najlepsi leśny ogrodnicy. Często zakopują orzechy w ziemi i zapominają, gdzie je schowały – dzięki temu wyrastają z nich nowe drzewa!',
    task: 'Rozejrzyj się uważnie dookoła. Czy gdzieś na gałęzi albo na trawie nie błyska ruda kita Basi?',
    image: 'img/card-6.jpg',
    emoji: '�️'
  },
  {
    id: 7,
    token: 'M3RGK',
    title: 'Hotel dla owadów',
    desc: 'Ten niezwykły domek z gliny, drewna i rurek to schronisko dla dzikich pszczół i innych pomocnych robaczków. Nie robią one miodu, ale za to ciężko pracują, zapylając kwiaty i drzewa w parku.',
    task: 'Podejdź cicho i sprawdź, czy w małych otworach widać już jakichś sypiających lokatorów. Pamiętaj – nie hałasuj, trwa doba hotelowa!',
    image: 'img/card-7.jpg',
    emoji: '�'
  }
];

/* =============================================
   STAŁE
   ============================================= */
const TOTAL = CARDS.length; // 7
const LS_DISCOVERED = 'rogra_discovered';  // klucz w localStorage
const LS_FINAL_CODE = 'rogra_final_code';  // klucz w localStorage

// Alfabet liter do kodu finałowego
const FINAL_LETTER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Zwraca true gdy gra już wystartowała. */
function isGameStarted() {
  return Date.now() >= GAME_START;
}

/** Formatuje pozostały czas do startu jako HH:MM:SS. */
function formatCountdown(ms) {
  if (ms <= 0) return '0:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = n => String(n).padStart(2, '0');
  return `${h}:${pad(m)}:${pad(s)}`;
}

let countdownInterval = null;

/** Uruchamia odliczanie w #countdown-banner. Po wybiciu godziny przeładowuje stronę. */
function startCountdown() {
  const banner = document.getElementById('countdown-banner');
  const timerEl = document.getElementById('countdown-timer');
  if (!banner || !timerEl) return;
  banner.classList.remove('hidden');

  function tick() {
    const remaining = GAME_START - Date.now();
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      window.location.reload();
      return;
    }
    timerEl.textContent = formatCountdown(remaining);
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

/* =============================================
   POMOCNICZE – localStorage
   ============================================= */

/** Zwraca tablicę ID odkrytych kart (liczby). */
function getDiscovered() {
  try {
    return JSON.parse(localStorage.getItem(LS_DISCOVERED) || '[]');
  } catch {
    return [];
  }
}

/** Zapisuje tablicę ID odkrytych kart. Przed startem gry zapis jest pomijany, chyba że force=true. */
function saveDiscovered(ids, force = false) {
  if (!force && !isGameStarted()) return;
  localStorage.setItem(LS_DISCOVERED, JSON.stringify(ids));
}

/** Zwraca zapisany kod finałowy lub null. */
function getFinalCode() {
  return localStorage.getItem(LS_FINAL_CODE) || null;
}

/** Zapisuje kod finałowy. Przed startem gry zapis jest pomijany, chyba że force=true. */
function saveFinalCode(code, force = false) {
  if (!force && !isGameStarted()) return;
  localStorage.setItem(LS_FINAL_CODE, code);
}

/* =============================================
   GENEROWANIE KODU FINAŁOWEGO
   Format: 4 cyfry (1111–9999) + myślnik + 2 duże litery
   ============================================= */
function generateFinalCode() {
  const num = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
  const l1 = FINAL_LETTER_ALPHABET[Math.floor(Math.random() * FINAL_LETTER_ALPHABET.length)];
  const l2 = FINAL_LETTER_ALPHABET[Math.floor(Math.random() * FINAL_LETTER_ALPHABET.length)];
  return `${num}-${l1}${l2}`;
}

/* =============================================
   TOAST
   ============================================= */
let toastTimer = null;

function showToast(message, type = 'info', duration = 3500) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

/* =============================================
   MODAL – szczegóły karty
   ============================================= */
function openCardModal(card) {
  const modal = document.getElementById('card-modal');
  const img = document.getElementById('modal-img');
  const title = document.getElementById('modal-title');
  const desc = document.getElementById('modal-desc');
  const task = document.getElementById('modal-task');

  img.src = card.image;
  img.alt = card.title;
  img.onerror = () => {
    img.style.display = 'none';
  };
  title.textContent = card.title;
  desc.textContent = card.desc;
  task.textContent = card.task || '';

  modal.classList.remove('hidden');
}

function closeCardModal() {
  document.getElementById('card-modal').classList.add('hidden');
}

/* =============================================
   EKRAN KOŃCOWY
   ============================================= */
function showFinalScreen(code) {
  document.getElementById('final-code').textContent = code;
  document.getElementById('final-screen').classList.remove('hidden');
}

function closeFinalScreen() {
  document.getElementById('final-screen').classList.add('hidden');
}

function showFinalBanner(code) {
  document.getElementById('final-banner-code').textContent = code;
  document.getElementById('final-banner').classList.remove('hidden');
}

/* =============================================
   ZOOM MAPY
   ============================================= */
function initMapZoom() {
  const mapImg = document.getElementById('park-map');
  const modal  = document.getElementById('map-modal');
  const closeBtn = document.getElementById('map-modal-close');

  mapImg.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', e => {
    e.stopPropagation();
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });
}

/* =============================================
   RENDEROWANIE KART
   ============================================= */
function renderCards(discovered, newlyDiscoveredId = null) {
  const grid = document.getElementById('cards-grid');
  grid.innerHTML = '';

  CARDS.forEach(card => {
    const isDiscovered = discovered.includes(card.id);
    const isNew = card.id === newlyDiscoveredId;

    const el = document.createElement('div');
    el.className = `card ${isDiscovered ? 'discovered' : 'undiscovered'}`;
    el.dataset.cardId = card.id;

    if (isDiscovered) {
      el.innerHTML = `
        <div class="card-img-wrap">
          <img src="${card.image}" alt="${card.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div class="card-img-placeholder" style="display:none">${card.emoji}</div>
        </div>
        <div class="card-body">
          <div class="card-title">${card.title}</div>
          <div class="card-desc">${card.desc}</div>
        </div>
        ${isNew ? '<div class="badge-new">Nowa!</div>' : ''}
      `;
      el.addEventListener('click', () => openCardModal(card));
    } else {
      el.innerHTML = `
        <div class="card-placeholder-icon">❓</div>
        <div class="card-placeholder-num">Karta ${card.id}</div>
      `;
    }

    grid.appendChild(el);
  });
}

/* =============================================
   AKTUALIZACJA LICZNIKA POSTĘPU
   ============================================= */
function updateProgress(count) {
  document.getElementById('count').textContent = count;
  document.getElementById('progress-bar').style.width = `${(count / TOTAL) * 100}%`;
}

/* =============================================
   OBSŁUGA PARAMETRU ?q=TOKEN
   Zwraca { status, card } gdzie status to:
     'ok'       – karta odkryta po raz pierwszy
     'already'  – karta już była odkryta
     'invalid'  – nieznany token
     'none'     – brak parametru q
   ============================================= */
function handleQrParam() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('q');

  // Usuń parametr z URL bez przeładowania strony
  if (token !== null) {
    const cleanUrl = window.location.pathname + window.location.hash;
    history.replaceState(null, '', cleanUrl);
  }

  if (!token) return { status: 'none', card: null };

  if (!isGameStarted()) return { status: 'locked', card: null };

  const card = CARDS.find(c => c.token === token.toUpperCase());
  if (!card) return { status: 'invalid', card: null };

  const discovered = getDiscovered();
  if (discovered.includes(card.id)) return { status: 'already', card };

  // Odkryj kartę
  discovered.push(card.id);
  saveDiscovered(discovered);
  return { status: 'ok', card };
}

/* =============================================
   OBSŁUGA TAJNEGO PARAMETRU ?admin=AKCJA
   Zwraca: 'reset' | 'reveal-all' | 'none'
   Akcje:
     reset      – czyści postęp i kod finałowy
     reveal-all – odkrywa wszystkie karty, generuje nowy kod
   ============================================= */
function handleAdminParam() {
  const params = new URLSearchParams(window.location.search);
  const action = params.get('admin');

  if (!action) return 'none';

  // Usuń parametr z URL bez przeładowania strony
  const cleanUrl = window.location.pathname + window.location.hash;
  history.replaceState(null, '', cleanUrl);

  if (action === 'reset') {
    localStorage.removeItem(LS_DISCOVERED);
    localStorage.removeItem(LS_FINAL_CODE);
    return 'reset';
  }

  if (action === 'reveal-all') {
    saveDiscovered(CARDS.map(c => c.id), true);
    saveFinalCode(generateFinalCode(), true);
    return 'reveal-all';
  }

  return 'none';
}

/* =============================================
   INICJALIZACJA
   ============================================= */
function init() {
  // 1. Obsłuż tajny parametr administracyjny (priorytet nad parametrem QR)
  const adminAction = handleAdminParam();

  // 2. Obsłuż parametr QR (pomijany gdy wykonano akcję administracyjną)
  const { status, card } = adminAction === 'none' ? handleQrParam() : { status: 'none', card: null };

  // 3. Odczytaj stan
  const discovered = getDiscovered();
  const count = discovered.length;

  // 4. Renderuj UI
  renderCards(discovered, status === 'ok' ? card.id : null);
  updateProgress(count);

  // 5. Pokaż komunikat zależny od wykonanej akcji
  if (adminAction === 'reset') {
    showToast('Postęp zresetowany.', 'info', 3500);
  } else if (adminAction === 'reveal-all') {
    showToast('Wszystkie karty odsłonięte.', 'success', 3500);
  } else if (status === 'ok') {
    showToast(`✅ Odkryto nową kartę: ${card.title}!`, 'success', 4000);
    openCardModal(card);
  } else if (status === 'already') {
    showToast(`ℹ️ Karta "${card.title}" była już odkryta.`, 'info', 3500);
  } else if (status === 'invalid') {
    showToast('❌ Nieznany kod QR. Spróbuj zeskanować ponownie.', 'error', 4000);
  } else if (status === 'locked') {
    showToast('⏳ Gra startuje 24 maja o 13:00. Wróć później!', 'info', 5000);
  }

  // 6. Jeśli wszystkie odkryte – generuj lub pokaż kod finałowy
  if (count === TOTAL) {
    let code = getFinalCode();
    if (!code) {
      code = generateFinalCode();
      saveFinalCode(code);
    }
    showFinalBanner(code);
    // Pokaż ekran końcowy z krótkim opóźnieniem (żeby modal karty zdążył się zamknąć)
    const delay = (adminAction === 'reveal-all' || status === 'ok') ? 1800 : 400;
    setTimeout(() => showFinalScreen(code), delay);
  }

  // 6. Pokaż mapę lub placeholder
  const mapImg = document.getElementById('park-map');
  const mapPlaceholder = document.getElementById('map-placeholder');
  mapImg.addEventListener('error', () => {
    mapImg.style.display = 'none';
    mapPlaceholder.style.display = 'flex';
  });
  // Jeśli obraz już jest w cache i zdarzenie error nie odpali
  if (mapImg.complete && mapImg.naturalWidth === 0) {
    mapImg.style.display = 'none';
    mapPlaceholder.style.display = 'flex';
  }

  // 8. Przed startem gry: podmień mapę i uruchom odliczanie
  if (!isGameStarted()) {
    const preStartSrc = 'img/mapa-start.jpg';
    mapImg.src = preStartSrc;
    document.getElementById('map-modal-img').src = preStartSrc;
    startCountdown();
  }

  // 7. Zoom mapy
  initMapZoom();
}

/* =============================================
   RĘCZNE WPISYWANIE KODU
   ============================================= */
function handleManualToken(rawToken) {
  const token = (rawToken || '').trim().toUpperCase();

  if (!token) {
    showToast('Wpisz kod ze stanowiska.', 'error', 3000);
    return;
  }

  if (!isGameStarted()) {
    showToast('Gra startuje 24 maja o 13:00. Wróc pozniej!', 'info', 5000);
    return;
  }

  const card = CARDS.find(c => c.token === token);
  if (!card) {
    showToast('Nieznany kod. Sprawdz, czy wpisales go dokladnie.', 'error', 4000);
    return;
  }

  const discovered = getDiscovered();
  if (discovered.includes(card.id)) {
    showToast(`Karta "${card.title}" byla juz odkryta.`, 'info', 3500);
    openCardModal(card);
    return;
  }

  discovered.push(card.id);
  saveDiscovered(discovered);

  renderCards(discovered, card.id);
  updateProgress(discovered.length);
  showToast(`Odkryto nowa karte: ${card.title}!`, 'success', 4000);
  openCardModal(card);

  if (discovered.length === TOTAL) {
    let code = getFinalCode();
    if (!code) {
      code = generateFinalCode();
      saveFinalCode(code);
    }
    showFinalBanner(code);
    setTimeout(() => showFinalScreen(code), 1800);
  }
}

/* =============================================
   OBSŁUGA ZDARZEŃ
   ============================================= */
document.getElementById('modal-close').addEventListener('click', closeCardModal);
document.getElementById('modal-close-bottom').addEventListener('click', closeCardModal);
document.getElementById('card-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('card-modal')) closeCardModal();
});

document.getElementById('final-close').addEventListener('click', closeFinalScreen);

document.getElementById('manual-code-submit').addEventListener('click', () => {
  const input = document.getElementById('manual-code-input');
  handleManualToken(input.value);
  input.value = '';
});

document.getElementById('manual-code-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const input = document.getElementById('manual-code-input');
    handleManualToken(input.value);
    input.value = '';
  }
});

/* =============================================
   START
   ============================================= */
document.addEventListener('DOMContentLoaded', init);

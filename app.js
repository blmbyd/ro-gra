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
    desc: 'Jeż może mieć nawet 5000 kolców! Każdy kolec to zmodyfikowany włos. Kiedy jeż czuje zagrożenie, zwija się w kulkę i najeża kolce we wszystkich kierunkach.',
    task: 'Znajdź w parku roślinę lub krzew z kolcami. Czy potrafisz policzyć, ile ich ma na jednej gałązce?',
    image: 'img/card-1.jpg',
    emoji: '🦔'
  },
  {
    id: 2,
    token: 'QR2NP',
    title: 'Ścieżka dydaktyczna',
    desc: 'Liczba kropek na pancerzyku biedronki wskazuje jej gatunek, a nie wiek! Biedronka siedmiokropka zjada dziennie nawet 150 mszyc – jest prawdziwym sprzymierzeńcem ogrodników.',
    task: 'Poszukaj biedronki na pobliskich liściach lub kwiatach. Ile ma kropek? Czy to biedronka siedmiokropka?',
    image: 'img/card-2.jpg',
    emoji: '🐞'
  },
  {
    id: 3,
    token: 'XH4WM',
    title: 'Wybieg dla psów',
    desc: 'Wróble kąpią się w piasku, by pozbyć się pasożytów z piór. Potrafią zapamiętać twarze ludzkie i rozróżniać przyjaznych ludzi od tych, którym nie ufają.',
    task: 'Stań nieruchomo jak posąg przez 30 sekund i obserwuj, ile wróbli uda Ci się zauważyć w zasięgu wzroku.',
    image: 'img/card-3.jpg',
    emoji: '🐦'
  },
  {
    id: 4,
    token: 'G9LT6',
    title: 'Wioska Smerfów',
    desc: 'Żaba trawna może skakać na odległość do metra – to ponad 20-krotność jej własnego ciała! Zimę spędza w letargu pod ziemią lub na dnie stawów.',
    task: 'Zmierz swój wzrost i oblicz, ile razy musisz skakać, by pokonać 20-krotność swojej długości – tak jak żaba!',
    image: 'img/card-4.jpg',
    emoji: '🐸'
  },
  {
    id: 5,
    token: 'C4JVZ',
    title: 'Dąb "Skaut"',
    desc: 'Wzór na skrzydłach rusałki pawik naśladuje oczy ptaka drapieżnego. Skrzydła motyla są pokryte tysiącami łuseczek, które tworzą te przepiękne wzory.',
    task: 'Rozejrzyj się – czy widzisz jakiegoś motyla? Spróbuj cicho się zbliżyć i narysować go z pamięci po powrocie do domu.',
    image: 'img/card-5.jpg',
    emoji: '🦋'
  },
  {
    id: 6,
    token: 'B7NYU',
    title: 'Wiewiórka Baśka',
    desc: 'Trzmiele potrafią latać nawet przy temperaturze 5°C, gdy pszczoły miodne jeszcze siedzą w ulu. Ogrzewają ciało wibrując mięśniami skrzydłowymi jak silnikiem.',
    task: 'Znajdź kwitnący kwiatek i odczekaj 2 minuty w ciszy. Czy pojawi się trzmiel lub pszczoła?',
    image: 'img/card-6.jpg',
    emoji: '🐝'
  },
  {
    id: 7,
    token: 'M3RGK',
    title: 'Hotel dla owadów',
    desc: 'Jedno mrowisko rudnicy może liczyć nawet milion mieszkańców! Mrówki komunikują się za pomocą feromonów – chemicznych sygnałów zapachowych – i razem mogą przenosić ciężary 50-krotnie przekraczające wagę jednej mrówki.',
    task: 'Znajdź szlak mrówek i policz, ile mrówek przejdzie przez wybrany punkt w ciągu 10 sekund.',
    image: 'img/card-7.jpg',
    emoji: '🐜'
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

/** Zapisuje tablicę ID odkrytych kart. */
function saveDiscovered(ids) {
  localStorage.setItem(LS_DISCOVERED, JSON.stringify(ids));
}

/** Zwraca zapisany kod finałowy lub null. */
function getFinalCode() {
  return localStorage.getItem(LS_FINAL_CODE) || null;
}

/** Zapisuje kod finałowy. */
function saveFinalCode(code) {
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
    saveDiscovered(CARDS.map(c => c.id));
    saveFinalCode(generateFinalCode());
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

  // 7. Zoom mapy
  initMapZoom();
}

/* =============================================
   OBSŁUGA ZDARZEŃ
   ============================================= */
document.getElementById('modal-close').addEventListener('click', closeCardModal);
document.getElementById('card-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('card-modal')) closeCardModal();
});

document.getElementById('final-close').addEventListener('click', closeFinalScreen);

/* =============================================
   START
   ============================================= */
document.addEventListener('DOMContentLoaded', init);

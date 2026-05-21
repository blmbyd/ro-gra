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
    title: 'Jeż europejski',
    desc: 'Jeż może mieć nawet 5000 kolców! Każdy kolec to zmodyfikowany włos. Kiedy jeż czuje zagrożenie, zwija się w kulkę i najeża kolce we wszystkich kierunkach.',
    image: 'images/card-1.jpg',
    emoji: '🦔'
  },
  {
    id: 2,
    token: 'QR2NP',
    title: 'Biedronka siedmiokropka',
    desc: 'Liczba kropek na pancerzyku biedronki wskazuje jej gatunek, a nie wiek! Biedronka siedmiokropka zjada dziennie nawet 150 mszyc – jest prawdziwym sprzymierzeńcem ogrodników.',
    image: 'images/card-2.jpg',
    emoji: '🐞'
  },
  {
    id: 3,
    token: 'XH4WM',
    title: 'Wróbel domowy',
    desc: 'Wróble kąpią się w piasku, by pozbyć się pasożytów z piór. Potrafią zapamiętać twarze ludzkie i rozróżniać przyjaznych ludzi od tych, którym nie ufają.',
    image: 'images/card-3.jpg',
    emoji: '🐦'
  },
  {
    id: 4,
    token: 'G9LT6',
    title: 'Żaba trawna',
    desc: 'Żaba trawna może skakać na odległość do metra – to ponad 20-krotność jej własnego ciała! Zimę spędza w letargu pod ziemią lub na dnie stawów.',
    image: 'images/card-4.jpg',
    emoji: '🐸'
  },
  {
    id: 5,
    token: 'C4JVZ',
    title: 'Motyl rusałka pawik',
    desc: 'Wzór na skrzydłach rusałki pawik naśladuje oczy ptaka drapieżnego. Skrzydła motyla są pokryte tysiącami łuseczek, które tworzą te przepiękne wzory.',
    image: 'images/card-5.jpg',
    emoji: '🦋'
  },
  {
    id: 6,
    token: 'B7NYU',
    title: 'Trzmiel ziemny',
    desc: 'Trzmiele potrafią latać nawet przy temperaturze 5°C, gdy pszczoły miodne jeszcze siedzą w ulu. Ogrzewają ciało wibrując mięśniami skrzydłowymi jak silnikiem.',
    image: 'images/card-6.jpg',
    emoji: '🐝'
  },
  {
    id: 7,
    token: 'M3RGK',
    title: 'Mrówka rudnica',
    desc: 'Jedno mrowisko rudnicy może liczyć nawet milion mieszkańców! Mrówki komunikują się za pomocą feromonów – chemicznych sygnałów zapachowych – i razem mogą przenosić ciężary 50-krotnie przekraczające wagę jednej mrówki.',
    image: 'images/card-7.jpg',
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

  img.src = card.image;
  img.alt = card.title;
  img.onerror = () => {
    img.style.display = 'none';
  };
  title.textContent = card.title;
  desc.textContent = card.desc;

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
   INICJALIZACJA
   ============================================= */
function init() {
  // 1. Obsłuż parametr QR
  const { status, card } = handleQrParam();

  // 2. Odczytaj stan
  const discovered = getDiscovered();
  const count = discovered.length;

  // 3. Renderuj UI
  renderCards(discovered, status === 'ok' ? card.id : null);
  updateProgress(count);

  // 4. Pokaż komunikat zależny od statusu QR
  if (status === 'ok') {
    showToast(`✅ Odkryto nową kartę: ${card.title}!`, 'success', 4000);
    openCardModal(card);
  } else if (status === 'already') {
    showToast(`ℹ️ Karta "${card.title}" była już odkryta.`, 'info', 3500);
  } else if (status === 'invalid') {
    showToast('❌ Nieznany kod QR. Spróbuj zeskanować ponownie.', 'error', 4000);
  }

  // 5. Jeśli wszystkie odkryte – generuj lub pokaż kod finałowy
  if (count === TOTAL) {
    let code = getFinalCode();
    if (!code) {
      code = generateFinalCode();
      saveFinalCode(code);
    }
    // Pokaż ekran końcowy z krótkim opóźnieniem (żeby modal karty zdążył się zamknąć)
    setTimeout(() => showFinalScreen(code), status === 'ok' ? 1800 : 400);
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

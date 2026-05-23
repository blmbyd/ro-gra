<?php
/**
 * Panel administracyjny urny.
 * Dostęp tylko przez bezpośredni adres serwera PHP – brak CORS, brak linku z frontendu.
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../api/_helpers.php';

// Konfiguracja sesji – przed session_start()
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', '1');

session_name(SESSION_NAME);
session_start();

// Token CSRF – generowany raz na sesję
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Inicjalizacja limitu prób logowania
if (!isset($_SESSION['login_attempts'])) {
    $_SESSION['login_attempts']    = 0;
    $_SESSION['login_locked_until'] = 0;
}

$error_msg   = '';
$success_msg = '';

/* =============================================
   OBSŁUGA AKCJI POST
   ============================================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    // Logowanie – nie wymaga CSRF (użytkownik jeszcze nie jest uwierzytelniony)
    if ($action === 'login') {
        $locked_until = (int) $_SESSION['login_locked_until'];
        if (time() < $locked_until) {
            $wait = $locked_until - time();
            $error_msg = "Zbyt wiele nieudanych prób. Poczekaj $wait sekund.";
        } else {
            $password = $_POST['password'] ?? '';
            if (password_verify($password, ADMIN_PASSWORD_HASH)) {
                $_SESSION['login_attempts']    = 0;
                $_SESSION['login_locked_until'] = 0;
                session_regenerate_id(true);
                $_SESSION['admin_logged_in'] = true;
                $_SESSION['csrf_token']      = bin2hex(random_bytes(32));
                header('Location: ' . $_SERVER['PHP_SELF']);
                exit;
            } else {
                $_SESSION['login_attempts']++;
                if ($_SESSION['login_attempts'] >= 5) {
                    $_SESSION['login_locked_until'] = time() + 60;
                    $_SESSION['login_attempts']     = 0;
                    $error_msg = 'Zbyt wiele nieudanych prób. Poczekaj 60 sekund.';
                } else {
                    $remaining = 5 - $_SESSION['login_attempts'];
                    $error_msg = "Nieprawidłowe hasło. Pozostało prób: $remaining.";
                }
            }
        }

    // Wylogowanie
    } elseif ($action === 'logout') {
        session_unset();
        session_destroy();
        header('Location: ' . $_SERVER['PHP_SELF']);
        exit;

    // Akcje chronione – wymagają zalogowania i tokenu CSRF
    } elseif (isset($_SESSION['admin_logged_in'])) {
        $token = $_POST['csrf_token'] ?? '';
        if (!hash_equals($_SESSION['csrf_token'], $token)) {
            // Odśwież token po nieudanej weryfikacji
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            $error_msg = 'Nieprawidłowy token CSRF. Odśwież stronę i spróbuj ponownie.';
        } else {
            if ($action === 'delete') {
                $code = trim($_POST['final_code'] ?? '');
                if (preg_match('/^[0-9]{4}-[A-Z]{2}$/', $code)) {
                    $data = read_json();
                    if (isset($data[$code])) {
                        unset($data[$code]);
                        write_json($data);
                        header('Location: ' . $_SERVER['PHP_SELF'] . '?msg=' . urlencode("Wpis $code usunięty."));
                        exit;
                    }
                }
                $error_msg = 'Nie znaleziono wpisu do usunięcia.';

            } elseif ($action === 'edit') {
                $code        = trim($_POST['final_code'] ?? '');
                $full_name   = trim($_POST['full_name'] ?? '');
                $new_status  = $_POST['entry_status'] ?? 'new';
                $allowed_st  = ['new', 'claimed', 'invalid'];

                if (!in_array($new_status, $allowed_st, true)) {
                    $new_status = 'new';
                }
                if (preg_match('/^[0-9]{4}-[A-Z]{2}$/', $code)
                    && mb_strlen($full_name) <= FULL_NAME_MAX_LEN
                ) {
                    $data = read_json();
                    if (isset($data[$code])) {
                        $data[$code]['full_name']  = $full_name;
                        $data[$code]['status']     = $new_status;
                        $data[$code]['updated_at'] = date('c');
                        write_json($data);
                        header('Location: ' . $_SERVER['PHP_SELF'] . '?msg=' . urlencode("Wpis $code zaktualizowany."));
                        exit;
                    }
                }
                $error_msg = 'Nie udało się zapisać zmian.';

            } elseif ($action === 'delete_all') {
                write_json([]);
                header('Location: ' . $_SERVER['PHP_SELF'] . '?msg=' . urlencode('Wszystkie wpisy zostały usunięte.'));
                exit;
            }
        }
    }
}

/* =============================================
   PRZYGOTOWANIE DANYCH DO WYŚWIETLENIA
   ============================================= */

// Komunikat flash z GET po przekierowaniu
if (empty($success_msg) && isset($_GET['msg'])) {
    $success_msg = mb_substr(strip_tags($_GET['msg']), 0, 200);
}

$is_logged_in = isset($_SESSION['admin_logged_in']);
$entries      = [];
$filter       = '';
$sort         = 'created_at';
$sort_dir     = 'desc';
$allowed_sort = ['created_at', 'updated_at', 'full_name', 'final_code', 'status'];

// Edytowany wpis (gdy ?edit=CODE w URL) – ładowany tylko po zalogowaniu
$edit_entry = null;

$all_data   = read_json();
$entries    = array_values($all_data);

// Filtrowanie
$filter     = trim(strip_tags($_GET['q'] ?? ''));
$hide_empty = isset($_GET['hide_empty']);
if ($filter !== '') {
    $fl = mb_strtolower($filter);
    $entries = array_values(array_filter($entries, static function (array $e) use ($fl): bool {
        return strpos(mb_strtolower($e['final_code']), $fl) !== false
            || strpos(mb_strtolower($e['full_name']),  $fl) !== false;
    }));
}
if ($hide_empty) {
    $entries = array_values(array_filter($entries, static fn(array $e): bool => $e['full_name'] !== ''));
}

// Sortowanie
$sort     = in_array($_GET['sort'] ?? '', $allowed_sort, true) ? $_GET['sort'] : 'created_at';
$sort_dir = ($_GET['dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
usort($entries, static function (array $a, array $b) use ($sort): int {
    return strcmp((string)($a[$sort] ?? ''), (string)($b[$sort] ?? ''));
});
if ($sort_dir === 'desc') {
    $entries = array_reverse($entries);
}

// Wpis do edycji – dostępny tylko po zalogowaniu
if ($is_logged_in && isset($_GET['edit'])) {
    $edit_code = trim($_GET['edit']);
    if (preg_match('/^[0-9]{4}-[A-Z]{2}$/', $edit_code) && isset($all_data[$edit_code])) {
        $edit_entry = $all_data[$edit_code];
    }
}

// Statystyki (na podstawie nieprzefiltrowanych danych)
$total_entries  = count($all_data);
$with_name      = count(array_filter($all_data, static fn($e) => $e['full_name'] !== ''));
$claimed        = count(array_filter($all_data, static fn($e) => $e['status'] === 'claimed'));

$csrf = $_SESSION['csrf_token'];

/* =============================================
   HELPERY HTML
   ============================================= */
function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function sort_url(string $col, string $current_sort, string $current_dir, string $filter, bool $hide_empty = false): string
{
    $dir = ($col === $current_sort && $current_dir === 'asc') ? 'desc' : 'asc';
    $params = ['sort' => $col, 'dir' => $dir];
    if ($filter !== '') {
        $params['q'] = $filter;
    }
    if ($hide_empty) {
        $params['hide_empty'] = '1';
    }
    return '?' . http_build_query($params);
}

function sort_indicator(string $col, string $current_sort, string $current_dir): string
{
    if ($col !== $current_sort) {
        return '';
    }
    return $current_dir === 'asc' ? ' &uarr;' : ' &darr;';
}

function status_label(string $status): string
{
    return match ($status) {
        'claimed' => '<span class="badge badge-claimed">Odebrane</span>',
        'invalid' => '<span class="badge badge-invalid">Nieprawidłowe</span>',
        default   => '<span class="badge badge-new">Nowe</span>',
    };
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Panel – Urna</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f8; color: #1b1b1b; font-size: 15px; }
    a { color: #2d6a4f; text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Layout */
    .wrap { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1rem; }

    /* Logowanie */
    .login-wrap { max-width: 360px; margin: 5rem auto; background: #fff; border-radius: 10px; padding: 2rem; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
    .login-wrap h1 { font-size: 1.3rem; margin-bottom: 1.2rem; color: #2d6a4f; }
    .login-wrap label { display: block; font-size: 0.9rem; margin-bottom: 0.25rem; color: #555; }
    .login-wrap input[type=password] { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #ccc; border-radius: 7px; font-size: 1rem; margin-bottom: 1rem; }
    .login-wrap button { width: 100%; padding: 0.65rem; background: #2d6a4f; color: #fff; border: none; border-radius: 7px; font-size: 1rem; cursor: pointer; }
    .login-wrap button:hover { background: #40916c; }

    /* Header */
    .admin-header { display: flex; align-items: center; justify-content: space-between; background: #2d6a4f; color: #fff; padding: 0.8rem 1.5rem; }
    .admin-header h1 { font-size: 1.1rem; }
    .btn-sm { padding: 0.35rem 0.85rem; background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 0.85rem; cursor: pointer; }
    .btn-sm:hover { background: rgba(255,255,255,0.25); }
    .btn-sm-danger { background: rgba(220,53,69,0.75); border-color: rgba(220,53,69,0.5); }
    .btn-sm-danger:hover { background: rgba(220,53,69,1); }

    /* Komunikaty */
    .msg { padding: 0.6rem 1rem; border-radius: 7px; margin: 1rem 0; font-size: 0.9rem; }
    .msg.success { background: #d8f3dc; color: #2d6a4f; }
    .msg.error   { background: #fde8e8; color: #c0392b; }

    /* Statystyki */
    .stats { display: flex; gap: 1.5rem; margin: 1rem 0; flex-wrap: wrap; }
    .stat { background: #fff; border-radius: 8px; padding: 0.7rem 1.2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .stat-val { font-size: 1.6rem; font-weight: 700; color: #2d6a4f; }
    .stat-lbl { font-size: 0.75rem; color: #666; }

    /* Edycja wpisu */
    .edit-section { background: #fff; border: 2px solid #40916c; border-radius: 10px; padding: 1.2rem 1.5rem; margin: 1rem 0; }
    .edit-section h2 { font-size: 1rem; margin-bottom: 1rem; color: #2d6a4f; }
    .edit-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; margin-bottom: 0.75rem; }
    .edit-row label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; color: #555; min-width: 200px; }
    .edit-row input[type=text], .edit-row select { padding: 0.45rem 0.65rem; border: 1px solid #ccc; border-radius: 6px; font-size: 0.95rem; }
    .btn-save   { padding: 0.45rem 1.1rem; background: #2d6a4f; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
    .btn-save:hover { background: #40916c; }
    .btn-cancel { padding: 0.45rem 0.9rem; background: #eee; color: #444; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; margin-left: 0.4rem; }

    /* Filtr */
    .filter-row { display: flex; gap: 0.5rem; margin: 1rem 0; align-items: center; flex-wrap: wrap; }
    .filter-row input[type=text] { padding: 0.45rem 0.75rem; border: 1px solid #ccc; border-radius: 6px; font-size: 0.9rem; width: 220px; }
    .btn-filter { padding: 0.45rem 1rem; background: #40916c; color: #fff; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; }
    .btn-toggle { padding: 0.45rem 0.9rem; background: #fff; color: #444; border: 1px solid #ccc; border-radius: 6px; font-size: 0.9rem; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn-toggle:hover { background: #f4f6f8; text-decoration: none; }
    .btn-toggle-active { background: #fff3cd; color: #856404; border-color: #ffc107; }
    .btn-toggle-active:hover { background: #ffe69c; }
    .filter-info { font-size: 0.85rem; color: #666; }

    /* Tabela */
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    thead { background: #2d6a4f; color: #fff; }
    th { padding: 0.7rem 0.9rem; text-align: left; font-size: 0.85rem; font-weight: 600; white-space: nowrap; }
    th a { color: #d8f3dc; }
    th a:hover { color: #fff; }
    td { padding: 0.6rem 0.9rem; font-size: 0.875rem; border-bottom: 1px solid #eee; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f0faf4; }
    .code-cell { font-family: monospace; font-weight: 600; letter-spacing: 0.05em; }
    .name-cell { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .date-cell { font-size: 0.78rem; color: #666; white-space: nowrap; }
    .actions-cell { white-space: nowrap; }

    /* Odznaki statusu */
    .badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .badge-new     { background: #d8f3dc; color: #2d6a4f; }
    .badge-claimed { background: #cce5ff; color: #0056b3; }
    .badge-invalid { background: #fde8e8; color: #c0392b; }

    /* Przycisk usunięcia */
    .btn-delete { padding: 0.25rem 0.65rem; background: #fde8e8; color: #c0392b; border: 1px solid #f5c6cb; border-radius: 5px; font-size: 0.8rem; cursor: pointer; margin-left: 0.3rem; }
    .btn-delete:hover { background: #f5c6cb; }
    .btn-edit-link { padding: 0.25rem 0.65rem; background: #e9f5ee; color: #2d6a4f; border: 1px solid #b7dfca; border-radius: 5px; font-size: 0.8rem; text-decoration: none; display: inline-block; }
    .btn-edit-link:hover { background: #d8f3dc; text-decoration: none; }

    .empty { text-align: center; padding: 2rem; color: #888; }

    /* =============================================
       RESPONSYWNOSC – MEDIA QUERIES
       ============================================= */

    /* <= 768 px: tabela – mniejsze odstepy na tabletach */
    @media (max-width: 768px) {
      th, td { padding: 0.5rem 0.6rem; font-size: 0.8rem; }
    }

    /* <= 680 px: formularz edycji – uklad pionowy */
    @media (max-width: 680px) {
      .edit-section { padding: 1rem; }
      .edit-row { flex-direction: column; align-items: stretch; gap: 0.75rem; }
      .edit-row label { min-width: auto; }
      .edit-row input[type=text] { width: 100% !important; }
      .edit-row select { width: 100%; }
      .btn-save, .btn-cancel { width: 100%; text-align: center; display: block; margin: 0; }
      .btn-cancel { margin-top: 0.4rem; }
    }

    /* <= 640 px: naglowek + tabela jako karty */
    @media (max-width: 640px) {
      .admin-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; padding: 0.8rem 1rem; }
      .admin-header h1 { font-size: 1rem; }
      .btn-sm { align-self: flex-start; }

      .table-wrap { overflow-x: visible; }
      table { box-shadow: none; border-radius: 0; background: transparent; }
      thead { display: none; }
      tbody, tr { display: block; }
      tr {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 0.75rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        overflow: hidden;
      }
      tr:hover td { background: transparent; }
      tr:last-child td { border-bottom: 1px solid #f0f0f0; }
      tr:last-child td:last-child { border-bottom: none; }
      td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.55rem 0.9rem;
        border-bottom: 1px solid #f0f0f0;
        font-size: 0.875rem;
      }
      td:last-child { border-bottom: none; }
      td::before {
        content: attr(data-label);
        font-weight: 600;
        font-size: 0.75rem;
        color: #888;
        min-width: 110px;
        flex-shrink: 0;
      }
      td.empty { justify-content: center; }
      td.empty::before { display: none; }
      .name-cell { max-width: none; white-space: normal; overflow: visible; text-overflow: clip; }
      .date-cell { white-space: normal; }
      .actions-cell { white-space: normal; flex-wrap: wrap; gap: 0.3rem; }
      .code-cell { letter-spacing: 0.03em; }
    }

    /* <= 480 px: statystyki i filtr – jednokolumnowy */
    @media (max-width: 480px) {
      .wrap { padding: 1rem 0.75rem; }
      .stats { flex-direction: column; gap: 0.6rem; }
      .stat { padding: 0.75rem 1rem; }
      .filter-row { flex-direction: column; align-items: stretch; gap: 0.5rem; }
      .filter-row input[type=text] { width: 100%; }
      .btn-filter { width: 100%; }
      .filter-info { text-align: center; }
      .login-wrap { margin: 2rem auto; }
    }
  </style>
</head>
<body>

<?php if ($is_logged_in): ?>
<!-- ===================== NAGŁÓWEK ADMINA ===================== -->
<div class="admin-header">
  <h1>Urna &mdash; zgłoszenia uczestników</h1>
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center">
    <form method="post"
          onsubmit="return confirm('Usun\u0105\u0107 wszystkie wpisy? Operacja jest nieodwracalna.')">
      <input type="hidden" name="action"     value="delete_all">
      <input type="hidden" name="csrf_token" value="<?= esc($csrf) ?>">
      <button type="submit" class="btn-sm btn-sm-danger">Usu&#324; wszystkie</button>
    </form>
    <form method="post">
      <input type="hidden" name="action" value="logout">
      <button type="submit" class="btn-sm">Wyloguj</button>
    </form>
  </div>
</div>
<?php endif; ?>

<div class="wrap">

  <?php if (!$is_logged_in): ?>
  <!-- ===================== FORMULARZ LOGOWANIA ===================== -->
  <div class="login-wrap" style="margin:1.5rem auto 2rem;">
    <h1>Panel administracyjny</h1>
    <?php if ($error_msg): ?>
      <p class="msg error"><?= esc($error_msg) ?></p>
    <?php endif; ?>
    <form method="post" autocomplete="off">
      <input type="hidden" name="action" value="login">
      <label for="pw">Hasło</label>
      <input type="password" id="pw" name="password" autofocus required>
      <button type="submit">Zaloguj</button>
    </form>
  </div>
  <?php endif; ?>

  <?php if ($is_logged_in && $error_msg): ?>
    <p class="msg error"><?= esc($error_msg) ?></p>
  <?php endif; ?>
  <?php if ($success_msg): ?>
    <p class="msg success"><?= esc($success_msg) ?></p>
  <?php endif; ?>

  <!-- Statystyki -->
  <div class="stats">
    <div class="stat">
      <div class="stat-val"><?= $total_entries ?></div>
      <div class="stat-lbl">Wszystkich zgłoszeń</div>
    </div>
    <div class="stat">
      <div class="stat-val"><?= $with_name ?></div>
      <div class="stat-lbl">Z imieniem i nazwiskiem</div>
    </div>
    <div class="stat">
      <div class="stat-val"><?= $claimed ?></div>
      <div class="stat-lbl">Odebranych</div>
    </div>
  </div>

  <!-- Formularz edycji (gdy ?edit=CODE) – tylko po zalogowaniu -->
  <?php if ($is_logged_in && $edit_entry): ?>
  <div class="edit-section">
    <h2>Edytuj wpis: <?= esc($edit_entry['final_code']) ?></h2>
    <form method="post">
      <input type="hidden" name="action"       value="edit">
      <input type="hidden" name="csrf_token"   value="<?= esc($csrf) ?>">
      <input type="hidden" name="final_code"   value="<?= esc($edit_entry['final_code']) ?>">
      <div class="edit-row">
        <label>
          Imię i nazwisko
          <input type="text" name="full_name"
                 value="<?= esc($edit_entry['full_name']) ?>"
                 maxlength="120"
                 style="width:280px">
        </label>
        <label>
          Status
          <select name="entry_status">
            <option value="new"     <?= $edit_entry['status'] === 'new'     ? 'selected' : '' ?>>Nowe</option>
            <option value="claimed" <?= $edit_entry['status'] === 'claimed' ? 'selected' : '' ?>>Odebrane</option>
            <option value="invalid" <?= $edit_entry['status'] === 'invalid' ? 'selected' : '' ?>>Nieprawidłowe</option>
          </select>
        </label>
        <div>
          <button type="submit" class="btn-save">Zapisz</button>
          <a href="<?= esc($_SERVER['PHP_SELF']) ?>" class="btn-cancel" style="text-decoration:none">Anuluj</a>
        </div>
      </div>
    </form>
  </div>
  <?php endif; ?>

  <!-- Filtr -->
  <form method="get" class="filter-row">
    <input type="text" name="q" value="<?= esc($filter) ?>" placeholder="Szukaj kodu lub nazwiska...">
    <?php if ($sort !== 'created_at'): ?><input type="hidden" name="sort" value="<?= esc($sort) ?>"><?php endif; ?>
    <?php if ($sort_dir !== 'desc'):  ?><input type="hidden" name="dir"  value="<?= esc($sort_dir) ?>"><?php endif; ?>
    <?php if ($hide_empty): ?><input type="hidden" name="hide_empty" value="1"><?php endif; ?>
    <button type="submit" class="btn-filter">Filtruj</button>
    <?php
      $toggle_params = [];
      if ($filter !== '')         $toggle_params['q']          = $filter;
      if ($sort !== 'created_at') $toggle_params['sort']       = $sort;
      if ($sort_dir !== 'desc')   $toggle_params['dir']        = $sort_dir;
      if (!$hide_empty)           $toggle_params['hide_empty'] = '1';
      $toggle_url = '?' . http_build_query($toggle_params);
    ?>
    <a href="<?= esc($toggle_url) ?>" class="btn-toggle<?= $hide_empty ? ' btn-toggle-active' : '' ?>">
      <?= $hide_empty ? 'Pokaż wszystkich' : 'Ukryj bez danych' ?>
    </a>
    <?php if ($filter): ?>
      <a href="<?= esc($_SERVER['PHP_SELF'] . ($hide_empty ? '?hide_empty=1' : '')) ?>">Wyczyść filtr</a>
    <?php endif; ?>
    <span class="filter-info">Znaleziono: <?= count($entries) ?> / <?= $total_entries ?></span>
  </form>

  <!-- Tabela wpisów -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:2.5rem;text-align:center">#</th>
          <th><a href="<?= esc(sort_url('final_code', $sort, $sort_dir, $filter, $hide_empty)) ?>">Kod finałowy<?= sort_indicator('final_code', $sort, $sort_dir) ?></a></th>
          <th><a href="<?= esc(sort_url('full_name',  $sort, $sort_dir, $filter, $hide_empty)) ?>">Imię i nazwisko<?= sort_indicator('full_name', $sort, $sort_dir) ?></a></th>
          <th><a href="<?= esc(sort_url('status',     $sort, $sort_dir, $filter, $hide_empty)) ?>">Status<?= sort_indicator('status', $sort, $sort_dir) ?></a></th>
          <th><a href="<?= esc(sort_url('created_at', $sort, $sort_dir, $filter, $hide_empty)) ?>">Zgłoszono<?= sort_indicator('created_at', $sort, $sort_dir) ?></a></th>
          <th><a href="<?= esc(sort_url('updated_at', $sort, $sort_dir, $filter, $hide_empty)) ?>">Zaktualizowano<?= sort_indicator('updated_at', $sort, $sort_dir) ?></a></th>
          <?php if ($is_logged_in): ?><th>Akcje</th><?php endif; ?>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($entries)): ?>
          <tr><td colspan="<?= $is_logged_in ? 7 : 6 ?>" class="empty">Brak wpisów<?= ($filter || $hide_empty) ? ' pasujących do filtra' : '' ?>.</td></tr>
        <?php else: ?>
          <?php foreach ($entries as $i => $e): ?>
          <tr>
            <td style="text-align:center;color:#888;font-size:0.8rem" data-label="#"><?= $i + 1 ?></td>
            <td class="code-cell" data-label="Kod"><?= esc($e['final_code']) ?></td>
            <td class="name-cell" data-label="Nazwisko" title="<?= esc($e['full_name']) ?>">
              <?= $e['full_name'] !== '' ? esc($e['full_name']) : '<span style="color:#aaa">—</span>' ?>
            </td>
            <td data-label="Status"><?= status_label($e['status']) ?></td>
            <td class="date-cell" data-label="Zgłoszono"><?= esc($e['created_at']) ?></td>
            <td class="date-cell" data-label="Zaktualizowano"><?= esc($e['updated_at']) ?></td>
            <?php if ($is_logged_in): ?>
            <td class="actions-cell" data-label="Akcje">
              <a href="?edit=<?= urlencode($e['final_code']) ?><?= $filter ? '&q=' . urlencode($filter) : '' ?><?= $hide_empty ? '&hide_empty=1' : '' ?>"
                 class="btn-edit-link">Edytuj</a>
              <form method="post" style="display:inline"
                    onsubmit="return confirm('Usunąć wpis <?= esc(addslashes($e['final_code'])) ?>?')">
                <input type="hidden" name="action"     value="delete">
                <input type="hidden" name="csrf_token" value="<?= esc($csrf) ?>">
                <input type="hidden" name="final_code" value="<?= esc($e['final_code']) ?>">
                <button type="submit" class="btn-delete">Usuń</button>
              </form>
            </td>
            <?php endif; ?>
          </tr>
          <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>
  </div>

</div><!-- .wrap -->

</body>
</html>

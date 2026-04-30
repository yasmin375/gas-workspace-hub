# GAS Auth Library

Modul autentikasi untuk child apps yang terintegrasi dengan Auth Hub.

## Setup di Child App

### 1. Tambahkan Library
Di GAS editor child app:
- Buka **Project Settings > Libraries**
- Masukkan Script ID library ini
- Pilih versi terbaru
- Identifier: `GasAuthLib`

### 2. Tambahkan Script Properties
Di child app, buka **Project Settings > Script Properties**:
- `AUTH_SESSION_SHEET_ID` = Sheet ID yang sama dengan Auth Hub (berisi tab `sessions`)
- `AUTH_HUB_URL` = URL deployment Auth Hub (misal: `https://script.google.com/macros/s/DEPLOY_ID/exec`)

### 3. Gunakan di doGet()

```javascript
function doGet(e) {
  var auth = GasAuthLib.authenticate(e);
  if (!auth.authenticated) {
    return GasAuthLib.buildSafeRedirectPage(auth.redirectUrl);
  }
  // auth.email, auth.name, auth.role, auth.phone tersedia
  return HtmlService.createHtmlOutput('<h2>Halo ' + auth.name + '</h2>');
}
```

### 4. Cek Role (Opsional)

`hasRole()` mendukung multi-role (comma-separated). Admin otomatis punya akses ke semua role.

```javascript
// Single role check
if (GasAuthLib.hasRole(auth, 'guru')) {
  // Tampilkan fitur guru
}

// Multi-role check — true jika user punya SALAH SATU role
if (GasAuthLib.hasRole(auth, 'guru,kepsek')) {
  // Tampilkan fitur guru ATAU kepsek
}

// User dengan role "guru,bendahara" akan match:
// - hasRole(auth, 'guru')       → true
// - hasRole(auth, 'bendahara')  → true
// - hasRole(auth, 'kepsek')     → false
```

## API Reference

### `authenticate(e)`

Autentikasi request dari child app. Cek `auth_token` di URL parameter, validasi terhadap session Sheet.

**Parameter:**
- `e` — Event object dari `doGet(e)` child app

**Returns:** `{ authenticated, email, phone, name, role, token, redirectUrl }`

### `buildSafeRedirectPage(url)`

Bangun halaman redirect yang aman menggunakan `<a target="_top">` dan `<base target="_top">`. Kompatibel dengan GAS iframe sandbox.

**Parameter:**
- `url` — URL tujuan redirect

**Returns:** `HtmlService.HtmlOutput`

URL di-escape secara otomatis menggunakan `escapeHtmlAttr()` untuk mencegah XSS.

### `escapeHtmlAttr(str)`

Escape string untuk digunakan secara aman di HTML attribute. Mencegah XSS injection.

**Parameter:**
- `str` — String yang akan di-escape

**Returns:** `string` — String yang sudah di-escape (`&`, `"`, `'`, `<`, `>`)

### `hasRole(authResult, requiredRole)`

Cek apakah user memiliki role tertentu. Mendukung comma-separated roles.

**Parameter:**
- `authResult` — Hasil dari `authenticate()`
- `requiredRole` — Role yang dibutuhkan (bisa comma-separated, misal `'guru,kepsek'`)

**Returns:** `boolean`

**Behavior:**
- Admin (`role === 'admin'`) selalu return `true`
- Perbandingan role bersifat **case-insensitive**
- Jika user memiliki multi-role (`'guru,bendahara'`), dicek terhadap setiap required role
- Return `true` jika ada minimal satu role yang cocok

### `getLogoutUrl(token)`

Bangun URL logout ke hub.

**Parameter:**
- `token` — Session token

**Returns:** `string` — URL logout

## ⚠️ Peringatan Penting

**JANGAN gunakan `window.top.location.href` di GAS web app.**

Google Apps Script menjalankan web app di dalam iframe dengan sandbox policy ketat. Penggunaan `window.top.location.href` akan diblokir oleh browser.

**Salah:**
```javascript
// ❌ DIBLOKIR oleh iframe sandbox
return HtmlService.createHtmlOutput(
  '<script>window.top.location.href="' + url + '";</script>'
);
```

**Benar:**
```javascript
// ✅ Gunakan buildSafeRedirectPage
return GasAuthLib.buildSafeRedirectPage(url);
```

`buildSafeRedirectPage()` menggunakan `<a target="_top">` yang diizinkan oleh sandbox policy GAS.

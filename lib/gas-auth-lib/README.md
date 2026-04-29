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
    return HtmlService.createHtmlOutput(
      '<script>window.top.location.href="' + auth.redirectUrl + '";</script>'
    );
  }
  
  // User terautentikasi
  // auth.email, auth.name, auth.role, auth.phone tersedia
  return HtmlService.createHtmlOutput(
    '<h2>Selamat datang ' + auth.name + '</h2>' +
    '<p>Email: ' + auth.email + '</p>'
  );
}
```

### 4. Cek Role (Opsional)

```javascript
if (GasAuthLib.hasRole(auth, 'admin')) {
  // Tampilkan fitur admin
}
```

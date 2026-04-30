/**
 * @file ChildAppTemplate.gs
 * @description Template/contoh implementasi child app yang terintegrasi dengan Auth Hub.
 * COPY file ini ke project GAS child app Anda, lalu sesuaikan.
 * 
 * Prasyarat:
 * 1. Library GasAuthLib sudah ditambahkan
 * 2. Script Properties AUTH_SESSION_SHEET_ID dan AUTH_HUB_URL sudah diisi
 */

function doGet(e) {
  // Autentikasi via library
  var auth = GasAuthLib.authenticate(e);
  
  if (!auth.authenticated) {
    return GasAuthLib.buildSafeRedirectPage(auth.redirectUrl);
  }
  
  // === USER TERAUTENTIKASI ===
  // Gunakan auth.email, auth.name, auth.role, auth.phone, auth.token
  
  // Contoh: cek role admin
  if (GasAuthLib.hasRole(auth, 'admin')) {
    return HtmlService.createHtmlOutput(
      '<html><head><base target="_top"></head><body>' +
      '<h2>Admin Panel</h2><p>Halo ' + auth.name + '</p>' +
      '</body></html>'
    );
  }
  
  return HtmlService.createHtmlOutput(
    '<html><head><base target="_top"></head><body>' +
    '<div style="font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px;">' +
    '<h2>Child App</h2>' +
    '<p>Selamat datang, <b>' + auth.name + '</b></p>' +
    '<p>Email: ' + auth.email + '</p>' +
    '<p>Role: ' + auth.role + '</p>' +
    '<hr>' +
    '<p><a href="' + GasAuthLib.getLogoutUrl(auth.token) + '">Logout</a></p>' +
    '</div></body></html>'
  ).setTitle('Child App');
}

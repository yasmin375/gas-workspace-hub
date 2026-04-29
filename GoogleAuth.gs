/**
 * @file GoogleAuth.gs
 * @description Verifikasi Google ID Token dari Google Identity Services (GIS).
 * Memerlukan Script Property: GOOGLE_CLIENT_ID
 */

/**
 * Mendapatkan Google Client ID dari Script Properties.
 * @returns {string} Google OAuth Client ID
 */
function getGoogleClientId() {
  const clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID belum dikonfigurasi di Script Properties.');
  }
  return clientId;
}

/**
 * Verifikasi Google ID Token menggunakan Google tokeninfo endpoint.
 * @param {string} idToken - JWT token dari Google Sign-In client-side.
 * @returns {Object} { success, email, name, picture, message }
 */
function verifyGoogleToken(idToken) {
  try {
    if (!idToken) {
      return { success: false, message: 'Token Google tidak ditemukan.' };
    }

    const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const code = response.getResponseCode();

    if (code !== 200) {
      console.error('Google tokeninfo error: HTTP ' + code + ' - ' + response.getContentText());
      return { success: false, message: 'Token Google tidak valid atau sudah kadaluwarsa.' };
    }

    const payload = JSON.parse(response.getContentText());
    const clientId = getGoogleClientId();

    // Verifikasi audience (client ID) cocok
    if (payload.aud !== clientId) {
      console.error('Token audience mismatch. Expected: ' + clientId + ', Got: ' + payload.aud);
      return { success: false, message: 'Token tidak ditujukan untuk aplikasi ini.' };
    }

    // Verifikasi token belum expired
    if (parseInt(payload.exp) < Math.floor(Date.now() / 1000)) {
      return { success: false, message: 'Token Google sudah kadaluwarsa.' };
    }

    // Verifikasi email terverifikasi
    if (payload.email_verified !== 'true') {
      return { success: false, message: 'Email Google belum terverifikasi.' };
    }

    return {
      success: true,
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || '',
      message: 'Verifikasi berhasil'
    };
  } catch (e) {
    console.error('verifyGoogleToken error: ' + e.message);
    return { success: false, message: 'Gagal memverifikasi token Google: ' + e.message };
  }
}

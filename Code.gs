/**
 * @file Code.gs
 * @description Entry point utama aplikasi yang menangani routing halaman (doGet) dan pemrosesan form (doPost).
 * Mengatur alur login dari input nomor HP hingga verifikasi OTP.
 */

/**
 * Escape HTML special characters untuk mencegah HTML injection.
 * @param {string} str - String yang akan di-escape.
 * @returns {string} String yang sudah di-escape.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Merender halaman web app berdasarkan parameter query.
 * @param {Object} e - Event object dari Google Apps Script.
 * @returns {HtmlService.HtmlOutput}
 */
function doGet(e) {
  const userProps = PropertiesService.getUserProperties();
  const sessionString = userProps.getProperty('session');

  if (sessionString) {
    const sessionData = JSON.parse(sessionString);
    const now = new Date().toISOString();

    if (sessionData.expiry > now) {
      // Support both email (Google login) and phone (OTP login)
      const identity = sessionData.email || sessionData.phone || 'Unknown';
      const method = sessionData.loginMethod || 'otp';
      const name = sessionData.name || identity;
      return HtmlService.createHtmlOutput(
        '<div style="font-family:sans-serif;text-align:center;margin-top:50px;">' +
        '<h2>Anda sudah login</h2>' +
        '<p>Selamat datang <b>' + escapeHtml(name) + '</b></p>' +
        '<p style="color:#666;font-size:12px;">Login via: ' + escapeHtml(method) + ' | ' + escapeHtml(identity) + '</p>' +
        '</div>'
      );
    } else {
      userProps.deleteProperty('session');
    }
  }

  const page = e.parameter.page || 'login';
  const phone = e.parameter.phone || '';
  const error = e.parameter.error || '';

  return render(page, { phone: phone, error: error });
}

/**
 * Menangani pengiriman data form (POST) untuk kirim OTP dan verifikasi OTP.
 * @param {Object} e - Event object yang berisi parameter form.
 * @returns {HtmlService.HtmlOutput}
 */
function doPost(e) {
  const action = e.parameter.action;
  const phone = e.parameter.phone || '';

  try {
    // === GOOGLE LOGIN ===
    if (action === 'google_login') {
      const idToken = e.parameter.id_token;
      const googleResult = verifyGoogleToken(idToken);

      if (!googleResult.success) {
        return render('login', { phone: '', error: googleResult.message });
      }

      // Cek whitelist
      const access = checkUserByEmail(googleResult.email);

      if (!access.found) {
        return render('login', { phone: '', error: 'Email ' + googleResult.email + ' belum terdaftar. Hubungi admin untuk mendapatkan akses.' });
      }
      if (!access.allowed) {
        return render('login', { phone: '', error: 'Akun Anda dinonaktifkan. Hubungi admin.' });
      }

      // Buat session
      const userProps = PropertiesService.getUserProperties();
      const sessionData = {
        email: googleResult.email,
        name: access.name || googleResult.name,
        role: access.role,
        loginMethod: 'google',
        loginTime: new Date().toISOString(),
        expiry: new Date(Date.now() + 3600000).toISOString()
      };
      userProps.setProperty('session', JSON.stringify(sessionData));

      return HtmlService.createHtmlOutput(
        '<div style="font-family:sans-serif;text-align:center;margin-top:50px;">' +
        '<h2>Login Berhasil!</h2>' +
        '<p>Selamat datang <b>' + escapeHtml(access.name || googleResult.name) + '</b></p>' +
        '<p style="color:#666;font-size:12px;">' + escapeHtml(googleResult.email) + '</p>' +
        '</div>'
      );
    }

    // === WHATSAPP OTP: SEND ===
    if (action === 'send_otp') {
      // Guard: pastikan phone tidak kosong
      if (!phone || phone.trim() === '') {
        return render('login', { phone: '', error: 'Nomor telepon harus diisi.' });
      }

      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
      }

      // Cek whitelist nomor telepon
      const access = checkUserByPhone(cleanPhone);

      if (!access.found) {
        return render('login', { phone: cleanPhone, error: 'Nomor ' + cleanPhone + ' belum terdaftar. Hubungi admin untuk mendapatkan akses.' });
      }
      if (!access.allowed) {
        return render('login', { phone: cleanPhone, error: 'Akun Anda dinonaktifkan. Hubungi admin.' });
      }

      const result = sendOtp(cleanPhone);

      if (result.success) {
        return render('verify', { phone: cleanPhone, error: '' });
      } else {
        return render('login', { phone: cleanPhone, error: 'Gagal mengirim OTP: ' + result.message });
      }
    }

    // === WHATSAPP OTP: VERIFY ===
    if (action === 'verify_otp') {
      // Guard: pastikan phone tidak kosong
      if (!phone || phone.trim() === '') {
        return render('login', { phone: '', error: 'Sesi tidak valid. Silakan login ulang.' });
      }

      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
      }

      const otp = e.parameter.otp;
      const result = verifyOtp(cleanPhone, otp);

      if (result.success) {
        // Ambil data user dari whitelist untuk session
        const userData = checkUserByPhone(cleanPhone);

        const userProps = PropertiesService.getUserProperties();
        const sessionData = {
          phone: cleanPhone,
          email: userData.found ? userData.email : '',
          name: userData.found ? userData.name : cleanPhone,
          role: userData.found ? userData.role : 'user',
          loginMethod: 'whatsapp_otp',
          loginTime: new Date().toISOString(),
          expiry: new Date(Date.now() + 3600000).toISOString()
        };
        userProps.setProperty('session', JSON.stringify(sessionData));

        return HtmlService.createHtmlOutput(
          '<div style="font-family:sans-serif;text-align:center;margin-top:50px;">' +
          '<h2>Login Berhasil!</h2>' +
          '<p>Selamat datang <b>' + escapeHtml(userData.found ? userData.name : cleanPhone) + '</b></p>' +
          '<p style="color:#666;font-size:12px;">Login via WhatsApp OTP | ' + escapeHtml(cleanPhone) + '</p>' +
          '</div>'
        );
      } else {
        return render('verify', { phone: cleanPhone, error: 'OTP Salah atau Kadaluwarsa.' });
      }
    }

    // Action tidak dikenali
    return render('login', { phone: '', error: 'Aksi tidak valid.' });

  } catch (err) {
    console.error('Error in doPost: ' + err.toString());
    return render('login', { phone: phone, error: 'Terjadi kesalahan sistem internal.' });
  }
}

/**
 * Helper untuk merender file HTML dengan evaluasi scriptlet agar dinamis.
 * @param {string} filename - Nama file HTML (tanpa ekstensi).
 * @param {Object} args - Objek data untuk dipassing ke template HTML.
 * @returns {HtmlService.HtmlOutput}
 */
function render(filename, args = {}) {
  try {
    const template = HtmlService.createTemplateFromFile(filename);

    // Default values pencegah crash jika ada variabel yang lupa dikirim
    template.error = '';
    template.phone = '';

    // Assign properti dari args ke template
    Object.keys(args).forEach(key => {
      template[key] = args[key];
    });

    return template.evaluate()
      .setTitle('Auth Hub')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    console.error('Render Error: ' + e.toString());
    return HtmlService.createHtmlOutput('Error loading page "' + filename + '": ' + e.toString());
  }
}

/**
 * Helper untuk menyisipkan konten file lain ke dalam HTML (untuk CSS atau JS eksternal).
 * Digunakan dengan syntax <?!= include('filename'); ?>
 * @param {string} filename - Nama file.
 * @returns {string} Konten file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

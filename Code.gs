/**
 * @file Code.gs
 * @description Entry point utama aplikasi yang menangani routing halaman (doGet) dan pemrosesan form (doPost).
 * Mengatur alur login dari input nomor HP hingga verifikasi OTP.
 */

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
       return HtmlService.createHtmlOutput('<h2>Anda sudah login sebagai ' + sessionData.phone + '</h2>');
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
  const phone = e.parameter.phone;
  
  // PERBAIKAN: Gunakan let, bukan const, agar nilainya bisa diubah
  let cleanPhone = phone.replace(/\D/g, ''); 
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.substring(1);
  } 

  try {
    if (action === 'send_otp') {
      // Gunakan cleanPhone yang sudah diformat ke 62
      const result = sendOtp(cleanPhone);

      if (result.success) {
        // PERBAIKAN UTAMA: Tambahkan error: '' agar template HTML tidak crash
        return render('verify', { phone: cleanPhone, error: '' });
      } else {
        return render('login', { phone: cleanPhone, error: 'Gagal mengirim OTP: ' + result.message });
      }
    }

    if (action === 'verify_otp') {
      const otp = e.parameter.otp;
      // Gunakan cleanPhone untuk verifikasi
      const result = verifyOtp(cleanPhone, otp);

      if (result.success) {
        const userProps = PropertiesService.getUserProperties();
        const sessionData = {
          phone: cleanPhone,
          loginTime: new Date().toISOString(),
          expiry: new Date(Date.now() + 3600000).toISOString()
        };
        userProps.setProperty('session', JSON.stringify(sessionData));

        return HtmlService.createHtmlOutput('<div style="font-family:sans-serif;text-align:center;margin-top:50px;"><h2>Login Berhasil! 🎉</h2><p>Selamat datang <b>' + cleanPhone + '</b></p></div>');
      } else {
        return render('verify', { phone: cleanPhone, error: 'OTP Salah atau Kadaluwarsa.' });
      }
    }
  } catch (err) {
    console.error('Error in doPost: ' + err.toString());
    return render('login', { phone: cleanPhone, error: 'Terjadi kesalahan sistem internal.' });
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
      .setTitle('Login OTP Gowa')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    console.error('Render Error: ' + e.toString());
    // Tambahkan e.toString() agar kita bisa lihat detail error jika terjadi lagi
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

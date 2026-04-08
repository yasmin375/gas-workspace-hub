/**
 * @file Auth.gs
 * @description Modul integrasi Auth/OTP menggunakan API Gowa.
 */

/**
 * Konfigurasi API Key dan Endpoint Gowa.
 * // TODO: Sesuaikan API_KEY dan BASE_URL dengan kredensial dari layanan Gowa Anda.
 */
const GOWA_CONFIG = {
  API_KEY: PropertiesService.getScriptProperties().getProperty('GOWA_API_KEY'),
  BASE_URL: 'https://wa.dimanaaja.biz.id', // Ganti dengan endpoint resmi Gowa
  SENDER_ID: 'GOWA_AUTH'
};
/**
 * Mengirim OTP ke nomor HP melalui API Gowa menggunakan UrlFetchApp.
 * @param {string} phoneNumber - Format internasional (misal: 62812345678).
 * @returns {Object} {success: boolean, message: string}
 */
function sendOtp(phoneNumber) {
  // Menggunakan endpoint standar GOWA untuk kirim pesan
  const url = `${GOWA_CONFIG.BASE_URL}/send/message`; 
  
  // Buat kode OTP acak 6 digit
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Format payload sesuai standar GOWA
  const payload = {
    phone: phoneNumber,
    message: `Kode OTP Anda adalah: *${otpCode}*\n\nJangan berikan kode ini kepada siapapun.`
  };

  try {
    const encodedAuth = Utilities.base64Encode(GOWA_CONFIG.API_KEY);

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': `Basic ${encodedAuth}`
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();

    // Mengembalikan logika pengecekan respons yang hilang
    if (responseCode === 200 || responseCode === 201) {
      // SIMPAN OTP secara internal karena GOWA hanya bertindak sebagai pengirim pesan
      const scriptProps = PropertiesService.getScriptProperties();
      // Simpan dengan key unik per nomor, expired tidak bisa di set otomatis di property service
      // tapi kita bisa simpan timestamp jika butuh validasi waktu. Untuk saat ini kita simpan valuenya.
      scriptProps.setProperty(`OTP_${phoneNumber}`, otpCode);

      return { success: true, message: 'OTP terkirim' };
    } else {
      Logger.log(`Gowa Error [${responseCode}]: ${response.getContentText()}`);
      return { success: false, message: 'Gagal kirim OTP' };
    }
  } catch (e) {
    console.error(`Error in sendOtp: ${e.message}`);
    return { success: false, message: 'Terjadi kesalahan pada layanan pengiriman OTP.' };
  }
}

/**
 * Memverifikasi OTP secara internal (mencocokkan dengan yang disimpan di Script Properties).
 * @param {string} phoneNumber - Nomor HP user.
 * @param {string} otp - Kode OTP yang dimasukkan user.
 * @returns {Object} {success: boolean, message: string}
 */
function verifyOtp(phoneNumber, otp) {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const savedOtp = scriptProps.getProperty(`OTP_${phoneNumber}`);

    if (savedOtp && savedOtp === otp) {
      // Hapus OTP setelah digunakan agar tidak bisa dipakai ulang
      scriptProps.deleteProperty(`OTP_${phoneNumber}`);
      return { success: true, message: 'Verifikasi berhasil' };
    } else {
      return { success: false, message: 'OTP tidak valid atau sudah kadaluwarsa.' };
    }
  } catch (e) {
    console.error(`Error in verifyOtp: ${e.message}`);
    return { success: false, message: 'Terjadi kesalahan pada proses verifikasi internal.' };
  }
}

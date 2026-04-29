/**
 * @file AuditLog.gs
 * @description Audit log untuk mencatat aktivitas login, logout, dan akses.
 * Menggunakan tab 'audit_log' di Google Sheet yang sama (USERS_SHEET_ID).
 * 
 * Kolom: timestamp | event | email | phone | method | detail
 */

/**
 * Mendapatkan sheet 'audit_log'. Buat otomatis jika belum ada.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getAuditSheet() {
  var sheetId = getUsersSheetId();
  var spreadsheet = SpreadsheetApp.openById(sheetId);
  var sheet = spreadsheet.getSheetByName('audit_log');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('audit_log');
    sheet.appendRow(['timestamp', 'event', 'email', 'phone', 'method', 'detail']);
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Catat event ke audit log.
 * @param {string} event - Jenis event (LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, OTP_SENT, OTP_FAILED, SESSION_EXPIRED)
 * @param {Object} data - Data tambahan { email, phone, method, detail }
 */
function logAuditEvent(event, data) {
  try {
    var sheet = getAuditSheet();
    var now = new Date().toISOString();
    
    sheet.appendRow([
      now,
      event,
      (data && data.email) || '',
      (data && data.phone) || '',
      (data && data.method) || '',
      (data && data.detail) || ''
    ]);
  } catch (e) {
    console.error('logAuditEvent error: ' + e.message);
  }
}

/**
 * Bersihkan audit log yang lebih dari 90 hari.
 * Dipanggil via time-driven trigger.
 * @returns {number} Jumlah baris yang dihapus
 */
function cleanOldAuditLogs() {
  try {
    var sheet = getAuditSheet();
    var data = sheet.getDataRange().getValues();
    var cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 hari
    var deletedCount = 0;
    
    for (var i = data.length - 1; i >= 1; i--) {
      var timestamp = new Date(data[i][0]).getTime();
      if (timestamp < cutoff) {
        sheet.deleteRow(i + 1);
        deletedCount++;
      }
    }
    
    console.log('cleanOldAuditLogs: ' + deletedCount + ' rows cleaned');
    return deletedCount;
  } catch (e) {
    console.error('cleanOldAuditLogs error: ' + e.message);
    return 0;
  }
}

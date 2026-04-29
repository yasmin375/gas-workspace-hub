/**
 * @file Triggers.gs
 * @description Setup time-driven triggers untuk maintenance otomatis.
 * Jalankan setupTriggers() SATU KALI dari GAS editor untuk mengaktifkan.
 */

/**
 * Setup semua time-driven triggers.
 * Jalankan fungsi ini SATU KALI secara manual dari GAS editor.
 */
function setupTriggers() {
  // Hapus trigger lama (jika ada) untuk menghindari duplikasi
  var existingTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existingTriggers.length; i++) {
    var handlerName = existingTriggers[i].getHandlerFunction();
    if (handlerName === 'scheduledCleanup') {
      ScriptApp.deleteTrigger(existingTriggers[i]);
    }
  }
  
  // Buat trigger: jalankan scheduledCleanup setiap 6 jam
  ScriptApp.newTrigger('scheduledCleanup')
    .timeBased()
    .everyHours(6)
    .create();
  
  console.log('Triggers berhasil di-setup.');
}

/**
 * Fungsi yang dipanggil oleh time-driven trigger.
 * Membersihkan session expired dan audit log lama.
 */
function scheduledCleanup() {
  console.log('=== SCHEDULED CLEANUP START ===');
  
  var sessionsDeleted = cleanExpiredSessions(); // dari Session.gs
  console.log('Sessions cleaned: ' + sessionsDeleted);
  
  var auditDeleted = cleanOldAuditLogs(); // dari AuditLog.gs
  console.log('Audit logs cleaned: ' + auditDeleted);
  
  console.log('=== SCHEDULED CLEANUP END ===');
}

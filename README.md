WhatsApp OTP Authentication - Google Apps Script
Proyek ini adalah sistem autentikasi (Login) berbasis OTP (One-Time Password) WhatsApp. Dibangun menggunakan Google Apps Script (GAS) sebagai backend/serverless, antarmuka HTML dengan Tailwind CSS, dan diintegrasikan dengan API WhatsApp Gateway (GOWA / go-whatsapp-web-multidevice).
✨ Fitur Utama
Kirim OTP via WhatsApp: Terintegrasi dengan REST API GOWA untuk pengiriman pesan OTP yang cepat.
Verifikasi Internal Tanpa Database: Menghasilkan dan memvalidasi OTP secara internal menggunakan PropertiesService bawaan Google Apps Script.
Sesi Login (Session Management): Menyimpan sesi pengguna yang telah berhasil login selama 1 jam. Jika pengguna me-refresh atau kembali, mereka tidak perlu menginput OTP lagi.
UI Responsif & Modern: Antarmuka pengguna (Login & Verifikasi) dibangun menggunakan Tailwind CSS (Mobile-First).
Keamanan Otentikasi API: Menggunakan metode Basic Auth (Base64 Encode) untuk berkomunikasi dengan server GOWA.
📂 Struktur Repositori
File
Deskripsi
Code.gs
Controller utama. Menangani routing halaman (doGet) dan pemrosesan form request (doPost).
Auth.gs
Modul layanan autentikasi. Menangani logika generate OTP, fetch ke API GOWA, dan validasi OTP.
TesKoneksi.gs
Script utilitas (testing) untuk mendiagnosa dan memverifikasi konektivitas + kredensial ke API server GOWA.
login.html
Tampilan UI untuk input nomor WhatsApp.
verify.html
Tampilan UI untuk input 6 digit kode OTP.
appsscript.json
File manifest konfigurasi Google Apps Script.

🚀 Panduan Setup & Instalasi
Karena proyek ini menggunakan Google Apps Script, Anda disarankan menggunakan Clasp (Command Line Apps Script Projects) untuk sinkronisasi kode lokal ke dashboard GAS.
1. Kloning Repositori
git clone <url-repositori-anda>
cd <nama-folder-repositori>


2. Hubungkan ke Google Apps Script via Clasp
Pastikan Anda sudah menginstal Node.js dan Clasp secara global (npm install -g @google/clasp).
# Login ke akun Google Anda
clasp login

# Buat project script baru (Pilih "webapp")
clasp create --type webapp --title "WhatsApp OTP Login"

# Dorong (push) kode lokal ini ke Google Apps Script
clasp push


3. Konfigurasi Kredensial (Script Properties)
Aplikasi ini membutuhkan API Key dari layanan GOWA agar bisa mengirimkan pesan. JANGAN PERNAH menuliskan API Key langsung di dalam file .gs. Gunakan Script Properties.
Buka Editor Google Apps Script.
Buka Project Settings (ikon roda gigi di bilah kiri).
Scroll ke bawah ke bagian Script Properties dan klik Add script property.
Masukkan konfigurasi berikut:
Property: GOWA_API_KEY
Value: username:password (Kredensial dari server GOWA Anda. Script akan melakukan konversi ke Base64 secara otomatis pada Auth.gs).
4. Deployment (Web App)
Di Editor Apps Script, klik tombol biru Deploy di kanan atas.
Pilih New deployment.
Pilih tipe Web app.
Atur akses:
Execute as: Me (Akun Anda)
Who has access: Anyone (Agar siapa saja bisa membuka halaman login)
Klik Deploy dan salin URL Web App yang dihasilkan.
🛠 Panduan Testing Koneksi API
Jika OTP tidak masuk, Anda dapat menguji konfigurasi server GOWA dengan menjalankan fungsi test bawaan:
Buka editor Google Apps Script.
Buka file TesKoneksi.gs.
Pilih fungsi testGowaConnection di menu dropdown atas, lalu klik Run (Jalankan).
Periksa jendela Execution Log (Log Eksekusi) untuk melihat respon dari server (Status 200 = Sukses).
📄 Lisensi
MIT License

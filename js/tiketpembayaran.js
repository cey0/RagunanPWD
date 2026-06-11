/**
 * Logika Halaman Pembayaran (tiketpembayaran.js)
 * Mengelola hitung mundur pembayaran, salin kode VA, akordeon petunjuk, dan penyimpanan e-tiket ke database.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Validasi & Ambil data draft pemesanan dari sessionStorage
    const draftData = sessionStorage.getItem('booking_draft');
    if (!draftData) {
        alert('Draft pemesanan tidak ditemukan.');
        window.location.href = 'tiketbooking.html';
        return;
    }

    const draft = JSON.parse(draftData);
    document.getElementById('summary-date-val').textContent = draft.dateStr;
    document.getElementById('summary-time-val').textContent = draft.timeStr;
    
    let visitorsText = `${draft.qtyDewasa} Dewasa`;
    if (draft.qtyAnak > 0) {
        visitorsText += `, ${draft.qtyAnak} Anak`;
    }
    if (draft.addonSchmutzer) {
        visitorsText += ` (+ Schmutzer)`;
    }
    document.getElementById('summary-visitors-val').textContent = visitorsText;
    document.getElementById('summary-total-val').textContent = `Rp ${draft.total.toLocaleString('id-ID')}`;

    // 2. Buat kode Virtual Account universal menggunakan nomor HP pengunjung
    let rawPhone = draft.visitorPhone || '081234567890';
    if (rawPhone.startsWith('0')) {
        rawPhone = rawPhone.substring(1);
    } else if (rawPhone.startsWith('+62')) {
        rawPhone = rawPhone.substring(3);
    }
    const vaNumber = '88060' + rawPhone;
    document.getElementById('va-code-val').textContent = vaNumber;

    /**
     * Menyalin kode Virtual Account ke clipboard
     */
    window.copyVACode = function() {
        navigator.clipboard.writeText(vaNumber).then(() => {
            const btn = document.querySelector('.btn-copy');
            btn.textContent = 'Tersalin!';
            setTimeout(() => {
                btn.textContent = 'Salin';
            }, 2000);
        }).catch(err => {
            alert('Gagal menyalin kode: ' + err);
        });
    };

    /**
     * Toggle akordeon untuk petunjuk pembayaran
     */
    window.toggleAccordion = function(element) {
        const items = document.querySelectorAll('.accordion-item');
        items.forEach(item => {
            if (item === element) {
                item.classList.toggle('active');
            } else {
                item.classList.remove('active');
            }
        });
    };

    // 3. Hitung Mundur Batas Waktu Pembayaran (15 Menit)
    let totalSeconds = 15 * 60;
    const timerElement = document.getElementById('countdown-timer');
    const timerInterval = setInterval(() => {
        if (totalSeconds <= 0) {
            clearInterval(timerInterval);
            timerElement.textContent = "00:00";
            alert('Batas waktu pembayaran telah habis. Silakan buat pesanan baru.');
            window.location.href = 'tiketbooking.html';
            return;
        }
        totalSeconds--;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);

    /**
     * Menyelesaikan pembayaran, menyimpan pemesanan ke database, dan menampilkan modal sukses
     */
    window.submitPayment = async function() {
        clearInterval(timerInterval);
        const DB = window.RagunanDB;
        const user = DB ? DB.getCurrentUser() : null;
        const userId = user ? user.id : 'anonymous';

        // Konstruksi objek booking baru
        const booking = {
            id: 'bkg_' + Date.now(),
            userId: userId,
            visitorName: draft.visitorName,
            visitorPhone: draft.visitorPhone,
            visitorEmail: draft.visitorEmail,
            visitDate: draft.dateStr,
            visitTime: draft.timeStr,
            qtyDewasa: draft.qtyDewasa,
            qtyAnak: draft.qtyAnak,
            addonSchmutzer: draft.addonSchmutzer,
            total: draft.total,
            status: 'Aktif', // Status awal = Aktif; berubah ke Selesai setelah tanggal kunjungan berlalu
            createdAt: new Date().toISOString()
        };

        // Simpan pemesanan ke database server
        try {
            const response = await fetch('/api/db');
            if (response.ok) {
                const currentDb = await response.json();
                
                // Tambahkan pesanan baru
                currentDb.bookings = currentDb.bookings || [];
                currentDb.bookings.push(booking);

                // Update statistik pengguna jika login
                if (user && currentDb.users) {
                    const dbUserIndex = currentDb.users.findIndex(u => u.id === user.id);
                    if (dbUserIndex !== -1) {
                        currentDb.users[dbUserIndex].stats = currentDb.users[dbUserIndex].stats || { kunjungan: 0, ceritaTersimpan: 0, mendatang: 0 };
                        currentDb.users[dbUserIndex].stats.mendatang = (currentDb.users[dbUserIndex].stats.mendatang || 0) + 1;
                        localStorage.setItem('Ragunan_session', JSON.stringify(currentDb.users[dbUserIndex]));
                    }
                }

                // Kirim perubahan database ke server
                const saveResponse = await fetch('/api/db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentDb)
                });

                if (!saveResponse.ok) {
                    throw new Error('Gagal menyimpan tiket pemesanan ke database.');
                }
            }
        } catch (error) {
            console.error('Error saving booking:', error);
            alert('Terjadi kesalahan koneksi ke server, tapi tiket disimulasikan berhasil.');
        }

        // Tampilkan modal sukses
        document.getElementById('success-modal').classList.add('active');
        sessionStorage.removeItem('booking_draft');
    };

    /**
     * Mengarahkan kembali ke profil pengguna setelah pembayaran sukses
     */
    window.goToProfile = function() {
        window.location.href = 'profil.html';
    };
});

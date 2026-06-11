/**
 * Logika Halaman Detail Pengunjung (tiketpengunjung.js)
 * Mengelola form pengunjung utama, kuantitas tiket, add-on primata, dan detail subtotal pesanan.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Validasi & Ambil data draft pemesanan dari sessionStorage
    const draftData = sessionStorage.getItem('booking_draft');
    if (!draftData) {
        alert('Silakan pilih jadwal kunjungan terlebih dahulu.');
        window.location.href = 'tiketbooking.html';
        return;
    }

    const draft = JSON.parse(draftData);
    document.getElementById('summary-date-val').textContent = draft.dateStr;
    document.getElementById('summary-time-val').textContent = draft.timeStr;

    // 2. Isi otomatis informasi kontak jika pengguna sudah login
    const DB = window.RagunanDB;
    if (DB) {
        const user = DB.getCurrentUser();
        if (user) {
            document.getElementById('visitor-name').value = user.fullName || '';
            document.getElementById('visitor-email').value = user.email || '';
        }
    }

    // 3. Konfigurasi harga tiket (Dewasa, Anak, Schmutzer)
    const isWeekend = draft.isWeekend;
    const prices = {
        dewasa: 4000, 
        anak: 3000,   
        schmutzer: isWeekend ? 7500 : 6000
    };

    // Update label harga di UI
    document.getElementById('price-dewasa-label').textContent = `Rp ${prices.dewasa.toLocaleString('id-ID')} / orang`;
    document.getElementById('price-anak-label').textContent = `Rp ${prices.anak.toLocaleString('id-ID')} / orang`;
    document.getElementById('price-schmutzer-label').textContent = `Rp ${prices.schmutzer.toLocaleString('id-ID')} / orang`;

    let qtyDewasa = draft.qtyDewasa !== undefined ? draft.qtyDewasa : 1;
    let qtyAnak = draft.qtyAnak !== undefined ? draft.qtyAnak : 0;
    let addonSchmutzer = false;

    // Sinkronisasi kuantitas awal ke UI
    document.getElementById('qty-dewasa').textContent = qtyDewasa;
    document.getElementById('qty-anak').textContent = qtyAnak;

    /**
     * Mengubah jumlah kuantitas tiket pengunjung (Dewasa / Anak-anak)
     */
    window.changeQty = function(type, delta) {
        if (type === 'dewasa') {
            qtyDewasa = Math.max(1, qtyDewasa + delta);
            document.getElementById('qty-dewasa').textContent = qtyDewasa;
        } else if (type === 'anak') {
            qtyAnak = Math.max(0, qtyAnak + delta);
            document.getElementById('qty-anak').textContent = qtyAnak;
        }
        updateSummary();
    };

    /**
     * Mengaktifkan/menonaktifkan add-on Pusat Primata Schmutzer
     */
    window.toggleAddon = function() {
        addonSchmutzer = !addonSchmutzer;
        const card = document.getElementById('addon-schmutzer');
        const check = document.getElementById('addon-check');
        if (addonSchmutzer) {
            card.classList.add('selected');
            check.innerHTML = '✓';
        } else {
            card.classList.remove('selected');
            check.innerHTML = '';
        }
        updateSummary();
    };

    /**
     * Memperbarui ringkasan rincian biaya pesanan di sidebar kanan
     */
    function updateSummary() {
        let visitorText = `${qtyDewasa} Dewasa`;
        if (qtyAnak > 0) {
            visitorText += `, ${qtyAnak} Anak`;
        }
        document.getElementById('summary-visitors-val').textContent = visitorText;

        const detailsContainer = document.getElementById('summary-tickets-detail');
        detailsContainer.innerHTML = '';

        let total = 0;

        // Hitung biaya Dewasa
        const costDewasa = qtyDewasa * prices.dewasa;
        total += costDewasa;
        detailsContainer.insertAdjacentHTML('beforeend', `
            <div class="summary-ticket-row">
                <span>Dewasa (x${qtyDewasa})</span>
                <span>Rp ${costDewasa.toLocaleString('id-ID')}</span>
            </div>
        `);

        // Hitung biaya Anak
        if (qtyAnak > 0) {
            const costAnak = qtyAnak * prices.anak;
            total += costAnak;
            detailsContainer.insertAdjacentHTML('beforeend', `
                <div class="summary-ticket-row">
                    <span>Anak-anak (x${qtyAnak})</span>
                    <span>Rp ${costAnak.toLocaleString('id-ID')}</span>
                </div>
            `);
        }

        // Hitung biaya Pusat Primata Schmutzer
        if (addonSchmutzer) {
            const totalTickets = qtyDewasa + qtyAnak;
            const costSchmutzer = totalTickets * prices.schmutzer;
            total += costSchmutzer;
            detailsContainer.insertAdjacentHTML('beforeend', `
                <div class="summary-ticket-row" style="color: var(--amber);">
                    <span>Pusat Primata Schmutzer (x${totalTickets})</span>
                    <span>Rp ${costSchmutzer.toLocaleString('id-ID')}</span>
                </div>
            `);
        }

        document.getElementById('summary-total-val').textContent = `Rp ${total.toLocaleString('id-ID')}`;
    }

    /**
     * Menyimpan data pengunjung utama ke draft dan melanjutkan ke halaman pembayaran
     */
    window.continueToPayment = function() {
        const name = document.getElementById('visitor-name').value.trim();
        const phone = document.getElementById('visitor-phone').value.trim();
        const email = document.getElementById('visitor-email').value.trim();

        if (!name || !phone || !email) {
            alert('Silakan lengkapi data pengunjung utama terlebih dahulu.');
            return;
        }

        // Simpan data ke session draft
        draft.visitorName = name;
        draft.visitorPhone = phone;
        draft.visitorEmail = email;
        draft.qtyDewasa = qtyDewasa;
        draft.qtyAnak = qtyAnak;
        draft.addonSchmutzer = addonSchmutzer;
        
        let total = (qtyDewasa * prices.dewasa) + (qtyAnak * prices.anak);
        if (addonSchmutzer) {
            total += (qtyDewasa + qtyAnak) * prices.schmutzer;
        }
        draft.total = total;

        sessionStorage.setItem('booking_draft', JSON.stringify(draft));
        window.location.href = 'tiketpembayaran.html';
    };

    // Panggil updateSummary pertama kali untuk inisialisasi
    updateSummary();
});

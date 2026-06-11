/**
 * Logika Halaman Dashboard (dashboard.js)
 * - Mengambil data fauna dari server untuk menampilkan jumlah spesies dan kartu hewan
 * - Jika user login: memuat data bookings dan menampilkan stat Tiket Aktif + Total Pemesanan
 */

document.addEventListener('DOMContentLoaded', async () => {
    const DB = window.RagunanDB;
    if (!DB) return;

    const currentUser = DB.getCurrentUser();

    try {
        const dbData = await DB.getDatabaseData();
        const fauna = dbData.fauna;

        // 1. Update jumlah spesies dilindungi
        const faunaCountElem = document.getElementById('live-fauna-count');
        if (faunaCountElem && fauna && fauna.length > 0) {
            faunaCountElem.textContent = `${fauna.length} Spesies Dilindungi`;
        }

        // 2. Update hero image dari database (Harimau Sumatera)
        if (fauna && fauna.length > 0) {
            const tigerFauna = fauna.find(f => f.id === 'f_01');
            if (tigerFauna) {
                const heroImg = document.querySelector('.hero-image img');
                if (heroImg) heroImg.src = tigerFauna.image;
            }

            // 3. Render kartu hewan penghuni secara dinamis
            const animalGrid = document.querySelector('.animals-grid');
            if (animalGrid && fauna.length >= 3) {
                animalGrid.innerHTML = `
                    <div class="animal-card large" style="background-image: url('${fauna[0].image}'); background-size: cover; background-position: center; cursor: pointer;" onclick="window.location.href='gallery.html'">
                        <div class="animal-label">
                            <div class="animal-category">${fauna[0].category}</div>
                            <div class="animal-name">${fauna[0].name}</div>
                        </div>
                    </div>
                    <div class="animal-card small" style="background-image: url('${fauna[1].image}'); background-size: cover; background-position: center; cursor: pointer;" onclick="window.location.href='gallery.html'">
                        <div class="animal-label">
                            <div class="animal-category">${fauna[1].category}</div>
                            <div class="animal-name">${fauna[1].name}</div>
                        </div>
                    </div>
                    <div class="animal-card small" style="background-image: url('${fauna[2].image}'); background-size: cover; background-position: center; cursor: pointer;" onclick="window.location.href='gallery.html'">
                        <div class="animal-label">
                            <div class="animal-category">${fauna[2].category}</div>
                            <div class="animal-name">${fauna[2].name}</div>
                        </div>
                    </div>
                `;
            }
        }

        // 4. Tampilkan section Tiket Saya jika user sudah login
        if (currentUser) {
            const ticketSection = document.getElementById('my-tickets-section');
            if (ticketSection) {
                ticketSection.style.display = 'block';
            }

            const allBookings = dbData.bookings || [];

            // Filter hanya booking milik user yang sedang login
            const myBookings = allBookings.filter(b => b.userId === currentUser.id);

            // Otomatis tandai tiket sebagai 'Selesai' jika tanggal kunjungan sudah berlalu
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const activeTickets = myBookings.filter(b => {
                if (b.status !== 'Aktif') return false;
                // Parse tanggal kunjungan dari format "Jumat, 12 Jun 2026"
                const visitDateObj = new Date(b.visitDate);
                return isNaN(visitDateObj.getTime()) ? true : visitDateObj >= today;
            });

            const totalTickets = myBookings.length;

            // Update tampilan stat card
            document.getElementById('stat-active-tickets').textContent = activeTickets.length;
            document.getElementById('stat-total-tickets').textContent = totalTickets;
        }

    } catch (err) {
        console.error("Gagal memuat data dari db.json:", err);
    }
});

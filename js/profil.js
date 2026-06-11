/**
 * Logika Halaman Profil Pengguna (profil.js)
 * Memvalidasi session login, memuat data dari server, merender e-tiket/ekspedisi,
 * menampilkan fauna favorit, serta mengelola modal edit Informasi Pribadi
 * (ganti nama + upload foto profil).
 */

document.addEventListener('DOMContentLoaded', async () => {
    const DB = window.RagunanDB;
    if (!DB) return;

    // 1. Verifikasi login: redirect ke login jika belum terautentikasi
    const currentUser = DB.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Muat data terbaru dari server
    const dbData = await DB.getDatabaseData();
    const dbUser = dbData.users.find(u => u.id === currentUser.id) || currentUser;

    // 3. Tampilkan nama, foto, dan tanggal bergabung
    document.getElementById('profile-name').textContent = dbUser.fullName;
    const photo = document.getElementById('profile-photo');
    if (photo && dbUser.avatar) {
        photo.src = dbUser.avatar;
    }
    const dateElement = document.querySelector('.member-since');
    if (dateElement) {
        dateElement.textContent = `📍 Anggota Sejak ${dbUser.memberSince || 2026}`;
    }

    // 4. Update statistik profil
    const statBoxes = document.querySelectorAll('.profile-stats .stat-number');
    if (statBoxes.length >= 3 && dbUser.stats) {
        const userBookings = (dbData.bookings || []).filter(b => b.userId === dbUser.id);
        statBoxes[0].textContent = dbUser.stats.kunjungan || 12;
        statBoxes[1].textContent = dbUser.stats.ceritaTersimpan || 8;
        statBoxes[2].textContent = userBookings.length;
    }

    // 5. Render daftar e-tiket / ekspedisi pengguna
    const expeditionsContainer = document.querySelector('.expeditions-section');
    if (expeditionsContainer) {
        expeditionsContainer.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">
                    <span class="icon">🧭</span> Ekspedisi &amp; Tiket Anda
                </h2>
            </div>
        `;

        const userBookings = (dbData.bookings || []).filter(b => b.userId === dbUser.id);

        if (userBookings.length === 0) {
            expeditionsContainer.insertAdjacentHTML('beforeend', `
                <div style="padding: 32px; text-align: center; color: var(--text-muted); background: white; border-radius: 20px; border: 1.5px dashed var(--border); margin-top: 10px;">
                    <p style="margin-bottom: 16px; font-weight: 500;">Belum ada e-tiket atau ekspedisi terdaftar.</p>
                    <button class="btn-scan" onclick="window.location.href='tiketbooking.html'" style="float: none; display: inline-block; padding: 10px 24px; border-radius: 100px;">Pesan Tiket Sekarang</button>
                </div>
            `);
        } else {
            userBookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

            userBookings.forEach(booking => {
                const isCompleted = booking.status === 'Selesai';
                const addonText = booking.addonSchmutzer ? ' + Schmutzer' : '';
                const visitorSummary = `${booking.qtyDewasa} Dewasa${booking.qtyAnak > 0 ? `, ${booking.qtyAnak} Anak` : ''}${addonText}`;

                expeditionsContainer.insertAdjacentHTML('beforeend', `
                    <div class="expedition-card ${isCompleted ? 'dark' : 'light'}" style="margin-bottom: 16px;">
                        <div class="expedition-image" style="background-image: url('https://upload.wikimedia.org/wikipedia/commons/4/4d/Felidae_Panthera_tigris_sumatrae_3.jpg');">
                            <span class="badge" style="background-color: var(--green-deep);">${booking.status}</span>
                        </div>
                        <div class="expedition-content">
                            <div>
                                <div class="expedition-date">📅 ${booking.visitDate} · ${booking.visitTime}</div>
                                <h3 style="font-family: 'Playfair Display', serif; font-weight: 700; margin: 4px 0 8px;">E-Tiket Kunjungan Ragunan</h3>
                                <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-muted);">
                                    Pengunjung: <b>${visitorSummary}</b><br>
                                    Total Bayar: <b>Rp ${booking.total.toLocaleString('id-ID')}</b>
                                </p>
                            </div>
                            <div class="expedition-actions" style="margin-top: 12px;">
                                <button class="btn-scan" onclick="openTicketModal('${booking.id}')">Lihat Tiket</button>
                            </div>
                        </div>
                    </div>
                `);
            });
        }
    }

    // 6. Render fauna favorit secara dinamis
    const favoritesSection = document.querySelector('.favorites-section');
    if (favoritesSection && dbData.fauna && dbData.fauna.length >= 5) {
        favoritesSection.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">
                    <span class="icon">🔖</span> Favorit Liar
                </h2>
            </div>
            <div class="favorite-card" style="background-image: url('${dbData.fauna[0].image}'); cursor: pointer;" onclick="window.location.href='gallery.html'">
                <span class="card-badge">🐯 ${dbData.fauna[0].category}</span>
                <span class="card-title">${dbData.fauna[0].name}</span>
            </div>
            <div class="favorite-card" style="background-image: url('${dbData.fauna[4].image}'); cursor: pointer;" onclick="window.location.href='gallery.html'">
                <span class="card-badge">🦍 ${dbData.fauna[4].category}</span>
                <span class="card-title">${dbData.fauna[4].name}</span>
            </div>
            <div class="favorite-card text-card">
                <span class="card-badge">📝 Catatan Lapangan</span>
                <h4>Upaya Konservasi 2026</h4>
                <p>Baca tentang bagaimana keanggotaan Anda berkontribusi pada restorasi habitat lokal...</p>
            </div>
        `;
    }

    // ─────────────────────────────────────────────────────────────
    // MODAL E-TICKET
    // ─────────────────────────────────────────────────────────────

    // Simpan semua booking user agar bisa diakses oleh openTicketModal
    const allUserBookings = (dbData.bookings || []).filter(b => b.userId === dbUser.id);

    /**
     * Membuka modal e-ticket dan mengisi data booking berdasarkan ID
     */
    window.openTicketModal = function(bookingId) {
        const booking = allUserBookings.find(b => b.id === bookingId);
        if (!booking) return;

        const addonText = booking.addonSchmutzer ? ' + Schmutzer' : '';
        const visitorSummary = `${booking.qtyDewasa} Dewasa${booking.qtyAnak > 0 ? `, ${booking.qtyAnak} Anak` : ''}${addonText}`;
        const isSelesai = booking.status === 'Selesai';

        // Isi konten modal
        document.getElementById('eticket-date').textContent     = booking.visitDate;
        document.getElementById('eticket-time').textContent     = booking.visitTime;
        document.getElementById('eticket-name').textContent     = booking.visitorName;
        document.getElementById('eticket-visitors').textContent = visitorSummary;
        document.getElementById('eticket-total').textContent    = `Rp ${booking.total.toLocaleString('id-ID')}`;
        document.getElementById('eticket-code').textContent     = booking.id;

        // Update badge status
        const badge = document.getElementById('eticket-status');
        badge.textContent = booking.status;
        badge.className   = `eticket-status-badge${isSelesai ? ' selesai' : ''}`;

        // Tampilkan modal
        document.getElementById('ticket-modal-overlay').classList.add('open');
    };

    /** Menutup modal e-ticket */
    window.closeTicketModal = function() {
        document.getElementById('ticket-modal-overlay').classList.remove('open');
    };

    // Klik overlay di luar kartu untuk menutup
    document.getElementById('ticket-modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) window.closeTicketModal();
    });

    // ─────────────────────────────────────────────────────────────
    // MODAL EDIT INFORMASI PRIBADI
    // ─────────────────────────────────────────────────────────────

    // State lokal untuk menyimpan foto baru (sebagai Base64)
    let pendingAvatarBase64 = null;

    /**
     * Membuka modal edit profil dan mengisi data saat ini
     */
    function openEditModal() {
        const overlay = document.getElementById('edit-modal-overlay');
        const nameInput = document.getElementById('edit-name-input');
        const avatarPreview = document.getElementById('modal-avatar-preview');

        nameInput.value = dbUser.fullName || '';
        avatarPreview.src = dbUser.avatar || photo.src;
        pendingAvatarBase64 = null;

        overlay.classList.add('open');
    }

    /**
     * Menutup modal edit profil
     */
    window.closeEditModal = function() {
        document.getElementById('edit-modal-overlay').classList.remove('open');
        pendingAvatarBase64 = null;
    };

    /**
     * Menyimpan perubahan nama dan foto ke database server
     */
    window.saveProfile = async function() {
        const newName = document.getElementById('edit-name-input').value.trim();
        if (!newName) {
            alert('Nama tidak boleh kosong.');
            return;
        }

        const saveBtn = document.querySelector('.btn-save-profile');
        saveBtn.textContent = 'Menyimpan...';
        saveBtn.disabled = true;

        try {
            const currentDb = await (await fetch('/api/db')).json();
            const userIdx = currentDb.users.findIndex(u => u.id === dbUser.id);

            if (userIdx !== -1) {
                currentDb.users[userIdx].fullName = newName;
                if (pendingAvatarBase64) {
                    currentDb.users[userIdx].avatar = pendingAvatarBase64;
                }

                // Simpan ke server
                const res = await fetch('/api/db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentDb)
                });

                if (!res.ok) throw new Error('Gagal menyimpan ke server.');

                // Perbarui session localStorage agar navbar ikut update
                const updatedUser = currentDb.users[userIdx];
                localStorage.setItem('Ragunan_session', JSON.stringify(updatedUser));

                // Update tampilan halaman profil langsung tanpa reload
                document.getElementById('profile-name').textContent = newName;
                if (pendingAvatarBase64) {
                    document.getElementById('profile-photo').src = pendingAvatarBase64;
                }

                window.closeEditModal();
                alert('Profil berhasil diperbarui!');
            }
        } catch (err) {
            console.error(err);
            alert('Gagal menyimpan profil. Coba lagi.');
        } finally {
            saveBtn.textContent = 'Simpan Perubahan';
            saveBtn.disabled = false;
        }
    };

    // Tombol buka modal
    const btnOpen = document.getElementById('btn-open-edit');
    if (btnOpen) btnOpen.addEventListener('click', openEditModal);

    // Klik overlay (di luar modal) untuk menutup
    document.getElementById('edit-modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) window.closeEditModal();
    });

    // Preview foto yang dipilih sebelum disimpan (konversi ke Base64)
    const fileInput = document.getElementById('avatar-file-input');
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            pendingAvatarBase64 = e.target.result;
            document.getElementById('modal-avatar-preview').src = pendingAvatarBase64;
        };
        reader.readAsDataURL(file);
    });
});

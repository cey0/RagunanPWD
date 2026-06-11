/**
 * RagunanDB - Klien Database Berbasis File JSON.
 * Berkomunikasi dengan server Node.js lokal untuk membaca dan menulis data ke db.json.
 */
(function () {
    // Alamat API Server lokal dan Kunci Session Storage
    const API_URL = 'http://localhost:3000';
    const SESSION_KEY = 'Ragunan_session';

    // Cadangan memori data lokal jika server offline
    let dbInMemory = { users: [], bookings: [], settings: {} };

    /**
     * Membaca seluruh database dari server lokal (db.json)
     */
    async function fetchDB() {
        try {
            const response = await fetch(`${API_URL}/api/db`);
            if (response.ok) {
                dbInMemory = await response.json();
            }
        } catch (error) {
            console.warn("Server offline. Membaca data dari db.json gagal.", error);
        }
    }

    // Ekspor fungsi publik klien database
    const DB = {
        /**
         * Mendaftarkan pengguna baru ke database (dikirim via POST ke server)
         */
        async registerUser({ fullName, email, password }) {
            try {
                const response = await fetch(`${API_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, email, password })
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Terjadi kesalahan saat pendaftaran.');
                }
                return result.user; // Mengembalikan objek data pengguna baru
            } catch (error) {
                throw error;
            }
        },

        /**
         * Memverifikasi kredensial login pengguna
         */
        async loginUser({ email, password }) {
            await fetchDB();
            // Cari pengguna dengan email dan password yang cocok
            const user = dbInMemory.users.find(u => 
                (u.email.toLowerCase() === email.toLowerCase()) && 
                u.password === password
            );

            if (!user) {
                throw new Error('Email atau password salah!');
            }

            // Simpan informasi sesi aktif ke localStorage
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            return user;
        },

        /**
         * Mendapatkan data pengguna yang sedang login saat ini dari sesi lokal
         */
        getCurrentUser() {
            const session = localStorage.getItem(SESSION_KEY);
            return session ? JSON.parse(session) : null;
        },

        /**
         * Membaca seluruh data mentah dari database (untuk sinkronisasi dashboard & profil)
         */
        async getDatabaseData() {
            await fetchDB();
            return dbInMemory;
        },

        /**
         * Menghapus sesi pengguna saat ini dan mengarahkan kembali ke halaman login
         */
        logoutUser() {
            localStorage.removeItem(SESSION_KEY);
            window.location.href = 'login.html';
        }
    };

    // Daftarkan modul ke objek window browser global
    window.RagunanDB = DB;
})();

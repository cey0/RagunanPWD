/**
 * Logika Halaman Login (login.js)
 * Mengelola form input email/password, pesan alert,
 * autentikasi dengan database, dan redirect session.
 */

document.addEventListener('DOMContentLoaded', () => {
    const DB = window.RagunanDB;
    const form = document.getElementById('loginForm');
    const alertMsg = document.getElementById('alertMsg');

    if (!DB) {
        console.error("Database script (db.js) failed to load.");
        return;
    }

    /**
     * Menampilkan alert error/sukses pada form login
     */
    function showAlert(message, isError = true) {
        alertMsg.className = 'p-3 rounded-lg text-sm font-body-md mb-3 transition-all';
        if (isError) {
            alertMsg.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-300');
        } else {
            alertMsg.classList.add('bg-green-100', 'text-green-700', 'border', 'border-green-300');
        }
        alertMsg.textContent = message;
        alertMsg.classList.remove('hidden');
    }

    /**
     * Menyembunyikan pesan alert
     */
    function hideAlert() {
        alertMsg.classList.add('hidden');
    }

    // Event Listener saat form login disubmit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validasi input wajib diisi
        if (!email || !password) {
            showAlert('Email dan password harus diisi!');
            return;
        }

        // Tampilkan status loading pada tombol submit
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        try {
            // Lakukan login menggunakan client db.js
            await DB.loginUser({ email, password });
            showAlert('Login berhasil! Mengalihkan...', false);
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (err) {
            // Tampilkan pesan error jika login gagal
            showAlert(err.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });

    // Proteksi: Jika pengguna sudah login, langsung alihkan ke halaman dashboard
    const user = DB.getCurrentUser();
    if (user) {
        window.location.href = 'dashboard.html';
    }
});

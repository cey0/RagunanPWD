// Tentukan kelas active secara dinamis berdasarkan URL halaman induk
try {
    const parentUrl = window.parent.location.pathname;
    if (parentUrl.includes("dashboard.html")) {
        document.getElementById("link-dashboard").classList.add("active");
    } else if (parentUrl.includes("discovery.html")) {
        document.getElementById("link-discovery").classList.add("active");
    } else if (parentUrl.includes("gallery.html")) {
        document.getElementById("link-gallery").classList.add("active");
    } else if (parentUrl.includes("tiketbooking.html")) {
        document.getElementById("link-booking").classList.add("active");
    }
} catch (e) {
    console.error("Gagal mendeteksi URL induk:", e);
}

// Tampilkan tombol dinamis berdasarkan status login
document.addEventListener('DOMContentLoaded', () => {
    const DB = window.RagunanDB;
    const navRight = document.querySelector('.nav-right');
    
    if (DB) {
        const user = DB.getCurrentUser();
        if (user) {
            // Jika user sudah masuk, ubah tombol menjadi link ke Profil & Logout
            navRight.innerHTML = `
                <a href="profil.html" target="_parent" class="btn-sign" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                    <img src="${user.avatar || '../assets/anonym.jpg'}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
                    <span>${user.fullName.split(' ')[0]}</span>
                </a>
                <button class="btn-join" id="btn-logout" style="background: #a94442;">Keluar</button>
            `;

            document.getElementById('btn-logout').addEventListener('click', () => {
                DB.logoutUser();
                window.parent.location.href = 'login.html';
            });
        } else {
            // Jika belum masuk, arahkan tombol Masuk & Gabung ke login / register
            navRight.querySelector('.btn-sign').addEventListener('click', () => {
                window.parent.location.href = 'login.html';
            });
            navRight.querySelector('.btn-join').addEventListener('click', () => {
                window.parent.location.href = 'register.html';
            });
        }
    }
});

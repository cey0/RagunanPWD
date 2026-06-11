/**
 * Logika Halaman Discovery (discovery.js)
 * Mengelola pemuatan data profile explorer dinamis untuk user terautentikasi.
 */

document.addEventListener('DOMContentLoaded', () => {
    const DB = window.RagunanDB;
    const currentUser = DB.getCurrentUser();
    
    // Verifikasi login: Jika user teridentifikasi, render data profil
    if (currentUser) {
        document.getElementById('profile-name').textContent = currentUser.fullName;
        const dateElement = document.querySelector('.member-since');
        if (dateElement) {
            dateElement.textContent = `📍 Anggota Sejak ${currentUser.memberSince || 2026}`;
        }
        
        // Update statistik secara dinamis dari stats user session
        const statBoxes = document.querySelectorAll('.profile-stats .stat-number');
        if (statBoxes.length >= 3 && currentUser.stats) {
            statBoxes[0].textContent = currentUser.stats.kunjungan || 0;
            statBoxes[1].textContent = currentUser.stats.ceritaTersimpan || 0;
            statBoxes[2].textContent = currentUser.stats.mendatang || 0;
        }
    } else {
        // Redirect jika user belum login
        window.location.href = 'login.html';
    }
});

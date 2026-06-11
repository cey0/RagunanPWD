/**
 * Logika Halaman Pilih Jadwal Booking (tiketbooking.js)
 * Mengelola tampilan kalender scroll (5 hari terlihat, bisa geser ke depan/belakang),
 * pemilihan slot waktu, dan transisi ke halaman pengunjung.
 */

document.addEventListener('DOMContentLoaded', () => {
    const dateContainer = document.getElementById('dynamic-dates');
    const summaryDateVal = document.getElementById('summary-date-val');
    const summaryTimeVal = document.getElementById('summary-time-val');
    const summaryTotalVal = document.getElementById('summary-total-val');
    
    const daysIndonesia = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const monthsIndonesia = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

    // Tanggal awal tampilan kalender (hari ini)
    const todayBase = new Date();
    todayBase.setHours(0, 0, 0, 0);
    let windowStart = new Date(todayBase); // Indeks awal jendela kalender yang terlihat

    // Default pilih besok; jika besok Senin (tutup), pilih lusa
    let defaultSelectedDate = new Date(todayBase);
    defaultSelectedDate.setDate(defaultSelectedDate.getDate() + 1);
    if (defaultSelectedDate.getDay() === 1) {
        defaultSelectedDate.setDate(defaultSelectedDate.getDate() + 1);
    }
    let selectedDate = defaultSelectedDate;

    // // Jika diarahkan dari Quick Booking di dashboard, sinkronisasi tanggal
    // const draftData = sessionStorage.getItem('booking_draft');
    // if (draftData) {
    //     const draft = JSON.parse(draftData);
    //     if (draft.hasQuickRedirect && draft.quickDateKey) {
    //         const qDate = new Date(draft.quickDateKey);
    //         selectedDate = qDate;
    //         let startWindow = new Date(qDate);
    //         startWindow.setDate(startWindow.getDate() - 2);
    //         if (startWindow < todayBase) {
    //             windowStart = new Date(todayBase);
    //         } else {
    //             windowStart = startWindow;
    //         }
    //     }
    // }

    /**
     * Merender 5 kartu tanggal berdasarkan posisi windowStart saat ini.
     * Menyertakan tombol panah Prev/Next untuk navigasi antar minggu.
     */
    function renderCalendar() {
        dateContainer.innerHTML = '';

        // Tombol PREV: kembali 5 hari (disable jika sudah di hari ini atau lebih awal)
        const prevBtn = document.createElement('button');
        prevBtn.className = 'date-nav-btn';
        prevBtn.innerHTML = '‹';
        const isPrevDisabled = windowStart <= todayBase;
        prevBtn.disabled = isPrevDisabled;
        prevBtn.style.opacity = isPrevDisabled ? '0.3' : '1';
        prevBtn.style.cursor = isPrevDisabled ? 'not-allowed' : 'pointer';
        prevBtn.addEventListener('click', () => {
            const newStart = new Date(windowStart);
            newStart.setDate(newStart.getDate() - 5);
            windowStart = newStart < todayBase ? new Date(todayBase) : newStart;
            renderCalendar();
        });
        dateContainer.appendChild(prevBtn);

        // Render 5 kartu tanggal
        for (let i = 0; i < 5; i++) {
            let tempDate = new Date(windowStart);
            tempDate.setDate(windowStart.getDate() + i);

            const dayName = daysIndonesia[tempDate.getDay()];
            const dateNum = tempDate.getDate();
            const monthName = monthsIndonesia[tempDate.getMonth()];
            const yearNum = tempDate.getFullYear();

            const isWeekend = tempDate.getDay() === 0 || tempDate.getDay() === 6;
            const isSelected = tempDate.toDateString() === selectedDate.toDateString();
            const isMonday = tempDate.getDay() === 1; // Hari Senin tutup

            const card = document.createElement('div');
            card.className = `date-card ${isSelected ? 'selected' : ''} ${isMonday ? 'disabled' : ''}`;
            
            let peakBadgeHtml = isWeekend ? '<div class="peak-badge">Puncak</div>' : '';
            card.innerHTML = `
                ${peakBadgeHtml}
                <div class="date-day">${dayName}</div>
                <div class="date-number">${dateNum}</div>
                <div class="date-month">${isMonday ? 'TUTUP' : monthName}</div>
            `;

            if (!isMonday) {
                card.addEventListener('click', () => {
                    selectedDate = tempDate;
                    renderCalendar();
                });
            }
            dateContainer.appendChild(card);

            if (isSelected) {
                summaryDateVal.textContent = `${dayName.charAt(0) + dayName.slice(1).toLowerCase()}, ${dateNum} ${monthName} ${yearNum}`;
                summaryTotalVal.textContent = isWeekend ? 'Rp 7.500' : 'Rp 4.000';
            }
        }

        // Tombol NEXT: maju 5 hari ke depan (tidak ada batas maksimum)
        const nextBtn = document.createElement('button');
        nextBtn.className = 'date-nav-btn';
        nextBtn.innerHTML = '›';
        nextBtn.addEventListener('click', () => {
            windowStart.setDate(windowStart.getDate() + 5);
            renderCalendar();
        });
        dateContainer.appendChild(nextBtn);
    }

    // Pemilihan slot waktu kedatangan
    const timeCards = document.querySelectorAll('.time-card');
    timeCards.forEach(card => {
        card.addEventListener('click', () => {
            timeCards.forEach(c => {
                c.classList.remove('selected');
                const badge = c.querySelector('.check-badge');
                if (badge) badge.remove();
            });
            card.classList.add('selected');
            card.insertAdjacentHTML('afterbegin', '<div class="check-badge">✓</div>');
            summaryTimeVal.textContent = card.getAttribute('data-time');
        });
    });

    /**
     * Melanjutkan ke halaman detail pengunjung dengan menyimpan draft ke sessionStorage
     */
    window.continueToVisitors = function() {
        if (!selectedDate) {
            alert("Silakan pilih tanggal kunjungan terlebih dahulu.");
            return;
        }
        const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
        const draft = {
            dateStr: summaryDateVal.textContent,
            timeStr: summaryTimeVal.textContent,
            isWeekend: isWeekend
        };
        sessionStorage.setItem('booking_draft', JSON.stringify(draft));
        window.location.href = 'tiketpengunjung.html';
    };

    renderCalendar();
});

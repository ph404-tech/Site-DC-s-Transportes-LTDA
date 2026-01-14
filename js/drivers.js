document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Set User Profile in Header (Shared Logic, simpler to repeat small part than import complex module)
    const currentUser = Auth.getCurrentUser();
    const profileName = document.querySelector('.user-profile span');
    const profileAvatarDiv = document.querySelector('.user-profile .avatar');

    if (profileName) profileName.textContent = currentUser.name;
    if (currentUser.avatar && profileAvatarDiv) {
        profileAvatarDiv.innerHTML = '';
        profileAvatarDiv.style.backgroundImage = `url(${currentUser.avatar})`;
        profileAvatarDiv.style.backgroundSize = 'cover';
        profileAvatarDiv.style.backgroundPosition = 'center';
        profileAvatarDiv.style.border = '2px solid var(--accent)';
    }

    // --- Logic ---
    const users = JSON.parse(localStorage.getItem('ets2_users')) || [];
    const trips = JSON.parse(localStorage.getItem('ets2_trips')) || [];
    const fines = JSON.parse(localStorage.getItem('ets2_fines')) || [];
    const driversList = document.getElementById('drivers-list');
    const monthFilter = document.getElementById('month-filter');

    // Set Default Month to Current
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
    if (monthFilter) {
        monthFilter.value = currentMonth;
        monthFilter.addEventListener('change', () => {
            renderDrivers(monthFilter.value);
        });
    }

    function getLevel(km) {
        if (km < 1000) return "Iniciante";
        if (km < 5000) return "Amador";
        if (km < 10000) return "Caminhoneiro";
        if (km < 50000) return "Rei da Estrada";
        return "Lenda";
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('pt-BR').format(num);
    }

    function formatCurrency(num) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR' }).format(num);
    }

    function renderDrivers(selectedMonth) {
        // Calculate stats for each user based on selected month
        const driversStats = users.map(user => {
            // Filter trips by month
            const userTrips = trips.filter(t => {
                if (t.userEmail !== user.email) return false;
                if (!t.date) return false; // Safety check
                return t.date.startsWith(selectedMonth);
            });

            // Filter fines by month
            const userFines = fines.filter(f => {
                if (f.userEmail !== user.email) return false;
                if (!f.date) return false;
                return f.date.startsWith(selectedMonth);
            });

            const totalKm = userTrips.reduce((acc, t) => acc + parseInt(t.distance), 0);
            const tripsIncome = userTrips.reduce((acc, t) => acc + (parseInt(t.income) || 0), 0);
            const finesCost = userFines.reduce((acc, f) => acc + (parseInt(f.cost) || 0), 0);

            const netProfit = tripsIncome - finesCost;

            return {
                ...user,
                totalKm,
                totalIncome: netProfit,
                tripsCount: userTrips.length,
                finesCount: userFines.length,
                level: getLevel(totalKm)
            };
        });

        // Sort by Total KM (Highest first)
        driversStats.sort((a, b) => b.totalKm - a.totalKm);

        // Render
        driversList.innerHTML = '';
        const isAdmin = currentUser.email === 'pedro.silva.vrrm@gmail.com';

        if (driversStats.length === 0) {
            driversList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Nenhum motorista encontrado para este período.</p>';
            return;
        }

        driversStats.forEach((driver, index) => {
            const card = document.createElement('div');
            card.className = 'driver-card';

            // Avatar HTML
            let avatarHtml = `<i class="ph ph-user"></i>`;
            if (driver.avatar) {
                avatarHtml = `<img src="${driver.avatar}" alt="${driver.name}">`;
            }

            // Rank Badge
            let rankClass = '';
            if (index === 0) rankClass = 'rank-1';
            if (index === 1) rankClass = 'rank-2';
            if (index === 2) rankClass = 'rank-3';

            // Delete Button (Admin Only)
            let deleteBtnHtml = '';
            if (isAdmin && driver.email !== currentUser.email) {
                deleteBtnHtml = `
                    <button class="icon-btn delete-user-btn" data-email="${driver.email}" style="position: absolute; top: 1rem; left: 1rem; color: var(--danger); background: rgba(0,0,0,0.5); width: 32px; height: 32px; padding: 0; justify-content: center; border-radius: 50%;">
                        <i class="ph ph-trash"></i>
                    </button>
                `;
            }

            card.innerHTML = `
                ${deleteBtnHtml}
                <div class="rank-badge ${rankClass}">${index + 1}º</div>
                <div class="driver-avatar">
                    ${avatarHtml}
                </div>
                <div class="driver-name">${driver.name}</div>
                <div class="driver-level">${driver.level}</div>
                
                <div class="driver-stats">
                    <div class="stat">
                        <h5>TOTAL KMs</h5>
                        <span>${formatNumber(driver.totalKm)} km</span>
                    </div>
                    <div class="stat">
                        <h5>VIAGENS</h5>
                        <span>${driver.tripsCount}</span>
                    </div>
                    <div class="stat">
                        <h5>LUCRO</h5>
                        <span style="color: var(--accent);">${formatCurrency(driver.totalIncome)}</span>
                    </div>
                    <div class="stat">
                        <h5>MULTAS</h5>
                        <span style="color: var(--danger);">${driver.finesCount}</span>
                    </div>
                </div>
            `;

            driversList.appendChild(card);
        });

        // Re-attach Modal Logic (since elements were recreated if we used innerHTML on parent, but buttons are new)
        // Actually, we use event delegation or re-attach. The previous modal logic used document.querySelectorAll which runs ONCE on load.
        // We need to re-run the listener attachment or use delegation.
        attachDeleteListeners();
    }

    function attachDeleteListeners() {
        // Open Modal
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent card click
                userToDeleteEmail = btn.getAttribute('data-email');
                if (deleteModal) deleteModal.classList.add('active');
            });
        });
    }

    // Initial Render
    renderDrivers(currentMonth);

    // --- Modal Logic ---
    const deleteModal = document.getElementById('delete-modal');
    const closeDeleteModal = document.getElementById('close-delete-modal');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    let userToDeleteEmail = null;


    // Close Modal
    const closeModal = () => {
        deleteModal.classList.remove('active');
        userToDeleteEmail = null;
    };

    if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeModal);
    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeModal);

    // Confirm Delete
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', () => {
            if (userToDeleteEmail) {
                deleteUser(userToDeleteEmail);
                closeModal();
            }
        });
    }

    function deleteUser(email) {
        let allUsers = JSON.parse(localStorage.getItem('ets2_users')) || [];
        let allTrips = JSON.parse(localStorage.getItem('ets2_trips')) || [];
        let allFines = JSON.parse(localStorage.getItem('ets2_fines')) || [];

        // Filter out
        const newUsers = allUsers.filter(u => u.email !== email);
        const newTrips = allTrips.filter(t => t.userEmail !== email);
        const newFines = allFines.filter(f => f.userEmail !== email);

        // Save
        localStorage.setItem('ets2_users', JSON.stringify(newUsers));
        localStorage.setItem('ets2_trips', JSON.stringify(newTrips));
        localStorage.setItem('ets2_fines', JSON.stringify(newFines));

        // Refresh Page
        location.reload();
    }
});

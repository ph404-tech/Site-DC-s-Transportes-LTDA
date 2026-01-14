document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let trips = JSON.parse(localStorage.getItem('ets2_trips')) || [];

    // --- DOM Elements ---
    const tripsListContainer = document.getElementById('trips-list');
    const btnClearHistory = document.getElementById('btn-clear-history');

    // Telemetry Elements


    // --- Functions ---

    function calculateTotal() {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return 0;
        return trips
            .filter(trip => trip.userEmail === currentUser.email)
            .reduce((acc, trip) => acc + parseInt(trip.distance), 0);
    }

    function calculateTotalLoads() {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return 0;
        return trips.filter(trip => trip.userEmail === currentUser.email).length;
    }

    // Keep getLevel for internal use if needed, or remove if unused in this file.
    // It is used here effectively only if we need it for something else?
    // Actually drivers.js has its own getLevel via copy/paste or similar.
    // Let's keep it here just in case we re-add something later, but remove DOM updates.

    function formatNumber(num) {
        return new Intl.NumberFormat('pt-BR').format(num);
    }

    function updateStats() {
        const total = calculateTotal();
        const loads = calculateTotalLoads();

        // Overview Section
        const mainKm = document.getElementById('main-total-km');
        const mainLoads = document.getElementById('main-total-loads');
        if (mainKm) mainKm.textContent = `${formatNumber(total)} km`;
        if (mainLoads) mainLoads.textContent = `${loads}`;
    }

    function renderTrips() {
        if (!tripsListContainer) return;

        tripsListContainer.innerHTML = '';
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        const userTrips = trips.filter(trip => trip.userEmail === currentUser.email);

        if (userTrips.length === 0) {
            tripsListContainer.innerHTML = `
                <div class="empty-state">
                    <i class="ph ph-road-horizon"></i>
                    <p>Nenhuma viagem registrada ainda.</p>
                </div>
            `;
            return;
        }

        // Show newest first
        [...userTrips].reverse().forEach(trip => {
            const card = document.createElement('div');
            card.className = 'trip-card';

            // Format income if exists
            const incomeHtml = trip.income
                ? `<div class="trip-income">+€ ${formatNumber(trip.income)}</div>`
                : '';

            const dateStr = trip.date ? new Date(trip.date).toLocaleDateString('pt-BR') : 'Data desconhecida';

            card.innerHTML = `
                <div class="trip-info">
                    <div class="trip-route">
                        ${trip.source} <i class="ph ph-arrow-right"></i> ${trip.destination}
                    </div>
                    <div class="trip-meta">
                        ${trip.cargo ? `Cargo: ${trip.cargo}` : 'Carga desconhecida'} 
                        <span style="font-size: 0.8em; opacity: 0.7; margin-left: 10px;">${dateStr}</span>
                    </div>
                </div>
                <div class="trip-stats">
                    <div class="trip-km">${formatNumber(trip.distance)} km</div>
                    ${incomeHtml}
                </div>
            `;
            tripsListContainer.appendChild(card);
        });
    }

    function saveTrips() {
        localStorage.setItem('ets2_trips', JSON.stringify(trips));
        updateStats();
        renderTrips();
    }

    function clearHistory() {
        if (confirm('Tem certeza que deseja apagar todo o histórico de viagens?')) {
            trips = [];
            saveTrips();
        }
    }

    // --- Monthly Stats Logic ---
    function getMonthName(dateString) {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${year}`;
    }

    function calculateMonthlyStats() {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return {};

        const userTrips = trips.filter(trip => trip.userEmail === currentUser.email);
        const stats = {};

        userTrips.forEach(trip => {
            const date = trip.date ? new Date(trip.date) : new Date();
            // Create a sortable key YYYY-MM
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!stats[key]) {
                stats[key] = {
                    key: key,
                    name: getMonthName(trip.date),
                    km: 0,
                    loads: 0
                };
            }
            stats[key].km += parseInt(trip.distance) || 0;
            stats[key].loads += 1;
        });

        // Convert object to array and sort by date descending
        return Object.values(stats).sort((a, b) => b.key.localeCompare(a.key));
    }

    function renderMonthlyStats() {
        const container = document.getElementById('monthly-stats-grid');
        if (!container) return;

        container.innerHTML = '';
        const stats = calculateMonthlyStats();

        if (stats.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 2rem;">
                    <p>Nenhuma estatística mensal disponível.</p>
                </div>
            `;
            return;
        }

        stats.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'month-card';
            card.innerHTML = `
                <div class="month-header">
                    <span class="month-name">${stat.name}</span>
                    <i class="ph ph-calendar-blank" style="color: var(--accent);"></i>
                </div>
                <div class="month-stats">
                    <div class="stat-item">
                        <div class="stat-label">Cargas</div>
                        <div class="stat-value">${stat.loads}</div>
                    </div>
                    <div class="stat-item" style="text-align: right;">
                        <div class="stat-label">Distância</div>
                        <div class="stat-value">${formatNumber(stat.km)} km</div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }



    // --- Event Listeners ---
    if (btnClearHistory) btnClearHistory.addEventListener('click', clearHistory);

    // Mobile Menu Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    function toggleMobileMenu() {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleMobileMenu);
    }

    // --- Init ---
    if (typeof Auth !== 'undefined' && Auth.getCurrentUser()) {
        const user = Auth.getCurrentUser();
        const profileName = document.querySelector('.user-profile span');
        const profileAvatarDiv = document.querySelector('.user-profile .avatar');

        if (profileName) profileName.textContent = user.name;
        if (user.avatar && profileAvatarDiv) {
            profileAvatarDiv.innerHTML = '';
            profileAvatarDiv.style.backgroundImage = `url(${user.avatar})`;
            profileAvatarDiv.style.backgroundSize = 'cover';
            profileAvatarDiv.style.backgroundPosition = 'center';
            profileAvatarDiv.style.border = '2px solid var(--accent)';
        }

        // Show Admin Link if Admin
        if (user.email === 'pedro.silva.vrrm@gmail.com') {
            const adminNav = document.getElementById('nav-admin');
            if (adminNav) {
                adminNav.style.display = 'block';
            }
        }
    }

    updateStats();
    renderTrips();

    // --- Telemetry Integration (Electron) ---
    // Check if we are running in Electron
    if (window.electronAPI) {
        console.log("Electron Environment Detected. Starting Telemetry Polling...");

        // Polling state
        let lastJobState = false;
        let lastTimestamp = 0;
        let lastFineStatus = false; // To prevent adding the same fine multiple times

        setInterval(async () => {
            try {
                const data = await window.electronAPI.getTelemetry();

                if (data && data.connected) {
                    // 1. Sync Total KM (Odometer)
                    // If we have a valid odometer reading from the truck, update the display
                    if (data.odometer && data.odometer > 0) {
                        const totalKm = Math.floor(data.odometer);
                        if (totalKmDisplay) totalKmDisplay.textContent = `${formatNumber(totalKm)} km`;
                        if (driverLevelDisplay) driverLevelDisplay.textContent = getLevel(totalKm);
                    }

                    // 2. Update Status UI
                    // 2. Update Status UI
                    // Removed status text update

                    // 3. Job Finished Logic
                    // If job went from ACTIVE -> INACTIVE, it's a finished trip
                    if (lastJobState === true && data.job_active === false) {
                        const now = Date.now();
                        if (now - lastTimestamp > 5000) {
                            lastTimestamp = now;

                            if (data.trip_distance > 1) {
                                const newTrip = {
                                    id: Date.now(),
                                    userEmail: Auth.getCurrentUser().email,
                                    source: data.source,
                                    destination: data.destination,
                                    distance: Math.round(data.trip_distance),
                                    cargo: data.cargo,
                                    income: data.income,
                                    date: new Date().toISOString()
                                };

                                trips.push(newTrip);
                                saveTrips();

                                new Notification("Viagem Finalizada!", {
                                    body: `${data.source} -> ${data.destination} (${Math.round(data.trip_distance)}km)`,
                                });
                            }
                        }
                    }
                    lastJobState = data.job_active;

                    // 4. Fine Detection Logic
                    // The metrics 'fine_detected' comes from our updated DLL
                    if (data.fine_detected === true) {
                        if (!lastFineStatus) {
                            // New fine!
                            const newFine = {
                                id: Date.now(),
                                userEmail: Auth.getCurrentUser().email,
                                type: data.fine_type || "Infração Desconhecida",
                                amount: data.fine_amount || 0,
                                date: new Date().toISOString()
                            };

                            let fines = JSON.parse(localStorage.getItem('ets2_fines')) || [];
                            fines.push(newFine);
                            localStorage.setItem('ets2_fines', JSON.stringify(fines));

                            // Notify user
                            new Notification("Multa Recebida!", {
                                body: `-€ ${newFine.amount}: ${newFine.type}`,
                            });

                            // If we are on the fines page, refresh the list? 
                            // Better: trigger a custom event or just let the fines page poll
                            window.dispatchEvent(new Event('storage'));
                        }
                        lastFineStatus = true;
                    } else {
                        lastFineStatus = false;
                    }

                } else {
                    // updateConnectionStatus(false);
                }
            } catch (e) {
                console.error("Telemetry Error", e);
                // updateConnectionStatus(false);
            }
        }, 1000);
    }
});

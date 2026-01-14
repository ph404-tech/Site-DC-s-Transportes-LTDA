document.addEventListener('DOMContentLoaded', () => {
    // --- Auth Check ---
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const currentUser = Auth.getCurrentUser();

    // --- DOM Elements ---
    const nameDisplay = document.getElementById('profile-name-display');
    const emailDisplay = document.getElementById('profile-email-display');
    const editNameInput = document.getElementById('edit-name');
    const editPassInput = document.getElementById('edit-password');
    const profileForm = document.getElementById('profile-form');

    const quotaDisplay = document.getElementById('current-quota-display');
    const quotaDriven = document.getElementById('quota-driven');
    const quotaRemaining = document.getElementById('quota-remaining');
    const quotaProgressFill = document.getElementById('quota-progress-fill');
    const quotaPercentage = document.getElementById('quota-percentage');

    // Quota edit elements removed
    const quotaModal = document.getElementById('quota-modal');
    // ... potentially unused but harmless if null unless used
    const btnCloseQuotaModal = document.getElementById('btn-close-quota-modal');
    const quotaForm = document.getElementById('quota-form');
    const quotaInput = document.getElementById('input-quota');

    // Avatar
    const avatarContainer = document.getElementById('avatar-container');
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarImg = document.getElementById('profile-avatar-img');
    const defaultAvatarIcon = document.getElementById('default-avatar-icon');

    // --- State ---
    // User Settings (Goal) - Stored in separate object or extend user object? 
    // Let's extend user object locally first, but remember trips are separate.
    // Actually, let's store "user_preferences_[email]" in localStorage to keep it simple.

    const prefKey = `ets2_prefs_${currentUser.email}`;
    let userPrefs = JSON.parse(localStorage.getItem(prefKey)) || { goal: 10000 };

    // Trips (needed for calc)
    const trips = JSON.parse(localStorage.getItem('ets2_trips')) || [];

    // --- Functions ---

    function updateAvatarDisplay(base64Image) {
        if (base64Image) {
            avatarImg.src = base64Image;
            avatarImg.style.display = 'block';
            defaultAvatarIcon.style.display = 'none';
        } else {
            avatarImg.style.display = 'none';
            defaultAvatarIcon.style.display = 'block';
        }
    }

    function loadProfileData() {
        nameDisplay.textContent = currentUser.name;
        emailDisplay.textContent = currentUser.email;
        editNameInput.value = currentUser.name;

        // Load avatar
        updateAvatarDisplay(currentUser.avatar);
    }

    function calculateStats() {
        const totalDriven = trips.reduce((acc, trip) => acc + parseInt(trip.distance), 0);
        const goal = userPrefs.goal || 10000;

        let remaining = goal - totalDriven;
        if (remaining < 0) remaining = 0;

        let percentage = (totalDriven / goal) * 100;
        if (percentage > 100) percentage = 100;

        // Update UI
        quotaDriven.textContent = `${new Intl.NumberFormat('pt-BR').format(totalDriven)} km`;
        quotaRemaining.textContent = `${new Intl.NumberFormat('pt-BR').format(remaining)} km`;
        quotaDisplay.textContent = new Intl.NumberFormat('pt-BR').format(goal);

        quotaProgressFill.style.width = `${percentage}%`;
        quotaPercentage.textContent = `${Math.round(percentage)}%`;

        if (percentage >= 100) {
            quotaProgressFill.style.backgroundColor = 'var(--success)';
        }
    }

    function saveProfile(e) {
        e.preventDefault();
        const newName = editNameInput.value;
        const newPass = editPassInput.value;

        // Update user in User List
        const users = JSON.parse(localStorage.getItem('ets2_users')) || [];
        const userIndex = users.findIndex(u => u.email === currentUser.email);

        if (userIndex !== -1) {
            users[userIndex].name = newName;
            if (newPass) users[userIndex].password = newPass; // Insecure but consistent with current design

            localStorage.setItem('ets2_users', JSON.stringify(users));

            // Update session if needed (we rely on email mostly, but name is used)
            // But auth.js getCurrentUser fetches fresh from list, so we are good.

            alert('Perfil atualizado com sucesso!');
            location.reload();
        }
    }

    function saveQuota(e) {
        e.preventDefault();
        const newGoal = parseInt(quotaInput.value);
        if (newGoal > 0) {
            userPrefs.goal = newGoal;
            localStorage.setItem(prefKey, JSON.stringify(userPrefs));

            calculateStats();
            closeQuotaModal();
        }
    }

    function openQuotaModal() {
        quotaInput.value = userPrefs.goal;
        quotaModal.classList.add('active');
    }

    function closeQuotaModal() {
        quotaModal.classList.remove('active');
    }

    function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert('A imagem é muito grande. Por favor escolha uma imagem menor que 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = function () {
            const base64String = reader.result;

            // Save immediately or wait for save form? Let's save immediately for better UX
            const users = JSON.parse(localStorage.getItem('ets2_users')) || [];
            const userIndex = users.findIndex(u => u.email === currentUser.email);

            if (userIndex !== -1) {
                users[userIndex].avatar = base64String;
                localStorage.setItem('ets2_users', JSON.stringify(users));

                // Update local currentUser reference? 
                // Auth.getCurrentUser fetches from LS, so we just need to refresh UI
                updateAvatarDisplay(base64String);
            }
        }
        reader.readAsDataURL(file);
    }

    // --- Event Listeners ---
    avatarContainer.addEventListener('click', () => {
        avatarUpload.click();
    });

    avatarContainer.addEventListener('mouseover', () => {
        document.querySelector('.avatar-overlay').style.opacity = '1';
    });
    avatarContainer.addEventListener('mouseout', () => {
        document.querySelector('.avatar-overlay').style.opacity = '0';
    });

    avatarUpload.addEventListener('change', handleAvatarUpload);

    profileForm.addEventListener('submit', saveProfile);
    btnCloseQuotaModal.addEventListener('click', closeQuotaModal);
    quotaForm.addEventListener('submit', saveQuota);

    // --- Delete Account Logic ---
    const btnDeleteAccount = document.getElementById('btn-delete-account');
    const deleteProfileModal = document.getElementById('delete-profile-modal');
    const closeProfileModal = document.getElementById('close-profile-modal');
    const btnConfirmProfileDelete = document.getElementById('btn-confirm-profile-delete');
    const btnCancelProfileDelete = document.getElementById('btn-cancel-profile-delete');

    if (btnDeleteAccount) {
        btnDeleteAccount.addEventListener('click', () => {
            deleteProfileModal.classList.add('active');
        });
    }

    const closeDelModal = () => {
        deleteProfileModal.classList.remove('active');
    };

    if (closeProfileModal) closeProfileModal.addEventListener('click', closeDelModal);
    if (btnCancelProfileDelete) btnCancelProfileDelete.addEventListener('click', closeDelModal);

    if (btnConfirmProfileDelete) {
        btnConfirmProfileDelete.addEventListener('click', () => {
            const users = JSON.parse(localStorage.getItem('ets2_users')) || [];
            const newUsers = users.filter(u => u.email !== currentUser.email);

            // Clean up trips and fines as well
            let trips = JSON.parse(localStorage.getItem('ets2_trips')) || [];
            let fines = JSON.parse(localStorage.getItem('ets2_fines')) || [];

            trips = trips.filter(t => t.userEmail !== currentUser.email);
            fines = fines.filter(f => f.userEmail !== currentUser.email);

            localStorage.setItem('ets2_users', JSON.stringify(newUsers));
            localStorage.setItem('ets2_trips', JSON.stringify(trips));
            localStorage.setItem('ets2_fines', JSON.stringify(fines));

            // Logout
            Auth.logout();
        });
    }

    quotaModal.addEventListener('click', (e) => {
        if (e.target === quotaModal) closeQuotaModal();
    });

    // --- Init ---
    loadProfileData();
    calculateStats();
});

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const finesListContainer = document.getElementById('fines-list');
    const totalFinesDisplay = document.getElementById('total-fines-display');
    const btnAddFine = document.getElementById('btn-add-fine');
    const modalOverlay = document.getElementById('add-fine-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const fineForm = document.getElementById('fine-form');

    // Load Fines
    let fines = JSON.parse(localStorage.getItem('ets2_fines')) || [];

    // Helper: Format Currency
    function formatCurrency(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR' }).format(val);
    }

    function calculateTotalFines() {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return 0;
        return fines
            .filter(f => f.userEmail === currentUser.email)
            .reduce((acc, f) => acc + parseInt(f.amount), 0);
    }

    function renderFines() {
        if (!finesListContainer) return;
        finesListContainer.innerHTML = '';

        const currentUser = Auth.getCurrentUser();
        if (!currentUser) return;

        const userFines = fines.filter(f => f.userEmail === currentUser.email);
        const total = calculateTotalFines();

        if (totalFinesDisplay) {
            totalFinesDisplay.innerHTML = formatCurrency(total);
        }

        if (userFines.length === 0) {
            finesListContainer.innerHTML = `
                <div class="empty-state">
                    <i class="ph ph-thumbs-up"></i>
                    <p>Nenhuma multa registrada. Parabéns!</p>
                </div>
            `;
            return;
        }

        // Show newest first
        [...userFines].reverse().forEach(fine => {
            const card = document.createElement('div');
            card.className = 'fine-card';

            const dateStr = fine.date ? new Date(fine.date).toLocaleDateString('pt-BR') : '-';

            card.innerHTML = `
                <div class="fine-info">
                    <h4>${fine.type}</h4>
                    <div class="fine-desc">Data: ${dateStr}</div>
                </div>
                <div class="fine-cost">
                    -${formatCurrency(fine.amount)}
                </div>
            `;
            finesListContainer.appendChild(card);
        });
    }

    function saveFines() {
        localStorage.setItem('ets2_fines', JSON.stringify(fines));
        renderFines();
    }

    // Since Telemetry adds fines to localStorage in the background, 
    // we need to listen for storage changes if this page is open.
    window.addEventListener('storage', () => {
        fines = JSON.parse(localStorage.getItem('ets2_fines')) || [];
        renderFines();
    });

    // Manual Add (for testing or missed ones)
    function addFineManual(e) {
        e.preventDefault();
        const newFine = {
            id: Date.now(),
            userEmail: Auth.getCurrentUser().email,
            type: document.getElementById('input-fine-type').value,
            amount: document.getElementById('input-fine-cost').value,
            date: document.getElementById('input-fine-date').value || new Date().toISOString()
        };
        fines.push(newFine);
        saveFines();
        fineForm.reset();
        closeModal();
    }

    function openModal() { modalOverlay.classList.add('active'); }
    function closeModal() { modalOverlay.classList.remove('active'); }

    if (btnAddFine) btnAddFine.addEventListener('click', openModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    if (fineForm) fineForm.addEventListener('submit', addFineManual);

    // Initial Render
    renderFines();
});

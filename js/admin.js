document.addEventListener('DOMContentLoaded', () => {
    // Ensure Auth is available
    if (typeof Auth === 'undefined') {
        console.error('Auth module not loaded');
        return;
    }

    // 1. Check permissions
    Auth.checkProtection();
    const currentUser = Auth.getCurrentUser();

    // Verify Admin Email
    if (!currentUser || currentUser.email !== 'pedro.silva.vrrm@gmail.com') {
        alert('Acesso negado!');
        window.location.href = 'index.html';
        return;
    }

    // 2. Render Pending Users
    const pendingList = document.getElementById('pending-list');
    if (!pendingList) {
        console.warn('Elemento pending-list não encontrado.');
        return;
    }

    function renderRequests() {
        const users = Auth.getAllUsers();
        const pendingUsers = users.filter(u => u.status === 'pending');

        pendingList.innerHTML = '';

        if (pendingUsers.length === 0) {
            pendingList.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">
                    <i class="ph ph-check-circle" style="font-size: 3rem; margin-bottom: 1rem; color: var(--accent);"></i>
                    <p style="font-size: 1.1rem;">Todas as solicitações foram processadas!</p>
                </div>
            `;
            return;
        }

        pendingUsers.forEach(user => {
            const card = document.createElement('div');
            card.className = 'request-card';
            card.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar-placeholder">
                        <i class="ph ph-user"></i>
                    </div>
                    <div class="user-details">
                        <h4>${user.name}</h4>
                        <p>${user.email}</p>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn-approve" data-email="${user.email}">
                        <i class="ph ph-check"></i> Aprovar
                    </button>
                    <button class="btn-reject" data-email="${user.email}">
                        <i class="ph ph-x"></i> Rejeitar
                    </button>
                </div>
            `;
            pendingList.appendChild(card);
        });

        // Attach Listeners
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', () => {
                const email = btn.getAttribute('data-email');
                if (Auth.approveUser(email)) {
                    renderRequests();
                }
            });
        });

        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', () => {
                const email = btn.getAttribute('data-email');
                if (confirm(`Tem certeza que deseja rejeitar (excluir) o usuário ${email}?`)) {
                    if (Auth.rejectUser(email)) {
                        renderRequests();
                    }
                }
            });
        });
    }

    renderRequests();
});

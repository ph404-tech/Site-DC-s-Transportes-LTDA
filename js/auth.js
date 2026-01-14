const Auth = {
    isAuthenticated: () => {
        return !!localStorage.getItem('ets2_session_user');
    },

    getCurrentUser: () => {
        const userEmail = localStorage.getItem('ets2_session_user');
        if (!userEmail) return null;
        const users = JSON.parse(localStorage.getItem('ets2_users')) || [];
        return users.find(u => u.email === userEmail);
    },

    register: (name, email, password) => {
        const users = JSON.parse(localStorage.getItem('ets2_users')) || [];

        if (users.find(u => u.email === email)) {
            alert('Este email já está cadastrado!');
            return false;
        }

        // Auto-approve ALL users
        const status = 'active';

        const newUser = { name, email, password, status };
        users.push(newUser);
        localStorage.setItem('ets2_users', JSON.stringify(users));

        alert('Cadastro realizado com sucesso! Você já pode entrar.');

        window.location.href = 'login.html';
        return true;
    },

    login: (email, password) => {
        const users = JSON.parse(localStorage.getItem('ets2_users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Check for pending status
            // If status is undefined (old users), assume active for backward compatibility
            if (user.status === 'pending') {
                alert('Sua conta está aguardando aprovação. Entre em contato: pedro.silva.vrrm@gmail.com');
                return false;
            }

            localStorage.setItem('ets2_session_user', user.email);
            window.location.href = 'index.html';
            return true;
        } else {
            alert('Email ou senha inválidos.');
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('ets2_session_user');
        window.location.href = 'login.html';
    },

    checkProtection: () => {
        // If we are on index.html (or not on auth pages) and not logged in, redirect
        const path = window.location.pathname;
        const isAuthPage = path.includes('login.html') || path.includes('register.html');
        // Pages that don't satisfy strict auth but might be public-ish or have their own checks
        // Actually, let's keep it simple: if not auth page and not authenticated, go to login.
        // But company.html might be public? The previous code said so.
        const isPublicPage = path.includes('company.html');

        if (!isAuthPage && !isPublicPage && !Auth.isAuthenticated()) {
            window.location.href = 'login.html';
        }

        // If on auth page and logged in, redirect to index
        if (isAuthPage && Auth.isAuthenticated()) {
            window.location.href = 'index.html';
        }
    },

    // Admin Methods
    getAllUsers: () => {
        return JSON.parse(localStorage.getItem('ets2_users')) || [];
    },

    approveUser: (email) => {
        const users = Auth.getAllUsers();
        const userIndex = users.findIndex(u => u.email === email);
        if (userIndex !== -1) {
            users[userIndex].status = 'active';
            localStorage.setItem('ets2_users', JSON.stringify(users));
            return true;
        }
        return false;
    },

    rejectUser: (email) => {
        const users = Auth.getAllUsers();
        const newUsers = users.filter(u => u.email !== email);
        if (newUsers.length !== users.length) {
            localStorage.setItem('ets2_users', JSON.stringify(newUsers));
            return true;
        }
        return false;
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    Auth.checkProtection();

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            Auth.login(email, pass);
        });
    }

    // Register Form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const pass = document.getElementById('reg-password').value;
            Auth.register(name, email, pass);
        });
    }

    // Logout Button (if exists on page)
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.logout();
        });
    }
});

/**
 * MASM Extension Popup Script
 */

const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Login button
    document.getElementById('login-btn').addEventListener('click', handleLogin);

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Enter key on password field
    document.getElementById('login-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
});

function checkAuth() {
    chrome.storage.local.get(['masm_token', 'masm_user'], (result) => {
        if (result.masm_token && result.masm_user) {
            showDashboard(result.masm_user);
            loadServices(result.masm_token);
            loadSessions(result.masm_token);
        } else {
            showLogin();
        }
    });
}

function showLogin() {
    document.getElementById('login-view').style.display = 'block';
    document.getElementById('dashboard-view').style.display = 'none';
}

function showDashboard(user) {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'block';
    document.getElementById('user-name').textContent = user.username || user.email;
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    if (!email || !password) {
        errorEl.textContent = 'Please enter credentials';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errorEl.style.display = 'none';

    chrome.runtime.sendMessage(
        { action: 'login', email, password },
        (response) => {
            btn.disabled = false;
            btn.textContent = 'Sign In';

            if (response.error) {
                errorEl.textContent = response.error;
                errorEl.style.display = 'block';
            } else {
                showDashboard(response.user);
                chrome.storage.local.get(['masm_token'], (result) => {
                    loadServices(result.masm_token);
                    loadSessions(result.masm_token);
                });
            }
        }
    );
}

function handleLogout() {
    chrome.runtime.sendMessage({ action: 'logout' }, () => {
        showLogin();
    });
}

async function loadServices(token) {
    const container = document.getElementById('services-list');

    try {
        const response = await fetch(`${API_BASE}/services`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.services && data.services.length > 0) {
            container.innerHTML = data.services.map(s => `
        <div class="service-item" data-id="${s.id}" data-domain="${s.domain}">
          <span class="icon">${s.icon}</span>
          <span class="name">${s.name}</span>
          <span class="slots">${s.available} free</span>
        </div>
      `).join('');

            // Add click handlers
            container.querySelectorAll('.service-item').forEach(item => {
                item.addEventListener('click', () => {
                    connectService(parseInt(item.dataset.id), token);
                });
            });
        } else {
            container.innerHTML = '<div class="empty-text">No services available</div>';
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-text">Failed to load services</div>';
        console.error(err);
    }
}

async function loadSessions(token) {
    const container = document.getElementById('sessions-list');
    const countEl = document.getElementById('session-count');

    try {
        const response = await fetch(`${API_BASE}/sessions/active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        countEl.textContent = `${data.sessions.length} active`;

        if (data.sessions && data.sessions.length > 0) {
            container.innerHTML = data.sessions.map(s => `
        <div class="session-item">
          <span class="dot"></span>
          <span>${s.service?.icon || '🔗'} ${s.service?.name || 'Unknown'}</span>
        </div>
      `).join('');
        } else {
            container.innerHTML = '<div class="empty-text">No active sessions</div>';
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-text">Failed to load sessions</div>';
        console.error(err);
    }
}

function connectService(serviceId, token) {
    const overlay = document.getElementById('status-overlay');
    const statusText = document.getElementById('status-text');

    overlay.style.display = 'flex';
    statusText.textContent = 'Connecting...';

    chrome.runtime.sendMessage(
        { action: 'getSession', serviceId, token },
        (response) => {
            if (response.error) {
                statusText.textContent = `❌ ${response.error}`;
                setTimeout(() => { overlay.style.display = 'none'; }, 2000);
                return;
            }

            statusText.textContent = 'Injecting cookies...';

            // Inject cookies and open service
            chrome.runtime.sendMessage(
                {
                    action: 'injectCookies',
                    cookies: response.cookies,
                    domain: response.domain,
                    url: `https://${response.domain.replace(/^\./, '')}`
                },
                (injectResponse) => {
                    if (injectResponse.error) {
                        statusText.textContent = `❌ ${injectResponse.error}`;
                    } else {
                        statusText.textContent = `✅ Connected! (${injectResponse.injected} cookies)`;
                    }
                    setTimeout(() => {
                        overlay.style.display = 'none';
                        loadSessions(token);
                    }, 1500);
                }
            );
        }
    );
}

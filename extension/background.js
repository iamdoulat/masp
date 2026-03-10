/**
 * MASM Chrome Extension - Background Service Worker
 * Handles cookie injection, API communication, and tab management
 */

const API_BASE = 'http://localhost:5000/api';

// Listen for messages from popup or web dashboard
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getSession') {
        handleGetSession(message.serviceId, message.token)
            .then(sendResponse)
            .catch(err => sendResponse({ error: err.message }));
        return true; // Keep channel open for async
    }

    if (message.action === 'injectCookies') {
        handleInjectCookies(message.cookies, message.domain, message.url)
            .then(sendResponse)
            .catch(err => sendResponse({ error: err.message }));
        return true;
    }

    if (message.action === 'checkAuth') {
        chrome.storage.local.get(['masm_token'], (result) => {
            sendResponse({ authenticated: !!result.masm_token });
        });
        return true;
    }

    if (message.action === 'login') {
        handleLogin(message.email, message.password)
            .then(sendResponse)
            .catch(err => sendResponse({ error: err.message }));
        return true;
    }

    if (message.action === 'logout') {
        chrome.storage.local.remove(['masm_token', 'masm_user'], () => {
            sendResponse({ success: true });
        });
        return true;
    }
});

// Listen for external messages from web dashboard
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    if (message.action === 'connectService') {
        chrome.storage.local.get(['masm_token'], async (result) => {
            if (!result.masm_token) {
                sendResponse({ error: 'Not authenticated in extension' });
                return;
            }

            try {
                const session = await handleGetSession(message.serviceId, result.masm_token);
                if (session.cookies) {
                    await handleInjectCookies(session.cookies, session.domain, `https://${session.domain.replace(/^\./, '')}`);
                }
                sendResponse({ success: true, session });
            } catch (err) {
                sendResponse({ error: err.message });
            }
        });
        return true;
    }
});

/**
 * Login to MASM API
 */
async function handleLogin(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');

    // Store token and user in extension storage
    await chrome.storage.local.set({
        masm_token: data.token,
        masm_user: data.user
    });

    return { success: true, user: data.user };
}

/**
 * Get session from API
 */
async function handleGetSession(serviceId, token) {
    const response = await fetch(`${API_BASE}/sessions/get-session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ service_id: serviceId })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get session');

    return data.session;
}

/**
 * Inject cookies into browser and open service tab
 */
async function handleInjectCookies(cookies, domain, url) {
    if (!cookies || !Array.isArray(cookies)) {
        throw new Error('No cookies to inject');
    }

    const injected = [];

    for (const cookie of cookies) {
        try {
            await chrome.cookies.set({
                url: url || `https://${domain.replace(/^\./, '')}`,
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain || domain,
                path: cookie.path || '/',
                secure: cookie.secure || false,
                httpOnly: cookie.httpOnly || false,
                sameSite: cookie.sameSite || 'lax',
                expirationDate: cookie.expirationDate || (Date.now() / 1000 + 86400)
            });
            injected.push(cookie.name);
        } catch (err) {
            console.error(`Failed to set cookie ${cookie.name}:`, err);
        }
    }

    // Open service in new tab
    if (url) {
        await chrome.tabs.create({ url, active: true });
    }

    return { success: true, injected: injected.length, total: cookies.length };
}

/**
 * MASM Extension Content Script
 * Runs on the web dashboard (localhost:3000) to bridge communication to the background worker.
 */

window.addEventListener("message", (event) => {
    // Only accept messages from the same window
    if (event.source !== window || !event.data) {
        return;
    }

    if (event.data.type === "MASM_CONNECT") {
        console.log("[MASM Extension] Received connect request from dashboard", event.data.payload);

        // Forward to background script for cookie injection
        chrome.runtime.sendMessage({
            action: "injectCookies",
            cookies: event.data.payload.cookies,
            domain: event.data.payload.domain,
            url: event.data.payload.url
        }, (response) => {
            console.log("[MASM Extension] Injection result:", response);
            // Optional: reply back to web app
            window.postMessage({ type: "MASM_CONNECT_RESULT", response }, "*");
        });
    }
});

// Let the web app know the extension is installed
window.document.documentElement.setAttribute('data-masm-extension-installed', 'true');
window.postMessage({ type: "MASM_EXTENSION_READY" }, "*");

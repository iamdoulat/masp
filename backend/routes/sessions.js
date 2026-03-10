const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { authenticate, requireAdmin, requireSubscription } = require('../middleware/auth');
const { sessionLimiter } = require('../middleware/rateLimit');
const { decryptCookies, encryptCookies } = require('../utils/crypto');

const PULSE_TIMEOUT = 2 * 60 * 1000;

// POST /api/sessions/get-session — allocate session for a service
router.post('/get-session', authenticate, requireSubscription, sessionLimiter, async (req, res) => {
    try {
        const { service_id } = req.body;
        if (!service_id) return res.status(400).json({ error: 'Service ID is required' });

        const pulseThreshold = new Date(Date.now() - PULSE_TIMEOUT);
        const now = new Date();

        // Check if user already has an active session for this service
        const existingSnapshot = await db.collection('sessions')
            .where('user_id', '==', req.user.id)
            .where('status', '==', 'active')
            .where('last_pulse_at', '>', pulseThreshold)
            .get();

        // Manual filter for service_id (since Firestore doesn't support easy joins)
        for (const doc of existingSnapshot.docs) {
            const sess = doc.data();
            const accDoc = await db.collection('accounts').doc(sess.account_id).get();
            if (accDoc.exists && accDoc.data().service_id === service_id) {
                const svcDoc = await db.collection('services').doc(service_id).get();
                return res.json({
                    session: {
                        id: doc.id,
                        service: svcDoc.data().name,
                        domain: svcDoc.data().domain,
                        cookies: sess.cookie_set_enc ? decryptCookies(sess.cookie_set_enc) : null,
                        expires_at: sess.expires_at.toDate()
                    }
                });
            }
        }

        // Check plan limits
        const plan = req.subscription.plan;
        const activeSessionsSnapshot = await db.collection('sessions')
            .where('user_id', '==', req.user.id)
            .where('status', '==', 'active')
            .where('last_pulse_at', '>', pulseThreshold)
            .get();

        if (activeSessionsSnapshot.size >= (plan.max_sessions || 1)) {
            return res.status(403).json({ error: 'Plan limit reached: max parallel sessions', code: 'PLAN_LIMIT_REACHED' });
        }

        // Find available account
        const accountsSnapshot = await db.collection('accounts')
            .where('service_id', '==', service_id)
            .where('status', '==', 'active')
            .get();

        let availableAccount = null;
        for (const accDoc of accountsSnapshot.docs) {
            const accData = accDoc.data();
            const usageSnapshot = await db.collection('sessions')
                .where('account_id', '==', accDoc.id)
                .where('status', '==', 'active')
                .where('last_pulse_at', '>', pulseThreshold)
                .get();

            if (usageSnapshot.size < (accData.max_users || 1) && accData.cookies_enc) {
                availableAccount = { id: accDoc.id, ...accData };
                break;
            }
        }

        if (!availableAccount) {
            return res.status(503).json({ error: 'No available accounts for this service' });
        }

        // Create session
        const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours
        const sessionRef = await db.collection('sessions').add({
            user_id: req.user.id,
            account_id: availableAccount.id,
            cookie_set_enc: availableAccount.cookies_enc,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            status: 'active',
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            last_pulse_at: admin.firestore.FieldValue.serverTimestamp(),
            expires_at: admin.firestore.Timestamp.fromDate(expiresAt)
        });

        const svcDoc = await db.collection('services').doc(service_id).get();

        res.json({
            session: {
                id: sessionRef.id,
                service: svcDoc.data().name,
                domain: svcDoc.data().domain,
                cookies: decryptCookies(availableAccount.cookies_enc),
                expires_at: expiresAt
            }
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ error: 'Failed to allocate session' });
    }
});

// GET /api/sessions/active — user's active sessions
router.get('/active', authenticate, requireSubscription, async (req, res) => {
    try {
        const pulseThreshold = new Date(Date.now() - PULSE_TIMEOUT);
        const snapshot = await db.collection('sessions')
            .where('user_id', '==', req.user.id)
            .where('status', '==', 'active')
            .where('last_pulse_at', '>', pulseThreshold)
            .get();

        const sessions = [];
        for (const doc of snapshot.docs) {
            const sess = doc.data();
            const accDoc = await db.collection('accounts').doc(sess.account_id).get();
            const svcDoc = await db.collection('services').doc(accDoc.data().service_id).get();

            sessions.push({
                id: doc.id,
                service: { id: svcDoc.id, ...svcDoc.data() },
                created_at: sess.created_at.toDate(),
                expires_at: sess.expires_at.toDate()
            });
        }

        res.json({ sessions });
    } catch (error) {
        console.error('Get active sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// POST /api/sessions/:id/release
router.post('/:id/release', authenticate, async (req, res) => {
    try {
        await db.collection('sessions').doc(req.params.id).update({ status: 'revoked' });
        res.json({ message: 'Session released' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to release session' });
    }
});

// POST /api/sessions/:id/pulse
router.post('/:id/pulse', authenticate, async (req, res) => {
    try {
        await db.collection('sessions').doc(req.params.id).update({
            last_pulse_at: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update pulse' });
    }
});

// POST /api/sessions/update-cookies
router.post('/update-cookies', authenticate, async (req, res) => {
    try {
        const { session_id, cookies } = req.body;
        const sessionRef = db.collection('sessions').doc(session_id);
        const sessDoc = await sessionRef.get();

        if (!sessDoc.exists) return res.status(404).json({ error: 'Session not found' });

        const encCookies = encryptCookies(cookies);
        await sessionRef.update({ cookie_set_enc: encCookies });
        await db.collection('accounts').doc(sessDoc.data().account_id).update({
            cookies_enc: encCookies,
            cookies_updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: 'Cookies updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;

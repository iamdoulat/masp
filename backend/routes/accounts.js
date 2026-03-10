const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { encrypt } = require('../utils/crypto');

const PULSE_TIMEOUT = 2 * 60 * 1000;

// GET /api/accounts — list all accounts (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { service_id, status } = req.query;
        let query = db.collection('accounts');

        if (service_id) query = query.where('service_id', '==', service_id);
        if (status) query = query.where('status', '==', status);

        const snapshot = await query.orderBy('created_at', 'desc').get();
        const accounts = [];

        for (const doc of snapshot.docs) {
            const acc = { id: doc.id, ...doc.data() };

            // Get service info
            const serviceDoc = await db.collection('services').doc(acc.service_id).get();
            const service = serviceDoc.exists ? { id: serviceDoc.id, name: serviceDoc.data().name, icon: serviceDoc.data().icon } : null;

            // Get active session count
            const pulseThreshold = new Date(Date.now() - PULSE_TIMEOUT);
            const sessionsSnapshot = await db.collection('sessions')
                .where('account_id', '==', doc.id)
                .where('status', '==', 'active')
                .where('last_pulse_at', '>', pulseThreshold)
                .get();

            accounts.push({
                ...acc,
                password_enc: undefined, // Hide sensitive data
                cookies_enc: undefined,
                service,
                activeSessions: sessionsSnapshot.size,
                hasCookies: !!acc.cookies_enc
            });
        }

        res.json({ accounts });
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// POST /api/accounts — create account (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { service_id, email, password, max_users, notes } = req.body;
        if (!service_id || !email || !password) {
            return res.status(400).json({ error: 'Service ID, email, and password are required' });
        }

        const serviceDoc = await db.collection('services').doc(service_id).get();
        if (!serviceDoc.exists) return res.status(404).json({ error: 'Service not found' });

        const password_enc = encrypt(password);

        const docRef = await db.collection('accounts').add({
            service_id,
            email,
            password_enc,
            max_users: Number(max_users) || 1,
            notes: notes || '',
            status: 'active',
            cookies_enc: null,
            cookies_updated_at: null,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({
            account: {
                id: docRef.id,
                service_id,
                email,
                status: 'active',
                max_users
            }
        });
    } catch (error) {
        console.error('Create account error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// PUT /api/accounts/:id — update account (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { email, password, max_users, status, notes, cookies } = req.body;
        const accountRef = db.collection('accounts').doc(req.params.id);

        const updates = { updated_at: admin.firestore.FieldValue.serverTimestamp() };
        if (email) updates.email = email;
        if (password) updates.password_enc = encrypt(password);
        if (max_users !== undefined) updates.max_users = Number(max_users);
        if (status) updates.status = status;
        if (notes !== undefined) updates.notes = notes;
        if (cookies) {
            updates.cookies_enc = encrypt(JSON.stringify(cookies));
            updates.cookies_updated_at = admin.firestore.FieldValue.serverTimestamp();
        }

        await accountRef.update(updates);
        res.json({ message: 'Account updated' });
    } catch (error) {
        console.error('Update account error:', error);
        res.status(500).json({ error: 'Failed to update account' });
    }
});

// DELETE /api/accounts/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        await db.collection('accounts').doc(req.params.id).delete();
        res.json({ message: 'Account deleted' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;

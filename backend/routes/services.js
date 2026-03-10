const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { authenticate, requireAdmin, requireSubscription } = require('../middleware/auth');

const PULSE_TIMEOUT = 2 * 60 * 1000; // 2 minutes timeout for stale sessions

// Helper to get active session count for an account
const getActiveSessionCount = async (accountId) => {
    const pulseThreshold = new Date(Date.now() - PULSE_TIMEOUT);
    const snapshot = await db.collection('sessions')
        .where('account_id', '==', accountId)
        .where('status', '==', 'active')
        .where('last_pulse_at', '>', pulseThreshold)
        .get();
    return snapshot.size;
};

// GET /api/services/admin — list ALL services (admin only)
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
    try {
        const servicesSnapshot = await db.collection('services').orderBy('name', 'asc').get();
        const services = [];

        for (const doc of servicesSnapshot.docs) {
            const svc = { id: doc.id, ...doc.data() };

            // Get accounts for this service
            const accountsSnapshot = await db.collection('accounts').where('service_id', '==', doc.id).get();
            let totalSlots = 0;
            let activeSessions = 0;

            for (const accDoc of accountsSnapshot.docs) {
                const acc = accDoc.data();
                totalSlots += (acc.max_users || 0);
                if (acc.status === 'active') {
                    activeSessions += await getActiveSessionCount(accDoc.id);
                }
            }

            services.push({
                ...svc,
                totalSlots,
                activeSessions,
                available: totalSlots - activeSessions
            });
        }

        res.json({ services });
    } catch (error) {
        console.error('Get admin services error:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// GET /api/services — list all active services
router.get('/', authenticate, requireSubscription, async (req, res) => {
    try {
        const plan = req.subscription?.plan;
        let query = db.collection('services').where('is_active', '==', true);

        // Filter by whitelist if it exists
        let allowed = plan?.allowed_services;
        if (allowed && Array.isArray(allowed) && allowed.length > 0) {
            // Note: Firestore 'in' query has a limit of 10-30 items depending on version
            query = query.where(admin.firestore.FieldPath.documentId(), 'in', allowed);
        }

        const servicesSnapshot = await query.get();
        const result = [];

        for (const doc of servicesSnapshot.docs) {
            const svc = { id: doc.id, ...doc.data() };

            const accountsSnapshot = await db.collection('accounts')
                .where('service_id', '==', doc.id)
                .where('status', '==', 'active')
                .get();

            let totalSlots = 0;
            let activeSessions = 0;

            for (const accDoc of accountsSnapshot.docs) {
                totalSlots += (accDoc.data().max_users || 0);
                activeSessions += await getActiveSessionCount(accDoc.id);
            }

            result.push({
                id: svc.id,
                name: svc.name,
                icon: svc.icon,
                login_url: svc.login_url,
                domain: svc.domain,
                category: svc.category,
                color: svc.color,
                totalSlots,
                activeSessions,
                available: totalSlots - activeSessions
            });
        }

        res.json({ services: result.sort((a, b) => a.name.localeCompare(b.name)) });
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// POST /api/services — create service (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, icon, login_url, domain, category, color } = req.body;
        if (!name || !login_url || !domain) {
            return res.status(400).json({ error: 'Name, login_url, and domain are required' });
        }

        const docRef = await db.collection('services').add({
            name, icon, login_url, domain, category, color,
            is_active: true,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ service: { id: docRef.id, name, icon, login_url, domain, category, color } });
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// PUT /api/services/:id — update service (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, icon, login_url, domain, category, color, is_active } = req.body;
        const serviceRef = db.collection('services').doc(req.params.id);

        const updates = { updated_at: admin.firestore.FieldValue.serverTimestamp() };
        if (name !== undefined) updates.name = name;
        if (icon !== undefined) updates.icon = icon;
        if (login_url !== undefined) updates.login_url = login_url;
        if (domain !== undefined) updates.domain = domain;
        if (category !== undefined) updates.category = category;
        if (color !== undefined) updates.color = color;
        if (is_active !== undefined) updates.is_active = is_active;

        await serviceRef.update(updates);
        res.json({ message: 'Service updated' });
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

// DELETE /api/services/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        await db.collection('services').doc(req.params.id).delete();
        res.json({ message: 'Service deleted' });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/subscriptions/plans - List available plans
router.get('/plans', async (req, res) => {
    try {
        const snapshot = await db.collection('subscription_plans')
            .where('is_active', '==', true)
            .orderBy('price', 'asc')
            .get();

        const plans = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            allowed_services: Array.isArray(doc.data().allowed_services) ? doc.data().allowed_services : []
        }));

        res.json({ plans });
    } catch (error) {
        console.error('Fetch plans error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/subscriptions/me - Get current user's subscription
router.get('/me', authenticate, async (req, res) => {
    try {
        const subSnapshot = await db.collection('user_subscriptions')
            .where('user_id', '==', req.user.id)
            .limit(1)
            .get();

        if (subSnapshot.empty) {
            return res.json({ subscription: null });
        }

        const subDoc = subSnapshot.docs[0];
        const subData = subDoc.data();
        const planDoc = await db.collection('subscription_plans').doc(subData.plan_id).get();

        const subscription = {
            id: subDoc.id,
            ...subData,
            plan: planDoc.exists ? { id: planDoc.id, ...planDoc.data() } : null,
            current_period_start: subData.current_period_start?.toDate(),
            current_period_end: subData.current_period_end?.toDate()
        };

        if (subscription.plan && !Array.isArray(subscription.plan.allowed_services)) {
            subscription.plan.allowed_services = [];
        }

        res.json({ subscription });
    } catch (error) {
        console.error('Fetch user sub error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/subscriptions/checkout - Create/Update subscription
router.post('/checkout', authenticate, async (req, res) => {
    try {
        const { plan_id, payment_method } = req.body;
        if (!plan_id || !payment_method) return res.status(400).json({ error: 'Required fields missing' });

        const planDoc = await db.collection('subscription_plans').doc(plan_id).get();
        if (!planDoc.exists) return res.status(404).json({ error: 'Plan not found' });

        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 30);

        const status = payment_method === 'cash' ? 'pending' : 'active';
        const subSnapshot = await db.collection('user_subscriptions').where('user_id', '==', req.user.id).limit(1).get();

        const subData = {
            user_id: req.user.id,
            plan_id,
            status,
            payment_method,
            current_period_start: admin.firestore.FieldValue.serverTimestamp(),
            current_period_end: admin.firestore.Timestamp.fromDate(periodEnd),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        };

        if (subSnapshot.empty) {
            subData.created_at = admin.firestore.FieldValue.serverTimestamp();
            await db.collection('user_subscriptions').add(subData);
        } else {
            await db.collection('user_subscriptions').doc(subSnapshot.docs[0].id).update(subData);
        }

        res.json({ message: 'Success', status });
    } catch (error) {
        res.status(500).json({ error: 'Checkout failed' });
    }
});

// --- ADMIN ROUTES ---

router.get('/admin/plans', authenticate, requireAdmin, async (req, res) => {
    try {
        const snapshot = await db.collection('subscription_plans').orderBy('price', 'asc').get();
        const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ plans });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/admin/plans', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, price, max_services, max_sessions, description, is_active, allowed_services } = req.body;
        const planRef = await db.collection('subscription_plans').add({
            name, price, max_services, max_sessions, description,
            is_active: is_active ?? true,
            allowed_services: allowed_services || [],
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ message: 'Plan created', id: planRef.id });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
    try {
        const snapshot = await db.collection('user_subscriptions').orderBy('created_at', 'desc').get();
        const subscriptions = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.user_id).get();
            const planDoc = await db.collection('subscription_plans').doc(data.plan_id).get();
            subscriptions.push({
                id: doc.id,
                ...data,
                user: userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null,
                plan: planDoc.exists ? { id: planDoc.id, ...planDoc.data() } : null
            });
        }
        res.json({ subscriptions });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.put('/admin/:id/status', authenticate, requireAdmin, async (req, res) => {
    try {
        await db.collection('user_subscriptions').doc(req.params.id).update({
            status: req.body.status,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;

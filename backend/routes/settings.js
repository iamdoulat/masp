const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/settings — list all settings (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const snapshot = await db.collection('settings').get();
        const settings = snapshot.docs.map(doc => ({ key: doc.id, ...doc.data() }));
        res.json({ settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// POST /api/settings — bulk update settings (admin only)
router.post('/bulk', authenticate, requireAdmin, async (req, res) => {
    try {
        const { settings } = req.body;
        if (!settings || !Array.isArray(settings)) {
            return res.status(400).json({ error: 'Invalid settings data' });
        }

        const batch = db.batch();
        for (const s of settings) {
            const ref = db.collection('settings').doc(s.key);
            batch.set(ref, {
                value: s.value,
                group: s.group || 'general',
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        await batch.commit();

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;

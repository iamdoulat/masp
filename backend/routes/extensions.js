const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, admin } = require('../config/firebase');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Note: /tmp is used for Vercel persistence (ephemeral)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = '/tmp/extensions';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `extension-${Date.now()}.zip`);
    }
});

const upload = multer({ storage });

router.post('/upload', authenticate, requireAdmin, upload.single('extension'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file' });
        const { version, description } = req.body;

        // Deactivate previous
        const snapshot = await db.collection('extensions').where('is_active', '==', true).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.update(doc.ref, { is_active: false }));
        await batch.commit();

        const extRef = await db.collection('extensions').add({
            filename: req.file.filename,
            version: version || '1.0.0',
            description: description || '',
            is_active: true,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: 'Uploaded', id: extRef.id });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.get('/latest', async (req, res) => {
    try {
        const snapshot = await db.collection('extensions')
            .where('is_active', '==', true)
            .orderBy('created_at', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) return res.status(404).json({ error: 'Not found' });
        res.json({ extension: { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

router.get('/download', async (req, res) => {
    try {
        const snapshot = await db.collection('extensions')
            .where('is_active', '==', true)
            .orderBy('created_at', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) return res.status(404).json({ error: 'Not found' });
        const ext = snapshot.docs[0].data();
        const filePath = path.join('/tmp/extensions', ext.filename);

        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File lost' });
        res.download(filePath, 'extension.zip');
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;

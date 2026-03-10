const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, admin } = require('../config/firebase');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/users — list all users
router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const snapshot = await db.collection('users').orderBy('created_at', 'desc').get();
        const users = [];

        for (const doc of snapshot.docs) {
            const userData = doc.data();

            // Get user's subscription
            const subSnapshot = await db.collection('user_subscriptions').where('user_id', '==', doc.id).limit(1).get();
            let subscription = null;
            if (!subSnapshot.empty) {
                const subData = subSnapshot.docs[0].data();
                const planDoc = await db.collection('subscription_plans').doc(subData.plan_id).get();
                subscription = {
                    id: subSnapshot.docs[0].id,
                    ...subData,
                    plan: planDoc.exists ? { id: planDoc.id, name: planDoc.data().name } : null
                };
            }

            users.push({
                id: doc.id,
                email: userData.email,
                username: userData.username,
                role: userData.role,
                is_active: userData.is_active,
                created_at: userData.created_at?.toDate(),
                last_login: userData.last_login?.toDate(),
                subscription
            });
        }
        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/users — create user
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { email, password, username, role, is_active } = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password, and username are required' });
        }

        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const userRef = await db.collection('users').add({
            email,
            password_hash,
            username,
            role: role || 'user',
            is_active: is_active !== undefined ? is_active : true,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({
            user: {
                id: userRef.id,
                email,
                username,
                role: role || 'user',
                is_active: is_active !== undefined ? is_active : true
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /api/users/:id — update user
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { email, password, username, role, is_active } = req.body;
        const updates = { updated_at: admin.firestore.FieldValue.serverTimestamp() };

        if (email) updates.email = email;
        if (username) updates.username = username;
        if (password) updates.password_hash = await bcrypt.hash(password, 10);
        if (role) updates.role = role;
        if (is_active !== undefined) updates.is_active = is_active;

        await db.collection('users').doc(req.params.id).update(updates);
        res.json({ message: 'User updated' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/users/:id — delete user
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        await db.collection('users').doc(req.params.id).delete();
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;

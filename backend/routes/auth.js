const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, admin } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Multer storage for avatars (Note: Vercel filesystem is read-only, 
// in production you should use Firebase Storage. This is a temporary local fix)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = '/tmp/image';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }
});

// Helper to get user by email
const getUserByEmail = async (email) => {
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password, and username are required' });
        }

        const existing = await getUserByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const userRef = await db.collection('users').add({
            email,
            password_hash,
            username,
            role: 'user',
            is_active: true,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        });

        const token = jwt.sign(
            { id: userRef.id, email, role: 'user', username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: { id: userRef.id, email, username, role: 'user' }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await getUserByEmail(email);
        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await db.collection('users').doc(user.id).update({
            last_login: admin.firestore.FieldValue.serverTimestamp()
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, username: user.username, role: user.role }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.id).get();
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

        const userData = userDoc.data();
        delete userData.password_hash;

        res.json({ user: { id: userDoc.id, ...userData } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, upload.single('avatar'), async (req, res) => {
    try {
        const { username, email, password, mobile } = req.body;
        const userRef = db.collection('users').doc(req.user.id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

        const updates = {
            updated_at: admin.firestore.FieldValue.serverTimestamp()
        };

        if (username) updates.username = username;
        if (mobile) updates.mobile = mobile;

        if (email && email !== userDoc.data().email) {
            const existing = await getUserByEmail(email);
            if (existing) return res.status(409).json({ error: 'Email already in use' });
            updates.email = email;
        }

        if (password) {
            updates.password_hash = await bcrypt.hash(password, 10);
        }

        if (req.file) {
            // Note: In Vercel, this /tmp link will only be valid for the current horizontal scaling instance
            updates.avatar = `/api/avatar/${req.file.filename}`;
        }

        await userRef.update(updates);

        const updatedDoc = await userRef.get();
        const finalData = updatedDoc.data();
        delete finalData.password_hash;

        res.json({
            message: 'Profile updated successfully',
            user: { id: updatedDoc.id, ...finalData }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

const { sendEmail } = require('../utils/email');

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await getUserByEmail(email);

        if (!user) {
            return res.json({ message: 'If an account exists, a reset link has been sent' });
        }

        const resetToken = jwt.sign(
            { id: user.id, type: 'reset' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            html: `<p>Hello ${user.username},</p><p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
        });

        res.json({ message: 'If an account exists, a reset link has been sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

module.exports = router;

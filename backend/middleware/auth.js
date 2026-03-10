const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

/**
 * JWT authentication middleware
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

/**
 * Admin-only middleware
 */
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

/**
 * Require active subscription middleware
 */
const requireSubscription = async (req, res, next) => {
    try {
        if (req.user.role === 'admin') return next();

        const subSnapshot = await db.collection('user_subscriptions')
            .where('user_id', '==', req.user.id)
            .limit(1)
            .get();

        if (subSnapshot.empty) {
            return res.status(402).json({ error: 'Active subscription required', code: 'SUBSCRIPTION_REQUIRED' });
        }

        const sub = { id: subSnapshot.docs[0].id, ...subSnapshot.docs[0].data() };
        const now = new Date();
        const expiry = sub.current_period_end.toDate ? sub.current_period_end.toDate() : new Date(sub.current_period_end);

        if (sub.status !== 'active' || expiry < now) {
            if (sub.status === 'active' && expiry < now) {
                await db.collection('user_subscriptions').doc(sub.id).update({ status: 'expired' });
            }
            return res.status(402).json({ error: 'Active subscription required', code: 'SUBSCRIPTION_REQUIRED' });
        }

        req.subscription = sub;
        next();
    } catch (err) {
        console.error('Subscription check error:', err);
        return res.status(500).json({ error: 'Failed to verify subscription' });
    }
};

module.exports = { authenticate, requireAdmin, requireSubscription };

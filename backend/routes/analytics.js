const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const PULSE_TIMEOUT = 2 * 60 * 1000;

router.get('/stats', authenticate, requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const pulseThreshold = new Date(now.getTime() - PULSE_TIMEOUT);

        // 1. Revenue & Global Stats (Using aggregations if possible, or manual for compatibility)
        const subSnapshot = await db.collection('user_subscriptions').where('status', '==', 'active').get();
        let monthlyRevenue = 0;
        const subDist = {};

        for (const doc of subSnapshot.docs) {
            const data = doc.data();
            const planDoc = await db.collection('subscription_plans').doc(data.plan_id).get();
            if (planDoc.exists) {
                const price = planDoc.data().price || 0;
                monthlyRevenue += price;
                const name = planDoc.data().name;
                subDist[name] = (subDist[name] || 0) + 1;
            }
        }

        // 2. User Growth (Last 30 days)
        const usersSnapshot = await db.collection('users').where('created_at', '>', thirtyDaysAgo).get();
        const growthMap = {};
        usersSnapshot.docs.forEach(doc => {
            const date = doc.data().created_at?.toDate().toISOString().split('T')[0] || 'Unknown';
            growthMap[date] = (growthMap[date] || 0) + 1;
        });
        const userGrowth = Object.keys(growthMap).sort().map(date => ({ date, count: growthMap[date] }));

        // 3. Global Counts
        const totalUsers = (await db.collection('users').count().get()).data().count;
        const totalAccounts = (await db.collection('accounts').count().get()).data().count;
        const totalServices = (await db.collection('services').count().get()).data().count;
        const activeSessionsGlobal = (await db.collection('sessions')
            .where('status', '==', 'active')
            .where('last_pulse_at', '>', pulseThreshold)
            .count().get()).data().count;

        // 4. Popular Services (Last 7 days)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const sessionsSnapshot = await db.collection('sessions').where('created_at', '>', sevenDaysAgo).get();
        const svcCountMap = {};
        for (const doc of sessionsSnapshot.docs) {
            const sess = doc.data();
            const accDoc = await db.collection('accounts').doc(sess.account_id).get();
            if (accDoc.exists) {
                const svcDoc = await db.collection('services').doc(accDoc.data().service_id).get();
                if (svcDoc.exists) {
                    const name = svcDoc.data().name;
                    svcCountMap[name] = (svcCountMap[name] || 0) + 1;
                }
            }
        }
        const popularServices = Object.keys(svcCountMap)
            .map(name => ({ name, value: svcCountMap[name] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // 5. Recent Users
        const recentUsersSnapshot = await db.collection('users').orderBy('created_at', 'desc').limit(5).get();
        const recentUsers = [];
        for (const doc of recentUsersSnapshot.docs) {
            const data = doc.data();
            const sSub = await db.collection('user_subscriptions').where('user_id', '==', doc.id).limit(1).get();
            let planName = 'None';
            if (!sSub.empty) {
                const pDoc = await db.collection('subscription_plans').doc(sSub.docs[0].data().plan_id).get();
                planName = pDoc.exists ? pDoc.data().name : 'None';
            }
            recentUsers.push({
                id: doc.id,
                username: data.username,
                email: data.email,
                created_at: data.created_at?.toDate(),
                plan: planName
            });
        }

        res.json({
            revenue: { monthly: monthlyRevenue, yearly: monthlyRevenue * 12, total: monthlyRevenue }, // total is placeholder
            userGrowth,
            subscriptionDistribution: Object.keys(subDist).map(name => ({ name, value: subDist[name] })),
            popularServices,
            recentUsers,
            global: { totalUsers, totalAccounts, totalServices, activeSessions: activeSessionsGlobal, totalSlots: totalAccounts * 10 } // totalSlots placeholder
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

router.get('/user-dashboard', authenticate, async (req, res) => {
    try {
        const pulseThreshold = new Date(Date.now() - PULSE_TIMEOUT);

        const subSnapshot = await db.collection('user_subscriptions').where('user_id', '==', req.user.id).limit(1).get();
        if (subSnapshot.empty && req.user.role !== 'admin') return res.status(404).json({ error: 'No subscription' });

        const subData = subSnapshot.docs[0]?.data();
        const planDoc = subData ? await db.collection('subscription_plans').doc(subData.plan_id).get() : null;
        const plan = planDoc?.exists ? planDoc.data() : null;

        const activeSessionsSnapshot = await db.collection('sessions')
            .where('user_id', '==', req.user.id)
            .where('status', '==', 'active')
            .where('last_pulse_at', '>', pulseThreshold)
            .get();

        const usedServiceIds = new Set();
        activeSessionsSnapshot.docs.forEach(doc => {
            // In a real app, you'd join to get service_id if not stored in session
            // For now, let's assume we can fetch it or ignore for simple count
        });

        res.json({
            stats: {
                services: { total: plan?.max_services || 0, active: usedServiceIds.size },
                sessions: { total: plan?.max_sessions || 0, active: activeSessionsSnapshot.size },
                slots: { total: 100, active: 10 } // Placeholders for now
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;

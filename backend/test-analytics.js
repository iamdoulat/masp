const { User, UserSubscription, SubscriptionPlan, Service, Account, Session } = require('./models');
const { Op } = require('sequelize');

async function test() {
    const user = await User.findOne({ where: { username: 'Demo User' } });
    if (!user) {
        console.log('User not found');
        return;
    }

    const sub = await UserSubscription.findOne({
        where: { user_id: user.id, status: 'active' },
        include: [{ model: SubscriptionPlan, as: 'plan' }]
    });

    if (!sub) {
        console.log('No active subscription');
        return;
    }

    const plan = sub.plan;

    // Force parse allowed_services if it's a string
    let allowed = plan?.allowed_services;
    if (typeof allowed === 'string') {
        try { allowed = JSON.parse(allowed); } catch (e) { allowed = []; }
    }

    // Find visible services for this plan
    const whereClause = { is_active: true };
    if (allowed && Array.isArray(allowed) && allowed.length > 0) {
        whereClause.id = { [Op.in]: allowed };
    }

    const services = await Service.findAll({
        where: whereClause,
        include: [{
            model: Account,
            as: 'accounts',
            where: { status: 'active' },
            required: false,
            include: [{
                model: Session,
                as: 'sessions',
                where: { status: 'active' },
                required: false
            }]
        }]
    });

    // Use a simpler approach for usedServicesCount to avoid SQL errors
    const activeSessionsList = await Session.findAll({
        where: {
            user_id: user.id,
            status: 'active',
            expires_at: { [Op.gt]: new Date() }
        },
        include: [{
            model: Account,
            as: 'account',
            attributes: ['service_id']
        }]
    });

    const activeSessions = activeSessionsList.length;
    const usedServicesCount = new Set(activeSessionsList.map(s => s.account?.service_id).filter(Boolean)).size;

    let totalSlots = 0;
    let occupiedSlots = 0;

    services.forEach(s => {
        s.accounts.forEach(a => {
            totalSlots += a.max_users;
            occupiedSlots += (a.sessions?.length || 0);
        });
    });

    const stats = {
        services: { total: (allowed && Array.isArray(allowed)) ? allowed.length : services.length, active: usedServicesCount },
        sessions: { total: plan.max_sessions || '∞', active: activeSessions },
        slots: { total: totalSlots, active: occupiedSlots },
        available: { total: totalSlots, active: totalSlots - occupiedSlots }
    };

    console.log('Response Stats:', JSON.stringify(stats, null, 2));
}

test().then(() => process.exit());

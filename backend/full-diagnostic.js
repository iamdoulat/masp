const { Service, Session, Account, SubscriptionPlan, UserSubscription, User } = require('./models');
const { Op } = require('sequelize');

async function diagnostic() {
    const user = await User.findOne({ where: { username: 'Demo User' } });
    if (!user) return console.log('User not found');
    console.log('User ID:', user.id);

    const sub = await UserSubscription.findOne({
        where: { user_id: user.id },
        include: [{ model: SubscriptionPlan, as: 'plan' }]
    });

    if (!sub) return console.log('Subscription not found');
    console.log('Sub Status:', sub.status, 'Plan:', sub.plan.name);

    // Simulate /api/services
    const plan = sub.plan;
    let allowed = plan.allowed_services;
    while (typeof allowed === 'string') {
        try {
            const parsed = JSON.parse(allowed);
            if (parsed === allowed) break;
            allowed = parsed;
        } catch (e) { break; }
    }
    const whereServices = { is_active: true };
    if (allowed && Array.isArray(allowed) && allowed.length > 0) {
        whereServices.id = { [Op.in]: allowed };
    }
    const services = await Service.findAll({ where: whereServices });
    console.log('Services Count:', services.length);

    // Simulate /api/sessions/active
    const sessions = await Session.findAll({
        where: {
            user_id: user.id,
            status: 'active'
        }
    });
    console.log('Active Sessions Count:', sessions.length);

    // Simulate /api/analytics/user-dashboard logic
    const stats = {
        services: { total: (allowed && Array.isArray(allowed)) ? allowed.length : services.length, active: 0 }
    };
    console.log('Final Stats total services:', stats.services.total);
}

diagnostic().then(() => process.exit());

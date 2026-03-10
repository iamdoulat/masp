const { SubscriptionPlan } = require('./models');

async function check() {
    const plans = await SubscriptionPlan.findAll();
    console.log('Plans:', JSON.stringify(plans.map(p => ({
        id: p.id,
        name: p.name,
        max_services: p.max_services,
        max_sessions: p.max_sessions,
        allowed_services: p.allowed_services
    })), null, 2));
}

check().then(() => process.exit());

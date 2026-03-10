const { SubscriptionPlan } = require('./models');

async function check() {
    const plans = await SubscriptionPlan.findAll();
    console.log('Plans Data:');
    plans.forEach(p => {
        console.log(`- ${p.name}:`, JSON.stringify(p.allowed_services));
        console.log(`  Type: ${typeof p.allowed_services}`);
        if (Array.isArray(p.allowed_services)) {
            console.log(`  Length: ${p.allowed_services.length}`);
        }
    });
}

check().then(() => process.exit());

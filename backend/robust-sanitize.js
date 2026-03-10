const { SubscriptionPlan } = require('./models');

async function robustSanitize() {
    const plans = await SubscriptionPlan.findAll();
    for (const plan of plans) {
        let val = plan.allowed_services;
        console.log(`\nPlan: ${plan.name}`);
        console.log(`Original:`, val);

        // 1. Recursive parse if it's a string
        let current = val;
        while (typeof current === 'string') {
            try {
                const parsed = JSON.parse(current);
                if (parsed === current) break;
                current = parsed;
            } catch (e) {
                break;
            }
        }

        // 2. Ensure it's an array and filter/process
        if (Array.isArray(current)) {
            // Filter only numbers or things that look like numbers
            const cleanIds = current
                .map(item => {
                    if (typeof item === 'number') return item;
                    if (typeof item === 'string') {
                        const n = parseInt(item);
                        return isNaN(n) ? null : n;
                    }
                    return null;
                })
                .filter(item => item !== null);

            // Deduplicate
            const uniqueIds = [...new Set(cleanIds)];
            current = uniqueIds;
        } else {
            current = [];
        }

        console.log(`Cleaned:`, JSON.stringify(current));
        await plan.update({ allowed_services: current });
    }
}

robustSanitize().then(() => {
    console.log('\nSanitization Complete');
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});

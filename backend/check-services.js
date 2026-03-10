const { Service } = require('./models');

async function check() {
    const services = await Service.findAll();
    console.log('Available Services:');
    services.forEach(s => {
        console.log(`- ID: ${s.id}, Name: ${s.name}, Active: ${s.is_active}`);
    });
}

check().then(() => process.exit());

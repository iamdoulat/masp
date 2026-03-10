const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Set NODE_ENV from PM2 or default
const NODE_ENV = process.env.NODE_ENV || 'production';

// Load environment variables strictly
const envFile = NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { db } = require('./config/firebase');

// Import routes
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const accountRoutes = require('./routes/accounts');
const sessionRoutes = require('./routes/sessions');
const userRoutes = require('./routes/users');
const subscriptionRoutes = require('./routes/subscriptions');
const analyticsRoutes = require('./routes/analytics');
const extensionRoutes = require('./routes/extensions');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & parsing middleware
app.use(helmet());
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        `chrome-extension://${process.env.EXTENSION_ID}`
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (Note: Vercel /tmp for temporary images)
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/api/avatar', express.static('/tmp/image'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'firestore', env: NODE_ENV });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Process error handlers for standalone mode
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    if (NODE_ENV !== 'production') process.exit(1);
});

// Start server (only if run directly)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 MASM Backend running on http://localhost:${PORT}`);
        console.log(`   Database: Firestore | Env: ${NODE_ENV}`);
    });
}

module.exports = app;

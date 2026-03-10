const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with Service Account
// We recommend putting the service account JSON content in a single env variable for Vercel
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!admin.apps.length) {
    if (serviceAccountKey) {
        try {
            const serviceAccount = JSON.parse(serviceAccountKey);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('✅ Firebase Admin initialized with Service Account');
        } catch (error) {
            console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', error.message);
            admin.initializeApp(); // Fallback to ADC
        }
    } else {
        console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found, attempting default credentials');
        admin.initializeApp();
    }
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth, admin };

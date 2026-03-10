const nodemailer = require('nodemailer');
const { Setting } = require('../models');

/**
 * Sends an email using SMTP settings stored in the database.
 */
async function sendEmail({ to, subject, html }) {
    try {
        const smtpSettings = await Setting.findAll({
            where: { group: 'smtp' }
        });

        const config = {};
        smtpSettings.forEach(s => {
            config[s.key] = s.value;
        });

        if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
            console.error('SMTP settings not configured');
            return false;
        }

        const transporter = nodemailer.createTransport({
            host: config.smtp_host,
            port: parseInt(config.smtp_port) || 587,
            secure: config.smtp_secure === 'true',
            auth: {
                user: config.smtp_user,
                pass: config.smtp_pass
            }
        });

        const info = await transporter.sendMail({
            from: `"${config.smtp_from_name || 'MASM'}" <${config.smtp_from_email || config.smtp_user}>`,
            to,
            subject,
            html
        });

        return info;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
}

module.exports = { sendEmail };

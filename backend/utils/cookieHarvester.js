/**
 * Cookie Harvester - Puppeteer-based automation
 * Adapted for Vercel Serverless environment
 */

const getBrowser = async () => {
    if (process.env.VERCEL) {
        // Production: Vercel Serverless
        const chromium = require('@sparticuz/chromium');
        const puppeteer = require('puppeteer-core');
        return await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
    } else {
        // Development: Local Puppeteer
        const puppeteer = require('puppeteer');
        return await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }
};

const harvestCookies = async (loginUrl, email, password, selectors = {}) => {
    let browser;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();

        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        const emailSelector = selectors.email || 'input[type="email"], input[name="email"], #email';
        const passwordSelector = selectors.password || 'input[type="password"], input[name="password"], #password';
        const submitSelector = selectors.submit || 'button[type="submit"], input[type="submit"]';

        await page.waitForSelector(emailSelector, { timeout: 10000 });
        await page.type(emailSelector, email, { delay: 50 });

        await page.waitForSelector(passwordSelector, { timeout: 10000 });
        await page.type(passwordSelector, password, { delay: 50 });

        await Promise.all([
            page.click(submitSelector),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
        ]);

        const cookies = await page.cookies();
        return cookies;
    } catch (error) {
        console.error(`❌ Harvest failed:`, error.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
};

module.exports = { harvestCookies };

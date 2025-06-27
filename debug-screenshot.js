const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function debugScreenshot() {
    console.log('🔍 DEBUGGING SCREENSHOT CAPTURE');
    
    const websiteTemplate = fs.readFileSync(path.join(__dirname, 'testttt.html'), 'utf8');
    
    // Simple business customization
    const customization = {
        businessName: "Luxury Properties Group",
        heroTitle: "Luxury Property Excellence",
        primaryColor: "#0a1929",
        secondaryColor: "#d4af37",
        backgroundColor: "#fdfdfd", 
        textColor: "#0a1929",
        accentColor: "#c9a96e"
    };
    
    let customizedHtml = websiteTemplate;
    Object.entries(customization).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        customizedHtml = customizedHtml.replace(new RegExp(placeholder, 'g'), value);
    });
    
    const browser = await puppeteer.launch({
        headless: false, // 🔧 TRY NON-HEADLESS MODE
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security'
        ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📄 Loading website content...');
    await page.setContent(customizedHtml, { waitUntil: 'networkidle0' });
    
    // Enhanced waiting
    console.log('⏳ Waiting for all content to load...');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(5000);
    
    // Check dimensions
    const dimensions = await page.evaluate(() => {
        return {
            scrollHeight: document.documentElement.scrollHeight,
            viewportHeight: window.innerHeight,
            bodyHeight: document.body.scrollHeight
        };
    });
    
    console.log('📐 Page dimensions:', dimensions);
    
    // Take full page screenshot
    console.log('📸 Taking full page screenshot...');
    await page.screenshot({
        path: 'debug-full-page.png',
        fullPage: true
    });
    
    // Take viewport screenshot at different scroll positions
    const scrollPositions = [0, 1000, 2000, 3000, 4000];
    
    for (let i = 0; i < scrollPositions.length; i++) {
        const scrollY = scrollPositions[i];
        console.log(`📸 Taking screenshot at scroll position ${scrollY}px...`);
        
        await page.evaluate((y) => {
            window.scrollTo(0, y);
        }, scrollY);
        
        await page.waitForTimeout(1000);
        
        await page.screenshot({
            path: `debug-scroll-${scrollY}.png`,
            fullPage: false
        });
    }
    
    console.log('✅ Debug screenshots saved!');
    console.log('📁 Check these files:');
    console.log('  - debug-full-page.png (full page)');
    console.log('  - debug-scroll-*.png (viewport at different positions)');
    
    await browser.close();
}

debugScreenshot().catch(console.error); 
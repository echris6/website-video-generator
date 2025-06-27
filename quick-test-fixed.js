const puppeteer = require('puppeteer');
const fs = require('fs');

async function testFixed() {
    console.log('🔍 TESTING FIXED VERSION');
    
    const websiteTemplate = fs.readFileSync('./testttt.html', 'utf8');
    
    let customizedHtml = websiteTemplate.replace(/{{businessName}}/g, 'Test Business');
    customizedHtml = customizedHtml.replace(/{{heroTitle}}/g, 'Test Title');
    customizedHtml = customizedHtml.replace(/{{primaryColor}}/g, '#0a1929');
    customizedHtml = customizedHtml.replace(/{{secondaryColor}}/g, '#d4af37');
    customizedHtml = customizedHtml.replace(/{{backgroundColor}}/g, '#fdfdfd');
    customizedHtml = customizedHtml.replace(/{{textColor}}/g, '#0a1929');
    customizedHtml = customizedHtml.replace(/{{accentColor}}/g, '#c9a96e');
    
    // Apply the same fix as the server
    customizedHtml = customizedHtml.replace(
        '.reveal-element {',
        '.reveal-element { opacity: 1 !important; transform: translateY(0) !important; /* FIXED FOR PUPPETEER */'
    );
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.setContent(customizedHtml, { waitUntil: 'networkidle0' });
    
    // Force reveal all elements
    await page.evaluate(() => {
        const revealElements = document.querySelectorAll('.reveal-element');
        revealElements.forEach(element => {
            element.classList.add('revealed');
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    });
    
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking fixed screenshot...');
    await page.screenshot({
        path: 'test-fixed-screenshot.png',
        fullPage: true
    });
    
    console.log('✅ Fixed screenshot saved as test-fixed-screenshot.png');
    await browser.close();
}

testFixed().catch(console.error); 
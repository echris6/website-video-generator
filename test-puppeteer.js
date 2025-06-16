const puppeteer = require('puppeteer');

async function testPuppeteer() {
    console.log('Testing Puppeteer...');
    
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });
        
        console.log('✅ Browser launched successfully');
        
        const page = await browser.newPage();
        console.log('✅ New page created');
        
        await page.setContent('<h1>Test Page</h1>');
        console.log('✅ Content set');
        
        await page.screenshot({ path: 'test-screenshot.png' });
        console.log('✅ Screenshot taken: test-screenshot.png');
        
        await browser.close();
        console.log('✅ Browser closed');
        
        console.log('\n🎉 Puppeteer is working correctly!');
        
    } catch (error) {
        console.error('❌ Puppeteer test failed:', error.message);
        console.error(error);
    }
}

testPuppeteer(); 
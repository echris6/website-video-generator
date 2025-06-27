const express = require('express');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Load cursor image
let cursorBuffer;
try {
    cursorBuffer = fs.readFileSync(path.join(__dirname, 'cursor.png'));
    console.log('✅ Cursor loaded:', path.join(__dirname, 'cursor.png'));
} catch (error) {
    console.error('❌ Failed to load cursor image:', error.message);
    process.exit(1);
}

app.post('/debug-step5', async (req, res) => {
    try {
        console.log('🔍 STEP 5 DEBUG - Testing each issue individually');
        
        // Initialize variables
        let chatbotCoords = { found: false };
        let inputBefore = { found: false };
        let inputAfter = { found: false };
        let minimizeCoords = { found: false };
        let pageInfo = {};
        
        const browser = await puppeteer.launch({
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-web-security']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Load the website
        const htmlPath = path.join(__dirname, 'testttt.html');
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
        
        console.log('📄 Website loaded, now debugging...');
        
        // **DEBUG 1: Check chatbot button coordinates**
        chatbotCoords = await page.evaluate(() => {
            const button = document.querySelector('.chat-toggle');
            if (button) {
                const rect = button.getBoundingClientRect();
                return {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    found: true
                };
            }
            return { found: false };
        });
        console.log('🖱️ CHATBOT BUTTON:', chatbotCoords);
        
        // Click chatbot to open widget
        if (chatbotCoords.found) {
            await page.click('.chat-toggle');
            await page.waitForTimeout(1000);
            console.log('✅ Chatbot opened');
            
            // **DEBUG 2: Check input field details BEFORE any fixes**
            inputBefore = await page.evaluate(() => {
                const input = document.querySelector('#messageInput');
                if (input) {
                    const styles = window.getComputedStyle(input);
                    return {
                        width: styles.width,
                        flex: styles.flex,
                        value: input.value,
                        found: true
                    };
                }
                return { found: false };
            });
            console.log('📝 INPUT FIELD BEFORE FIXES:', inputBefore);
            
            // **DEBUG 3: Apply simple text fixes and test**
            await page.evaluate(() => {
                const input = document.querySelector('#messageInput');
                const chatWidget = document.querySelector('.chat-widget');
                
                if (chatWidget) {
                    chatWidget.style.width = '420px';
                    console.log('🔧 Widget widened to 420px');
                }
                
                if (input) {
                    input.style.width = '320px';
                    input.style.minWidth = '320px';
                    input.style.flex = 'none';
                    console.log('🔧 Input field fixed to 320px width');
                }
            });
            
            // Type the message
            await page.focus('#messageInput');
            await page.type('#messageInput', 'I want to buy a house', { delay: 50 });
            
            // **DEBUG 4: Check input field AFTER fixes**
            inputAfter = await page.evaluate(() => {
                const input = document.querySelector('#messageInput');
                if (input) {
                    const styles = window.getComputedStyle(input);
                    return {
                        width: styles.width,
                        flex: styles.flex,
                        value: input.value,
                        actualText: input.value,
                        found: true
                    };
                }
                return { found: false };
            });
            console.log('📝 INPUT FIELD AFTER FIXES:', inputAfter);
            
            // **DEBUG 5: Check minimize button coordinates**
            minimizeCoords = await page.evaluate(() => {
                const minimizeBtn = document.querySelector('#chatMinimize');
                if (minimizeBtn) {
                    const rect = minimizeBtn.getBoundingClientRect();
                    return {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                        found: true
                    };
                }
                return { found: false };
            });
            console.log('📉 MINIMIZE BUTTON:', minimizeCoords);
            
            // **DEBUG 6: Take a screenshot to see current state**
            const screenshot = await page.screenshot({ fullPage: false });
            const timestamp = Date.now();
            const screenshotPath = `debug-step5-${timestamp}.png`;
            fs.writeFileSync(screenshotPath, screenshot);
            console.log('📸 Debug screenshot saved:', screenshotPath);
            
            // **DEBUG 7: Check page content loading for scrolling**
            pageInfo = await page.evaluate(() => {
                return {
                    totalHeight: document.documentElement.scrollHeight,
                    viewportHeight: window.innerHeight,
                    sectionsCount: document.querySelectorAll('section').length,
                    heroHeight: document.querySelector('.hero')?.offsetHeight || 0
                };
            });
            console.log('📏 PAGE INFO:', pageInfo);
        }
        
        await browser.close();
        
        res.json({
            status: 'debug_complete',
            chatbotCoords: chatbotCoords || { found: false },
            inputBefore: inputBefore || { found: false },
            inputAfter: inputAfter || { found: false },
            minimizeCoords: minimizeCoords || { found: false },
            pageInfo: pageInfo || {},
            screenshot: `debug-step5-${Date.now()}.png`
        });
        
    } catch (error) {
        console.error('❌ DEBUG ERROR:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = 3006;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║              STEP 5 DEBUG SERVER                  ║
║              Running on port ${PORT}                   ║
║                                                    ║
║  🔍 DEBUG: All Step 5 issues systematically       ║
║  📝 POST /debug-step5 - Run debug analysis        ║
║  ❤️  GET  /health - Health check                   ║
╚════════════════════════════════════════════════════╝
`);
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/debug-step5 -H "Content-Type: application/json" -d '{}'`);
}); 
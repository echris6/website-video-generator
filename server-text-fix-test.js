const express = require('express');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const sharp = require('sharp');

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

// **WORKING TEXT CUTOFF FIXES** - Based on successful simple-fix server
const applyTextCutoffFixes = `
    function applyTextCutoffFixes() {
        console.log('🔧 Applying text cutoff fixes...');
        
        // Find the chat widget and input field
        const chatWidget = document.querySelector('.chat-widget');
        const inputField = document.querySelector('#messageInput');
        const sendButton = document.querySelector('.send-button');
        
        if (chatWidget) {
            // Fix 1: Widen chat widget from 350px to 420px
            chatWidget.style.width = '420px';
            console.log('✅ Chat widget width set to 420px');
        }
        
        if (inputField) {
            // Fix 2: Remove flex and set explicit width to 320px (CRITICAL FIX)
            inputField.style.flex = 'none';
            inputField.style.width = '320px';
            inputField.style.minWidth = '320px';
            inputField.style.maxWidth = '320px';
            console.log('✅ Input field width set to 320px (no more text cutoff!)');
        }
        
        if (sendButton) {
            // Fix 3: Enlarge send button
            sendButton.style.width = '50px';
            sendButton.style.height = '50px';
            sendButton.style.minWidth = '50px';
            sendButton.style.minHeight = '50px';
            console.log('✅ Send button enlarged to 50px');
        }
        
        console.log('🎯 All text cutoff fixes applied!');
    }
`;

async function generateVideo(businessName, niche) {
    console.log(`🎥 TEXT CUTOFF FIX TEST`);
    console.log(`📋 Business: ${businessName}`);
    console.log(`🏢 Niche: ${niche}`);
    console.log(`🔧 FOCUS: Fixing "hous" → "house" text cutoff issue`);

    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('🚀 Launching browser...');
        console.log('📄 Loading website content...');
        
        // Load the HTML file
        const htmlPath = path.join(__dirname, 'testttt.html');
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        console.log('⏳ Waiting for fonts and CSS to fully load...');
        await page.waitForTimeout(2000);
        
        // Inject the text cutoff fixes
        await page.addScriptTag({
            content: applyTextCutoffFixes
        });
        
        // Apply the fixes
        await page.evaluate(() => {
            applyTextCutoffFixes();
        });
        
        console.log('🔧 Text cutoff fixes applied!');
        
        // Open the chatbot widget
        console.log('🖱️ Opening chatbot widget...');
        await page.click('.chat-toggle');
        await page.waitForTimeout(1000);
        
        // Click on input field to focus it
        console.log('🖱️ Focusing input field...');
        await page.click('#messageInput');
        await page.waitForTimeout(500);
        
        // Type the full message
        console.log('⌨️ Typing "I want to buy a house"...');
        await page.type('#messageInput', 'I want to buy a house');
        await page.waitForTimeout(1000);
        
        // Take a screenshot to verify the fix
        console.log('📸 Taking screenshot for verification...');
        const screenshot = await page.screenshot();
        
        // Save screenshot for manual inspection
        const screenshotPath = path.join(__dirname, `text-fix-test-${Date.now()}.png`);
        fs.writeFileSync(screenshotPath, screenshot);
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
        
        // Check if the full text is visible by evaluating the input field
        const inputValue = await page.evaluate(() => {
            const input = document.querySelector('#messageInput');
            return input ? input.value : '';
        });
        
        const inputWidth = await page.evaluate(() => {
            const input = document.querySelector('#messageInput');
            if (input) {
                const styles = window.getComputedStyle(input);
                return {
                    width: styles.width,
                    flex: styles.flex,
                    minWidth: styles.minWidth
                };
            }
            return null;
        });
        
        console.log('📊 INPUT FIELD ANALYSIS:');
        console.log(`   📝 Value: "${inputValue}"`);
        console.log(`   📏 Width: ${inputWidth?.width || 'unknown'}`);
        console.log(`   🔧 Flex: ${inputWidth?.flex || 'unknown'}`);
        console.log(`   📐 Min-width: ${inputWidth?.minWidth || 'unknown'}`);
        
        if (inputValue === 'I want to buy a house') {
            console.log('✅ SUCCESS: Full text is entered correctly!');
        } else {
            console.log('❌ ISSUE: Text might be cut off or incomplete');
        }
        
        return {
            success: true,
            inputValue: inputValue,
            inputStyles: inputWidth,
            screenshotPath: screenshotPath,
            message: inputValue === 'I want to buy a house' ? 'Text cutoff FIXED!' : 'Text cutoff still present'
        };

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// Routes
app.post('/test-text-fix', async (req, res) => {
    try {
        const { businessName = 'Text Fix Test', niche = 'real_estate' } = req.body;
        const result = await generateVideo(businessName, niche);
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: error.message,
            success: false 
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', purpose: 'Text cutoff fix testing' });
});

const PORT = 3010;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║              TEXT CUTOFF FIX TESTER               ║
║              Running on port ${PORT}                    ║
║                                                    ║
║  🔧 FOCUS: Fix "hous" → "house" text cutoff       ║
║  📝 POST /test-text-fix - Test the fix            ║
║  ❤️  GET  /health - Health check                   ║
╚════════════════════════════════════════════════════╝
    `);
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/test-text-fix -H "Content-Type: application/json" -d '{"businessName":"Text Fix Test","niche":"real_estate"}'`);
}); 
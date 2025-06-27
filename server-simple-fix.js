const express = require('express');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Universal delay function compatible with all Puppeteer versions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const PORT = 3011;

app.use(express.json({ limit: '50mb' }));
app.use(express.static('videos'));

// Load original testttt.html
const websiteTemplate = fs.readFileSync(path.join(__dirname, 'testttt.html'), 'utf8');

// Load cursor
const cursorPath = path.join(__dirname, 'cursor.png');
let cursorBase64 = '';
if (fs.existsSync(cursorPath)) {
    const cursorBuffer = fs.readFileSync(cursorPath);
    cursorBase64 = cursorBuffer.toString('base64');
    console.log(`✅ Cursor loaded: ${cursorPath}`);
}

console.log(`
╔════════════════════════════════════════════════════╗
║              SIMPLE FIX SERVER                    ║
║              Running on port ${PORT}                    ║
║                                                    ║
║  🎯 Minimal but EFFECTIVE fixes                    ║
║  📝 POST /generate-video - Generate video          ║
║  ❤️  GET  /health - Health check                   ║
╚════════════════════════════════════════════════════╝
`);

// Simple fix function that directly targets the problem
const applySimpleFix = `
    // SIMPLE BUT EFFECTIVE FIXES - No complex injection!
    function applySimpleFix() {
        // 1. Make chat widget wider (350px → 420px)
        const chatWidget = document.querySelector('.chat-widget');
        if (chatWidget) {
            chatWidget.style.width = '420px';
            chatWidget.style.minWidth = '420px';
            chatWidget.style.maxWidth = '420px';
            console.log('✅ Chat widget widened to 420px');
        }
        
        // 2. Fix input field - remove flex:1, give specific width
        const chatInput = document.querySelector('.chat-input input');
        if (chatInput) {
            chatInput.style.flex = 'none';
            chatInput.style.width = '320px';
            chatInput.style.minWidth = '320px';
            console.log('✅ Input field set to 320px width');
        }
        
        // 3. Make send button bigger
        const sendButton = document.querySelector('.send-button');
        if (sendButton) {
            sendButton.style.width = '50px';
            sendButton.style.height = '50px';
            sendButton.style.minWidth = '50px';
            console.log('✅ Send button enlarged to 50px');
        }
        
        console.log('✅ Simple fixes applied successfully!');
    }
    
    // Apply fixes immediately
    applySimpleFix();
    
    // Also apply after any dynamic changes
    setTimeout(applySimpleFix, 1000);
`;

// Cursor movement functions
const cursorFunctions = `
    let cursorElement = null;
    
    function createCursor() {
        if (cursorElement) return;
        
        cursorElement = document.createElement('div');
        cursorElement.style.position = 'fixed';
        cursorElement.style.top = '50%';
        cursorElement.style.left = '50%';
        cursorElement.style.width = '20px';
        cursorElement.style.height = '20px';
        cursorElement.style.backgroundImage = 'url(data:image/png;base64,${cursorBase64})';
        cursorElement.style.backgroundSize = 'contain';
        cursorElement.style.backgroundRepeat = 'no-repeat';
        cursorElement.style.pointerEvents = 'none';
        cursorElement.style.zIndex = '999999';
        cursorElement.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(cursorElement);
        console.log('✅ Cursor created');
    }
    
    function updateCursorPosition(x, y) {
        if (cursorElement) {
            cursorElement.style.left = x + 'px';
            cursorElement.style.top = y + 'px';
            cursorElement.style.transform = 'translate(-10px, -10px)';
        }
    }
    
    function findChatbotButton() {
        const button = document.querySelector('#chatToggle');
        if (button) {
            const rect = button.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            console.log(\`✅ Chatbot button found at (\${x}, \${y})\`);
            return { x, y, element: button };
        }
        console.log('❌ Chatbot button not found');
        return null;
    }
    
    function clickChatbotButton() {
        const button = document.querySelector('#chatToggle');
        if (button) {
            button.click();
            console.log('✅ Chatbot button clicked');
            return true;
        }
        return false;
    }
    
    function findInputField() {
        const input = document.querySelector('#messageInput');
        if (input) {
            const rect = input.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            console.log(\`✅ Input field found at (\${x}, \${y})\`);
            return { x, y, element: input };
        }
        return null;
    }
    
    function clickInputField() {
        const input = document.querySelector('#messageInput');
        if (input) {
            input.click();
            input.focus();
            console.log('✅ Input field clicked and focused');
            return true;
        }
        return false;
    }
    
    function typeMessage(message) {
        const input = document.querySelector('#messageInput');
        if (input) {
            input.value = message;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            console.log(\`✅ Typed message: "\${message}"\`);
            return true;
        }
        return false;
    }
    
    function findSendButton() {
        const button = document.querySelector('#sendButton');
        if (button) {
            const rect = button.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            console.log(\`✅ Send button found at (\${x}, \${y})\`);
            return { x, y, element: button };
        }
        return null;
    }
    
    function clickSendButton() {
        const button = document.querySelector('#sendButton');
        if (button) {
            button.click();
            console.log('✅ Send button clicked');
            return true;
        }
        return false;
    }
`;

async function generateVideo(businessName = 'Real Estate Demo', niche = 'real_estate') {
    console.log(`\n🎥 SIMPLE FIX CHATBOT INTERACTION`);
    console.log(`📋 Business: ${businessName}`);
    console.log(`🏢 Niche: ${niche}`);
    console.log(`🖱️ Simple but effective fixes applied!`);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--disable-default-apps',
            '--disable-features=TranslateUI',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        console.log(`🚀 Launching browser...`);
        console.log(`📄 Loading website content...`);

        // Load the website with our simple fixes
        await page.setContent(websiteTemplate, { waitUntil: 'networkidle0' });

        console.log(`⏳ Waiting for fonts and CSS to fully load...`);
        await delay(4000);

        console.log(`🎯 Applying simple fixes...`);
        
        // Inject our simple fix function
        await page.evaluate(applySimpleFix);
        
        // Inject cursor functions
        await page.evaluate(cursorFunctions);

        console.log(`🎬 Starting video generation...`);

        const frames = [];
        const totalFrames = 540; // 9 seconds at 60fps
        const duration = 9;

        // Create cursor
        await page.evaluate(() => createCursor());

        for (let frame = 0; frame < totalFrames; frame++) {
            const timeInSeconds = (frame / 60);
            
            // Phase 1: Move to chatbot (0-2s)
            if (timeInSeconds <= 2) {
                const progress = timeInSeconds / 2;
                const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                
                const startX = 960; // Center of screen
                const startY = 540;
                const endX = 1858; // Chatbot button
                const endY = 1018;
                
                const currentX = startX + (endX - startX) * easeProgress;
                const currentY = startY + (endY - startY) * easeProgress;
                
                await page.evaluate((x, y) => updateCursorPosition(x, y), currentX, currentY);
            }
            // Phase 2: Click chatbot (2-2.5s)
            else if (timeInSeconds <= 2.5) {
                if (frame === Math.floor(2 * 60)) { // At 2 seconds
                    await page.evaluate(() => clickChatbotButton());
                    await delay(200); // Wait for widget to open
                }
            }
            // Phase 3: Move to input field (2.5-3.5s)
            else if (timeInSeconds <= 3.5) {
                const progress = (timeInSeconds - 2.5) / 1;
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                
                const startX = 1858;
                const startY = 1018;
                
                // Find input field position
                const inputField = await page.evaluate(() => findInputField());
                if (inputField) {
                    const endX = inputField.x;
                    const endY = inputField.y;
                    
                    const currentX = startX + (endX - startX) * easeProgress;
                    const currentY = startY + (endY - startY) * easeProgress;
                    
                    await page.evaluate((x, y) => updateCursorPosition(x, y), currentX, currentY);
                }
            }
            // Phase 4: Click input and type (3.5-6s)
            else if (timeInSeconds <= 6) {
                if (frame === Math.floor(3.5 * 60)) { // At 3.5 seconds
                    await page.evaluate(() => clickInputField());
                    await delay(100);
                }
                
                if (frame === Math.floor(4 * 60)) { // At 4 seconds, start typing
                    const message = "Buy house";
                    await page.evaluate((msg) => typeMessage(msg), message);
                }
            }
            // Phase 5: Move to send and click (6-9s)
            else {
                if (timeInSeconds <= 7.5) {
                    const progress = (timeInSeconds - 6) / 1.5;
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    
                    const inputField = await page.evaluate(() => findInputField());
                    const sendButton = await page.evaluate(() => findSendButton());
                    
                    if (inputField && sendButton) {
                        const startX = inputField.x;
                        const startY = inputField.y;
                        const endX = sendButton.x;
                        const endY = sendButton.y;
                        
                        const currentX = startX + (endX - startX) * easeProgress;
                        const currentY = startY + (endY - startY) * easeProgress;
                        
                        await page.evaluate((x, y) => updateCursorPosition(x, y), currentX, currentY);
                    }
                }
                
                if (frame === Math.floor(7.5 * 60)) { // At 7.5 seconds
                    await page.evaluate(() => clickSendButton());
                }
            }

            // Take screenshot
            const screenshot = await page.screenshot({ 
                type: 'png',
                clip: { x: 0, y: 0, width: 1920, height: 1080 }
            });
            frames.push(screenshot);

            // Progress logging
            if (frame % 180 === 0 || frame === totalFrames - 1) {
                const progress = ((frame + 1) / totalFrames * 100).toFixed(1);
                const currentTime = (frame / 60).toFixed(1);
                console.log(`  📸 Frame ${frame + 1}/${totalFrames} (${progress}%) - ${currentTime}s`);
            }
        }

        console.log(`✅ All frames captured!`);
        
        // Create video
        const timestamp = Date.now();
        const filename = `simple_fix_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
        const outputPath = path.join(__dirname, 'videos', filename);

        console.log(`🎬 Creating video...`);
        
        // Save frames temporarily
        const frameDir = path.join(__dirname, 'temp_frames');
        if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir);
        
        for (let i = 0; i < frames.length; i++) {
            fs.writeFileSync(path.join(frameDir, `frame_${i.toString().padStart(6, '0')}.png`), frames[i]);
        }

        // Create video with ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(path.join(frameDir, 'frame_%06d.png'))
                .inputFPS(60)
                .outputOptions([
                    '-c:v libx264',
                    '-preset medium',
                    '-crf 23',
                    '-pix_fmt yuv420p',
                    '-movflags +faststart'
                ])
                .output(outputPath)
                .on('progress', (progress) => {
                    if (progress.percent) {
                        console.log(`  🎬 Encoding: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', () => {
                    console.log(`  ✅ Video encoding complete!`);
                    resolve();
                })
                .on('error', reject)
                .run();
        });

        // Clean up temp frames
        console.log(`🧹 Cleaning up frames...`);
        fs.readdirSync(frameDir).forEach(file => {
            fs.unlinkSync(path.join(frameDir, file));
        });
        fs.rmdirSync(frameDir);

        const stats = fs.statSync(outputPath);
        const fileSize = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ SUCCESS! Video: ${filename} (${fileSize} MB)`);
        
        return { success: true, filename, fileSize };

    } catch (error) {
        console.error(`❌ ERROR: ${error.message}`);
        throw error;
    } finally {
        await browser.close();
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', server: 'simple-fix', port: PORT });
});

// Video generation endpoint
app.post('/generate-video', async (req, res) => {
    try {
        const { businessName = 'Simple Fix Test', niche = 'real_estate' } = req.body;
        const result = await generateVideo(businessName, niche);
        res.json(result);
    } catch (error) {
        console.error('Video generation failed:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Simple Fix Test","niche":"real_estate"}'`);
}); 
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

// **PROVEN TYPING FIXES** - Eliminates all text cursor blinking
const TYPING_FIXES = `
    function applyTypingFixes() {
        const style = document.createElement('style');
        style.textContent = \`
            /* ELIMINATE ALL TEXT CURSOR BLINKING */
            *, *::before, *::after,
            input, textarea, [contenteditable],
            .chat-input input, #messageInput {
                caret-color: transparent !important;
                text-shadow: none !important;
            }
            
            /* DISABLE ALL CURSOR ANIMATIONS */
            input:focus, textarea:focus, [contenteditable]:focus {
                caret-color: transparent !important;
                outline: none !important;
                animation: none !important;
            }
            
            /* STABLE INPUT FIELD */
            #messageInput {
                width: 320px !important;
                min-width: 320px !important;
                flex: 0 0 auto !important;
                caret-color: transparent !important;
            }
        \`;
        document.head.appendChild(style);
        console.log('🔧 Text cursor blinking eliminated');
    }
`;

// **CHARACTER-BY-CHARACTER TYPING ANIMATION**
const TYPING_ANIMATION = `
    async function typeMessageCharByChar(inputElement, message, delay = 150) {
        inputElement.value = '';
        inputElement.focus();
        
        for (let i = 0; i < message.length; i++) {
            inputElement.value = message.substring(0, i + 1);
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.log('⌨️ Typing completed:', inputElement.value);
    }
`;

async function generateVideo(businessName, niche) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });

    let page;
    try {
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Load the website
        const htmlContent = fs.readFileSync(path.join(__dirname, 'testttt.html'), 'utf8');
        const finalHtml = htmlContent
            .replace(/{{businessName}}/g, businessName)
            .replace(/{{heroTitle}}/g, 'Luxury Real Estate Excellence')
            .replace(/{{primaryColor}}/g, '#0a1929')
            .replace(/{{secondaryColor}}/g, '#d4af37')
            .replace(/{{backgroundColor}}/g, '#fdfdfd')
            .replace(/{{textColor}}/g, '#0a1929')
            .replace(/{{accentColor}}/g, '#c9a96e');

        await page.setContent(finalHtml);
        await page.waitForTimeout(2000);

        // Inject all functions
        await page.evaluate(TYPING_FIXES);
        await page.evaluate(TYPING_ANIMATION);
        
        // Apply typing fixes immediately
        await page.evaluate('applyTypingFixes()');

        console.log('✅ All functions injected and typing fixes applied');

        // Get page dimensions
        const pageInfo = await page.evaluate(() => ({
            totalHeight: document.body.scrollHeight,
            viewportHeight: window.innerHeight,
            viewportWidth: window.innerWidth
        }));

        console.log('📏 Page height:', pageInfo.totalHeight + 'px');
        console.log('📏 Scrollable:', (pageInfo.totalHeight - pageInfo.viewportHeight) + 'px');

        // **STEP 5 TIMING** - 15 seconds total
        const totalFrames = 900; // 15 seconds * 60fps
        const fps = 60;
        
        // **CURSOR STARTS IN CENTER** 
        const startX = Math.round(pageInfo.viewportWidth / 2); // 960px (center)
        const startY = Math.round(pageInfo.viewportHeight / 2); // 540px (center)
        const chatbotX = 1858;
        const chatbotY = 1018;
        const inputX = 1636;
        const inputY = 934;
        const sendX = 1849;
        const sendY = 934;
        const minimizeX = 1854;
        const minimizeY = 562;

        console.log(`🎬 Generating ${totalFrames} frames...`);
        console.log(`📐 Step 5: CENTER cursor (${startX},${startY}) → Interaction → Minimize (15 seconds)`);

        const frames = [];

        for (let frame = 0; frame < totalFrames; frame++) {
            const time = frame / fps;
            let cursorX = startX;
            let cursorY = startY;
            
            // **PHASE 1: Move to chatbot (0-3s)**
            if (time <= 3) {
                const progress = time / 3;
                const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
                cursorX = Math.round(startX + (chatbotX - startX) * eased);
                cursorY = Math.round(startY + (chatbotY - startY) * eased);
            }
            // **PHASE 2: Click chatbot at 3.5s**
            else if (time >= 3.5 && time < 3.6 && frame % 10 === 0) {
                await page.evaluate(() => {
                    const chatBtn = document.querySelector('.chat-toggle');
                    if (chatBtn) chatBtn.click();
                });
                console.log(`🖱️ CLICKED chatbot button at frame ${frame} (${time.toFixed(1)}s)`);
                cursorX = chatbotX;
                cursorY = chatbotY;
            }
            // **PHASE 3: Move to input (3.6-5s)**
            else if (time > 3.6 && time <= 5) {
                const progress = (time - 3.6) / 1.4;
                const eased = 1 - Math.pow(1 - progress, 3);
                cursorX = Math.round(chatbotX + (inputX - chatbotX) * eased);
                cursorY = Math.round(chatbotY + (inputY - chatbotY) * eased);
            }
            // **PHASE 4: Click input and start typing (5-10s)**
            else if (time >= 5 && time < 10) {
                cursorX = inputX;
                cursorY = inputY;
                
                // Click input field at 5s
                if (time >= 5 && time < 5.1 && frame % 5 === 0) {
                    await page.evaluate(() => {
                        const input = document.querySelector('#messageInput');
                        if (input) {
                            input.focus();
                            input.click();
                        }
                    });
                    console.log(`🖱️ FOCUSED input field at frame ${frame} (${time.toFixed(1)}s)`);
                }
                
                // **CHARACTER-BY-CHARACTER TYPING** (5.5-9.5s)
                if (time >= 5.5 && time < 9.5) {
                    const message = "I want to buy a house";
                    const typingProgress = (time - 5.5) / 4; // 4 seconds to type
                    const charactersToShow = Math.floor(typingProgress * message.length);
                    const currentText = message.substring(0, charactersToShow);
                    
                    await page.evaluate((text) => {
                        const input = document.querySelector('#messageInput');
                        if (input && input.value !== text) {
                            input.value = text;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }, currentText);
                }
            }
            // **PHASE 5: Move to send button (10-11s)**
            else if (time > 10 && time <= 11) {
                const progress = (time - 10) / 1;
                const eased = 1 - Math.pow(1 - progress, 3);
                cursorX = Math.round(inputX + (sendX - inputX) * eased);
                cursorY = Math.round(inputY + (sendY - inputY) * eased);
            }
            // **PHASE 6: Click send (11.5s)**
            else if (time >= 11.5 && time < 11.6 && frame % 5 === 0) {
                await page.evaluate(() => {
                    const sendBtn = document.querySelector('#sendButton');
                    if (sendBtn) sendBtn.click();
                });
                console.log(`🖱️ CLICKED send button at frame ${frame} (${time.toFixed(1)}s)`);
                cursorX = sendX;
                cursorY = sendY;
            }
            // **PHASE 7: Move to minimize (11.6-13s)**
            else if (time > 11.6 && time <= 13) {
                const progress = (time - 11.6) / 1.4;
                const eased = 1 - Math.pow(1 - progress, 3);
                cursorX = Math.round(sendX + (minimizeX - sendX) * eased);
                cursorY = Math.round(sendY + (minimizeY - sendY) * eased);
            }
            // **PHASE 8: Click minimize (13.5s)**
            else if (time >= 13.5 && time < 13.6 && frame % 5 === 0) {
                await page.evaluate(() => {
                    const minimizeBtn = document.querySelector('#chatMinimize');
                    if (minimizeBtn) minimizeBtn.click();
                });
                console.log(`🖱️ MINIMIZED chatbot at frame ${frame} (${time.toFixed(1)}s)`);
                cursorX = minimizeX;
                cursorY = minimizeY;
            }
            // **PHASE 9: Static (13.6-15s)**
            else {
                cursorX = minimizeX;
                cursorY = minimizeY;
            }

            // Take screenshot
            const screenshotBuffer = await page.screenshot({ type: 'png' });
            
            // Composite cursor
            const frameBuffer = await sharp(screenshotBuffer)
                .composite([{
                    input: cursorBuffer,
                    left: Math.round(cursorX),
                    top: Math.round(cursorY)
                }])
                .png()
                .toBuffer();

            frames.push(frameBuffer);

            // Progress logging
            if (frame % 150 === 0 || frame === totalFrames - 1) {
                console.log(`  📸 Frame ${frame}/${totalFrames} (${(frame/totalFrames*100).toFixed(1)}%) - ${time.toFixed(1)}s`);
            }
        }

        console.log('✅ All frames captured!');

        // Create video
        console.log('🎬 Creating video...');
        const timestamp = Date.now();
        const videoName = `step5_typing_fixed_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
        const videoPath = path.join(__dirname, 'videos', videoName);

        // Ensure videos directory exists
        if (!fs.existsSync(path.join(__dirname, 'videos'))) {
            fs.mkdirSync(path.join(__dirname, 'videos'), { recursive: true });
        }

        // Create temp directory for frames
        const tempDir = path.join(__dirname, 'temp_frames');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        // Save frames to temp directory
        for (let i = 0; i < frames.length; i++) {
            const framePath = path.join(tempDir, `frame_${i.toString().padStart(6, '0')}.png`);
            fs.writeFileSync(framePath, frames[i]);
        }

        // Create video with FFmpeg
        const ffmpegCommand = [
            '-y',
            '-framerate', fps.toString(),
            '-i', path.join(tempDir, 'frame_%06d.png'),
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-crf', '23',
            '-preset', 'medium',
            videoPath
        ];

        await new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', ffmpegCommand);
            ffmpeg.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg exited with code ${code}`));
            });
        });

        // Clean up temp frames
        const frameFiles = fs.readdirSync(tempDir);
        frameFiles.forEach(file => {
            fs.unlinkSync(path.join(tempDir, file));
        });
        fs.rmdirSync(tempDir);

        const stats = fs.statSync(videoPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log(`✅ SUCCESS! Video: ${videoName} (${sizeMB} MB)`);
        return videoName;

    } finally {
        if (page) await page.close();
        await browser.close();
    }
}

// API endpoints
app.post('/generate-video', async (req, res) => {
    try {
        const { businessName, niche } = req.body;
        console.log('🎥 STEP 5: TYPING FIXED');
        console.log('📋 Business:', businessName);
        console.log('🏢 Niche:', niche);
        console.log('🔧 FIXES: Center cursor, no blinking, character-by-character typing');

        const videoName = await generateVideo(businessName, niche);
        res.json({ 
            success: true, 
            videoName,
            message: 'Video generated successfully with typing fixes!' 
        });
    } catch (error) {
        console.error('❌ Video generation failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'Step 5 Typing Fixed Server' });
});

// Start server
const PORT = 3050;
app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║           STEP 5: TYPING FIXED                    ║');
    console.log(`║              Running on port ${PORT}                   ║`);
    console.log('║                                                    ║');
    console.log('║  🔧 FIXED: Center cursor, no blink, char typing   ║');
    console.log('║  📝 POST /generate-video - Generate video          ║');
    console.log('║  ❤️  GET  /health - Health check                   ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Typing Fixed Test","niche":"real_estate"}'`);
}); 
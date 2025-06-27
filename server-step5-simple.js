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

// **SIMPLE STEP 5** - Step 4 + Minimize (15 seconds total)
async function generateVideo(businessName, niche) {
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps',
            '--disable-popup-blocking',
            '--disable-translate',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-ipc-flooding-protection'
        ],
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    
    try {
        // Load website
        const htmlContent = fs.readFileSync(path.join(__dirname, 'testttt.html'), 'utf8');
        await page.setContent(htmlContent);
        await page.waitForTimeout(2000);

        console.log('⏳ Content loaded');

        // Inject all functions
        await page.evaluate(() => {
            // Find chatbot button
            window.findChatbotButton = function() {
                const button = document.querySelector('.chat-toggle');
                if (!button) return null;
                const rect = button.getBoundingClientRect();
                return { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
            };

            // Find minimize button
            window.findMinimizeButton = function() {
                const button = document.querySelector('.chat-minimize');
                if (!button) return null;
                const rect = button.getBoundingClientRect();
                return { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
            };

            // Click functions
            window.clickChatbotButton = function() {
                const button = document.querySelector('.chat-toggle');
                if (button) button.click();
            };

            window.clickMinimizeButton = function() {
                const button = document.querySelector('.chat-minimize');
                if (button) button.click();
            };

            window.focusInputField = function() {
                const input = document.querySelector('#messageInput');
                if (input) {
                    input.focus();
                    input.click();
                }
            };

            window.typeMessage = function(message) {
                const input = document.querySelector('#messageInput');
                if (input) {
                    input.value = message;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            };

            window.clickSendButton = function() {
                const button = document.querySelector('#sendButton');
                if (button) button.click();
            };
        });

        console.log('✅ All functions injected and ready');
        
        // Get page dimensions
        const pageInfo = await page.evaluate(() => ({
            totalHeight: document.body.scrollHeight,
            viewportHeight: window.innerHeight
        }));
        
        console.log('📏 Page height:', pageInfo.totalHeight + 'px');
        console.log('📏 Scrollable:', (pageInfo.totalHeight - pageInfo.viewportHeight) + 'px');

        // **SIMPLE 15-SECOND VIDEO**
        const duration = 15; // seconds
        const fps = 60;
        const totalFrames = duration * fps; // 900 frames
        
        console.log('🎬 Generating', totalFrames, 'frames...');
        console.log('📐 Step 5: SIMPLE - Step 4 + minimize (15 seconds)');

        const frames = [];
        
        // Simple timing (15 seconds total):
        // 0-3.6s: Move to chatbot
        // 4.2s: Click chatbot  
        // 4.2-6s: Move to input
        // 6-9.6s: Type message
        // 9.6-11.4s: Move to send
        // 11.4s: Send message
        // 12-13.5s: Move to minimize
        // 13.5s: Minimize
        // 13.5-15s: Static

        const chatbotPos = { x: 1858, y: 1018 };
        const inputPos = { x: 1636, y: 934 };
        const sendPos = { x: 1849, y: 934 };
        const minimizePos = { x: 1854, y: 562 };

        for (let frame = 0; frame < totalFrames; frame++) {
            const time = frame / fps;
            let cursorX = 200, cursorY = 200;

            if (time <= 3.6) {
                // Move to chatbot button (0-3.6s)
                const progress = time / 3.6;
                const eased = 1 - Math.pow(1 - progress, 3);
                cursorX = 200 + (chatbotPos.x - 200) * eased;
                cursorY = 200 + (chatbotPos.y - 200) * eased;
            } else if (time <= 6.0) {
                // Move to input field (4.2-6s)
                if (time >= 4.2) {
                    const progress = (time - 4.2) / (6.0 - 4.2);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    cursorX = chatbotPos.x + (inputPos.x - chatbotPos.x) * eased;
                    cursorY = chatbotPos.y + (inputPos.y - chatbotPos.y) * eased;
                } else {
                    cursorX = chatbotPos.x;
                    cursorY = chatbotPos.y;
                }
            } else if (time <= 9.6) {
                // At input field (6-9.6s)
                cursorX = inputPos.x;
                cursorY = inputPos.y;
            } else if (time <= 11.4) {
                // Move to send button (9.6-11.4s)
                const progress = (time - 9.6) / (11.4 - 9.6);
                const eased = 1 - Math.pow(1 - progress, 3);
                cursorX = inputPos.x + (sendPos.x - inputPos.x) * eased;
                cursorY = inputPos.y + (sendPos.y - inputPos.y) * eased;
            } else if (time <= 13.5) {
                // Move to minimize button (12-13.5s)
                if (time >= 12.0) {
                    const progress = (time - 12.0) / (13.5 - 12.0);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    cursorX = sendPos.x + (minimizePos.x - sendPos.x) * eased;
                    cursorY = sendPos.y + (minimizePos.y - sendPos.y) * eased;
                } else {
                    cursorX = sendPos.x;
                    cursorY = sendPos.y;
                }
            } else {
                // Static at minimize position (13.5-15s)
                cursorX = minimizePos.x;
                cursorY = minimizePos.y;
            }

            // Actions at specific frames
            if (frame === Math.round(4.2 * fps)) {
                await page.evaluate(() => window.clickChatbotButton());
                console.log('🖱️ CLICKED chatbot button at frame', frame, `(${time.toFixed(1)}s)`);
            }
            if (frame === Math.round(6.0 * fps)) {
                await page.evaluate(() => window.focusInputField());
                await page.evaluate(() => window.typeMessage('I want to buy a house'));
                console.log('⌨️ TYPED message at frame', frame, `(${time.toFixed(1)}s)`);
            }
            if (frame === Math.round(11.4 * fps)) {
                await page.evaluate(() => window.clickSendButton());
                console.log('🖱️ SENT message at frame', frame, `(${time.toFixed(1)}s)`);
            }
            if (frame === Math.round(13.5 * fps)) {
                await page.evaluate(() => window.clickMinimizeButton());
                console.log('🖱️ MINIMIZED chatbot at frame', frame, `(${time.toFixed(1)}s)`);
            }

            // Take screenshot
            const screenshot = await page.screenshot({ 
                type: 'png',
                clip: { x: 0, y: 0, width: 1920, height: 1080 }
            });

            // Add cursor overlay
            const frameWithCursor = await sharp(screenshot)
                .composite([{
                    input: cursorBuffer,
                    left: Math.round(cursorX),
                    top: Math.round(cursorY)
                }])
                .png()
                .toBuffer();

            frames.push(frameWithCursor);

            // Progress logging
            if (frame % 150 === 0 || frame === totalFrames - 1) {
                console.log(`  📸 Frame ${frame}/${totalFrames} (${(frame/totalFrames*100).toFixed(1)}%) - ${time.toFixed(1)}s`);
            }
        }

        console.log('✅ All frames captured!');

        // Create video
        console.log('🎬 Creating video...');
        
        const timestamp = Date.now();
        const videoName = `step5_simple_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
        
        await createVideoFromFrames(frames, fps, videoName);
        
        console.log(`✅ SUCCESS! Video: ${videoName}`);
        
        return { success: true, videoPath: videoName, frames: totalFrames, duration, size: `${(fs.statSync(path.join(__dirname, 'videos', videoName)).size / (1024 * 1024)).toFixed(2)} MB` };

    } catch (error) {
        console.error('❌ Video generation failed:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

async function createVideoFromFrames(frames, fps, filename) {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(__dirname, 'videos', filename);
        
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-f', 'image2pipe',
            '-vcodec', 'png',
            '-r', fps.toString(),
            '-i', '-',
            '-vcodec', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-preset', 'medium',
            '-crf', '23',
            '-movflags', '+faststart',
            outputPath
        ]);

        ffmpeg.stdin.on('error', (err) => {
            if (err.code !== 'EPIPE') {
                console.error('FFmpeg stdin error:', err);
            }
        });

        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();
            if (output.includes('frame=')) {
                const match = output.match(/frame=\s*(\d+)/);
                if (match) {
                    const currentFrame = parseInt(match[1]);
                    const progress = (currentFrame / frames.length * 100).toFixed(1);
                    console.log(`  🎬 Encoding: ${progress}%`);
                }
            }
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                console.log('  ✅ Video encoding complete!');
                resolve();
            } else {
                reject(new Error(`FFmpeg process exited with code ${code}`));
            }
        });

        ffmpeg.on('error', (err) => {
            reject(err);
        });

        // Write frames to FFmpeg
        let frameIndex = 0;
        const writeFrame = () => {
            if (frameIndex < frames.length) {
                const canContinue = ffmpeg.stdin.write(frames[frameIndex]);
                frameIndex++;
                if (canContinue) {
                    process.nextTick(writeFrame);
                } else {
                    ffmpeg.stdin.once('drain', writeFrame);
                }
            } else {
                ffmpeg.stdin.end();
            }
        };
        writeFrame();
    });
}

// Routes
app.post('/generate-video', async (req, res) => {
    try {
        const { businessName = 'Step 5 Simple Test', niche = 'real_estate' } = req.body;
        
        console.log('🎥 STEP 5: SIMPLE IMPLEMENTATION');
        console.log('📋 Business:', businessName);
        console.log('🏢 Niche:', niche);
        console.log('⚡ Fast & Simple: Step 4 + minimize (15 seconds only)');
        
        const result = await generateVideo(businessName, niche);
        res.json(result);
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', message: 'Step 5 Simple server is running' });
});

const PORT = 3040;
app.listen(PORT, () => {
    console.log('✅ Cursor loaded:', path.join(__dirname, 'cursor.png'));
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║           STEP 5: SIMPLE IMPLEMENTATION           ║');
    console.log(`║              Running on port ${PORT}                   ║`);
    console.log('║                                                    ║');
    console.log('║  ⚡ FAST: Step 4 + minimize (15s only)            ║');
    console.log('║  📝 POST /generate-video - Generate video          ║');
    console.log('║  ❤️  GET  /health - Health check                   ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Simple Fast Test","niche":"real_estate"}'`);
}); 
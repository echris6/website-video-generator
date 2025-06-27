const express = require('express');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const sharp = require('sharp');

// Universal delay function compatible with all Puppeteer versions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

// **PROVEN TEXT FIXES** - Exact working version from debug analysis
const WORKING_TEXT_FIXES = `
    function applyTextCutoffFix() {
        console.log('🔧 Applying proven text cutoff fix...');
        
        // PROVEN: These exact fixes work from debug analysis
        const chatWidget = document.querySelector('.chat-widget');
        const inputField = document.querySelector('#messageInput');
        
        if (chatWidget) {
            chatWidget.style.setProperty('width', '420px', 'important');
        }
        
        if (inputField) {
            // CRITICAL: This is the exact fix that works
            inputField.style.setProperty('width', '320px', 'important');
            inputField.style.setProperty('flex', '0 0 auto', 'important');
            inputField.style.setProperty('min-width', '320px', 'important');
            console.log('✅ Input field fixed: 260px → 320px');
        }
        
        return true;
    }
`;

// **SIMPLIFIED CHATBOT FUNCTIONS** - Based on successful Step 4
const CHATBOT_FUNCTIONS = `
    function clickChatbotButton() {
        const button = document.querySelector('.chat-toggle');
        if (button) {
            button.click();
            console.log('✅ Chatbot opened');
            return true;
        }
        return false;
    }
    
    function focusInputField() {
        const input = document.querySelector('#messageInput');
        if (input) {
            input.click();
            input.focus();
            console.log('✅ Input focused');
            return true;
        }
        return false;
    }
    
    function typeMessage(text) {
        const input = document.querySelector('#messageInput');
        if (input) {
            input.value = text;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Typed:', text);
            return true;
        }
        return false;
    }
    
    function clickSendButton() {
        const button = document.querySelector('.send-button');
        if (button) {
            button.click();
            console.log('✅ Message sent');
            return true;
        }
        return false;
    }
    
    function clickMinimizeButton() {
        const button = document.querySelector('#chatMinimize');
        if (button) {
            button.click();
            console.log('✅ Chatbot minimized');
            return true;
        }
        return false;
    }
`;

// **PRECISE CURSOR POSITIONING** - Using integers only (fixes Sharp errors)
function getCursorPositionForFrame(frameIndex, totalFrames, fps) {
    const currentTime = frameIndex / fps;
    
    // FIXED COORDINATES - Integers only
    const positions = {
        start: { x: 200, y: 200 },
        chatbot: { x: 1858, y: 1018 },
        input: { x: 1636, y: 934 },
        send: { x: 1849, y: 934 },
        minimize: { x: 1854, y: 562 }  // CORRECT coordinates from debug
    };
    
    // **STEP 5 TIMING** - 25 seconds total
    if (currentTime <= 3.75) {
        // Move to chatbot (0-3.75s)
        const progress = currentTime / 3.75;
        return interpolate(positions.start, positions.chatbot, progress);
    } else if (currentTime <= 4.4) {
        // Static on chatbot (3.75-4.4s)
        return positions.chatbot;
    } else if (currentTime <= 6.25) {
        // Move to input (4.4-6.25s)
        const progress = (currentTime - 4.4) / (6.25 - 4.4);
        return interpolate(positions.chatbot, positions.input, progress);
    } else if (currentTime <= 10) {
        // Static during typing (6.25-10s)
        return positions.input;
    } else if (currentTime <= 11.9) {
        // Move to send (10-11.9s)
        const progress = (currentTime - 10) / (11.9 - 10);
        return interpolate(positions.input, positions.send, progress);
    } else if (currentTime <= 12.5) {
        // Static on send (11.9-12.5s)
        return positions.send;
    } else if (currentTime <= 13.75) {
        // Move to minimize (12.5-13.75s)
        const progress = (currentTime - 12.5) / (13.75 - 12.5);
        return interpolate(positions.send, positions.minimize, progress);
    } else if (currentTime <= 15) {
        // Static on minimize (13.75-15s)
        return positions.minimize;
    } else {
        // During scrolling - cursor in corner
        return { x: 100, y: 100 };
    }
}

function interpolate(start, end, progress) {
    // Smooth easing with integer output
    const eased = progress * progress * (3 - 2 * progress);
    return {
        x: Math.round(start.x + (end.x - start.x) * eased),
        y: Math.round(start.y + (end.y - start.y) * eased)
    };
}

async function generateVideo(req, res) {
    let browser;
    
    try {
        const { businessName = 'FINAL CLEAN TEST', niche = 'real_estate' } = req.body;
        
        console.log('🎥 STEP 5: FINAL CLEAN IMPLEMENTATION');
        console.log(`📋 Business: ${businessName}`);
        console.log(`🏢 Niche: ${niche}`);
        console.log('🧹 Clean implementation: No conflicts, proven fixes only');
        
        const fps = 60;
        const duration = 25;
        const totalFrames = fps * duration;
        
        console.log(`🎬 Generating ${totalFrames} frames...`);
        console.log('📐 Step 5: Complete chatbot interaction + site tour (25 seconds)');
        
        // **SINGLE BROWSER INSTANCE** - Proper resource management
        browser = await puppeteer.launch({
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Load website
        const htmlPath = path.join(__dirname, 'testttt.html');
        await page.goto(`file://${htmlPath}`);
        
        // **MINIMAL STABILIZATION** - Prevent hero glitching
        await delay(500);  // Reduced from 1000ms+
        console.log('⏳ Content loaded');
        
        // Inject functions
        await page.evaluate(WORKING_TEXT_FIXES);
        await page.evaluate(CHATBOT_FUNCTIONS);
        
        // Reveal content once
        await page.evaluate(() => {
            document.querySelectorAll('.reveal-element').forEach(el => {
                el.classList.add('revealed');
            });
        });
        
        console.log('✅ All functions injected and ready');
        
        // Get page dimensions
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        const maxScroll = pageHeight - 1080;
        
        console.log(`📏 Page height: ${pageHeight}px`);
        console.log(`📏 Scrollable: ${maxScroll}px`);
        
        // Frame generation
        const frames = [];
        let fullPageScreenshot = null;
        
        // Track interaction states
        let chatbotOpened = false;
        let inputFocused = false;
        let textEntered = false;
        let messageSent = false;
        let chatbotMinimized = false;
        
        for (let i = 0; i < totalFrames; i++) {
            const currentTime = i / fps;
            
            // **CHATBOT INTERACTIONS** - Precise timing
            if (currentTime >= 4.4 && !chatbotOpened) {
                await page.evaluate(() => clickChatbotButton());
                await delay(200);
                chatbotOpened = true;
                
                // Apply text fixes AFTER chatbot opens
                await page.evaluate(() => applyTextCutoffFix());
                console.log('🖱️ CLICKED chatbot button at frame', i, `(${currentTime.toFixed(1)}s)`);
            }
            
            if (currentTime >= 6.25 && chatbotOpened && !inputFocused) {
                await page.evaluate(() => focusInputField());
                inputFocused = true;
                console.log('🖱️ FOCUSED input field at frame', i, `(${currentTime.toFixed(1)}s)`);
            }
            
            if (currentTime >= 7 && inputFocused && !textEntered) {
                await page.evaluate(() => typeMessage("I want to buy a house"));
                textEntered = true;
                console.log('⌨️ TYPED message at frame', i, `(${currentTime.toFixed(1)}s)`);
            }
            
            if (currentTime >= 12.5 && textEntered && !messageSent) {
                await page.evaluate(() => clickSendButton());
                messageSent = true;
                console.log('🖱️ CLICKED send button at frame', i, `(${currentTime.toFixed(1)}s)`);
            }
            
            if (currentTime >= 15 && messageSent && !chatbotMinimized) {
                await page.evaluate(() => clickMinimizeButton());
                await delay(300);
                chatbotMinimized = true;
                console.log('🖱️ MINIMIZED chatbot at frame', i, `(${currentTime.toFixed(1)}s)`);
                
                // Take full page screenshot for scrolling
                console.log('📸 Taking full page screenshot for scrolling...');
                
                // Ensure all content is visible
                await page.evaluate(() => {
                    document.querySelectorAll('.reveal-element').forEach(el => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                        el.style.visibility = 'visible';
                    });
                    window.scrollTo(0, 0);
                });
                
                await delay(500);
                fullPageScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
                console.log('📸 Full page screenshot captured');
            }
            
            // **FRAME CAPTURE**
            let frameBuffer;
            
            if (currentTime < 15) {
                // **INTERACTION PHASE**: Viewport screenshots
                frameBuffer = await page.screenshot({ type: 'png' });
            } else {
                // **SCROLLING PHASE**: Crop from full page screenshot
                const scrollProgress = (currentTime - 15) / (25 - 15);
                const scrollY = Math.round(scrollProgress * maxScroll);
                
                frameBuffer = await sharp(fullPageScreenshot)
                    .extract({ left: 0, top: scrollY, width: 1920, height: 1080 })
                    .png()
                    .toBuffer();
            }
            
            // **ADD CURSOR** - Using integer coordinates
            const cursorPos = getCursorPositionForFrame(i, totalFrames, fps);
            const frameWithCursor = await sharp(frameBuffer)
                .composite([{
                    input: cursorBuffer,
                    left: cursorPos.x,  // Already rounded to integer
                    top: cursorPos.y,
                    blend: 'over'
                }])
                .png()
                .toBuffer();
            
            frames.push(frameWithCursor);
            
            // Progress logging
            if ((i + 1) % Math.floor(totalFrames / 4) === 0) {
                const percentage = ((i + 1) / totalFrames * 100).toFixed(1);
                const timeSeconds = ((i + 1) / fps).toFixed(1);
                console.log(`  📸 Frame ${i + 1}/${totalFrames} (${percentage}%) - ${timeSeconds}s`);
            }
        }
        
        console.log('✅ All frames captured!');
        
        // **VIDEO CREATION**
        console.log('🎬 Creating video...');
        const timestamp = Date.now();
        const outputPath = path.join(__dirname, 'videos', `step5_final_clean_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`);
        
        // Ensure directories exist
        const framesDir = path.join(__dirname, 'frames');
        const videosDir = path.join(__dirname, 'videos');
        [framesDir, videosDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Write frames to disk
        for (let i = 0; i < frames.length; i++) {
            const framePath = path.join(framesDir, `frame_${i.toString().padStart(6, '0')}.png`);
            fs.writeFileSync(framePath, frames[i]);
        }
        
        // Create video with FFmpeg
        const ffmpegArgs = [
            '-y',
            '-framerate', fps.toString(),
            '-i', path.join(framesDir, 'frame_%06d.png'),
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            outputPath
        ];
        
        await new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', ffmpegArgs);
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`FFmpeg failed with code ${code}`));
                }
            });
            
            ffmpeg.on('error', reject);
        });
        
        // Clean up frames
        console.log('🧹 Cleaning up frames...');
        for (let i = 0; i < frames.length; i++) {
            const framePath = path.join(framesDir, `frame_${i.toString().padStart(6, '0')}.png`);
            if (fs.existsSync(framePath)) {
                fs.unlinkSync(framePath);
            }
        }
        
        // Get video file size
        const stats = fs.statSync(outputPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ SUCCESS! Video: ${path.basename(outputPath)} (${fileSizeMB} MB)`);
        
        res.json({
            success: true,
            message: 'Step 5 final clean video generated successfully!',
            video: path.basename(outputPath),
            size: `${fileSizeMB} MB`,
            duration: `${duration}s`,
            frames: totalFrames,
            fixes_applied: [
                'Clean process management - no conflicts',
                'Integer coordinates - no Sharp errors',
                'Proven text fixes - 320px input width', 
                'Correct minimize button - (1854, 562)',
                'Proper content loading - all sections visible',
                'Minimal hero stabilization - no glitching'
            ]
        });
        
    } catch (error) {
        console.error('❌ Video generation failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Routes
app.post('/generate-video', generateVideo);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Step 5 Final Clean server is running' });
});

// Start server
const PORT = 3020;
app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║           STEP 5: FINAL CLEAN IMPLEMENTATION      ║');
    console.log(`║              Running on port ${PORT}                   ║`);
    console.log('║                                                    ║');
    console.log('║  🧹 CLEAN: No conflicts, proven fixes only        ║');
    console.log('║  📝 POST /generate-video - Generate video          ║');
    console.log('║  ❤️  GET  /health - Health check                   ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"FINAL CLEAN TEST","niche":"real_estate"}'`);
}); 
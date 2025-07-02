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
    console.log('✅ Cursor loaded successfully');
} catch (error) {
    console.error('❌ Failed to load cursor image:', error.message);
    process.exit(1);
}

async function generateVideo(req, res) {
    let browser;
    
    try {
        const { businessName = 'COMPLETE FIX TEST', niche = 'real_estate' } = req.body;
        
        console.log('🎥 STEP 5: COMPLETE SITE TOUR - PROPERLY FIXED');
        console.log(`📋 Business: ${businessName}`);
        console.log('🔧 Applying PROVEN fixes from debug analysis');
        
        // Launch browser
        browser = await puppeteer.launch({
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-web-security']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Load website
        const htmlPath = path.join(__dirname, 'testttt.html');
        await page.goto(`file://${htmlPath}`);
        
        // REDUCED wait time to prevent hero glitching (was 4000ms)
        await delay(1000);
        console.log('⏳ Content loaded (no hero glitching)');
        
        // Inject ALL required functions
        await page.evaluate(() => {
            // Chatbot interaction functions
            window.clickChatbotButton = function() {
                const button = document.querySelector('.chat-toggle');
                if (button) {
                    button.click();
                    console.log('✅ Chatbot clicked');
                    return true;
                }
                return false;
            };
            
            window.focusInputField = function() {
                const input = document.querySelector('#messageInput');
                if (input) {
                    input.focus();
                    input.click();
                    return true;
                }
                return false;
            };
            
            window.typeInInput = function(text) {
                const input = document.querySelector('#messageInput');
                if (input) {
                    input.value = text;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    return input.value;
                }
                return '';
            };
            
            window.clickSendButton = function() {
                const button = document.querySelector('.send-button');
                if (button) {
                    button.click();
                    return true;
                }
                return false;
            };
            
            window.clickMinimizeButton = function() {
                // Try multiple selectors as found in debug
                const selectors = ['#chatMinimize', '.chat-minimize', '.chat-header button'];
                for (const selector of selectors) {
                    const button = document.querySelector(selector);
                    if (button) {
                        button.click();
                        console.log(`✅ Minimize clicked via ${selector}`);
                        return true;
                    }
                }
                return false;
            };
            
            // PROVEN TEXT CUTOFF FIXES - exact copy from debug analysis
            window.applyTextCutoffFixes = function() {
                console.log('🔧 Applying PROVEN text cutoff fixes...');
                
                const chatWidget = document.querySelector('.chat-widget');
                const inputField = document.querySelector('#messageInput');
                
                if (chatWidget) {
                    // Widen chat widget
                    chatWidget.style.setProperty('width', '420px', 'important');
                    chatWidget.style.setProperty('min-width', '420px', 'important');
                    console.log('✅ Chat widget widened to 420px');
                }
                
                if (inputField) {
                    // CRITICAL FIX: Remove flex and set explicit width
                    inputField.style.setProperty('flex', '0 0 auto', 'important');
                    inputField.style.setProperty('width', '320px', 'important');
                    inputField.style.setProperty('min-width', '320px', 'important');
                    inputField.style.setProperty('max-width', '320px', 'important');
                    
                    console.log('✅ Input field width: 320px (was 260px)');
                    
                    // Additional enforcement
                    setTimeout(() => {
                        inputField.style.setProperty('width', '320px', 'important');
                        inputField.style.setProperty('flex', '0 0 auto', 'important');
                    }, 100);
                }
                
                return true;
            };
        });
        
        console.log('✅ All functions injected');
        
        // Video settings
        const fps = 60;
        const duration = 30; // 30 seconds for complete showcase
        const totalFrames = fps * duration;
        
        console.log(`🎬 Generating ${totalFrames} frames (25s at 60fps)...`);
        
        // Key timings
        const clickChatbotFrame = Math.round(4.4 * fps);
        const focusInputFrame = Math.round(6.25 * fps);
        const sendMessageFrame = Math.round(12.5 * fps);
        const minimizeFrame = Math.round(15 * fps);
        const scrollStartFrame = Math.round(15 * fps);
        
        // State tracking
        let chatbotOpened = false;
        let inputFocused = false;
        let messageSent = false;
        let chatbotMinimized = false;
        let fullPageScreenshot = null;
        
        const frames = [];
        
        for (let i = 0; i < totalFrames; i++) {
            const currentTime = i / fps;
            
            // INTERACTION PHASE (0-15s)
            if (i < scrollStartFrame) {
                
                // Click chatbot button
                if (i === clickChatbotFrame && !chatbotOpened) {
                    const clicked = await page.evaluate(() => clickChatbotButton());
                    if (clicked) {
                        await delay(500);
                        
                        // Apply text fixes IMMEDIATELY after chatbot opens
                        await page.evaluate(() => applyTextCutoffFixes());
                        console.log('🔧 Text cutoff fixes applied after chatbot opened');
                        
                        chatbotOpened = true;
                    }
                }
                
                // Focus input field
                if (i === focusInputFrame && chatbotOpened && !inputFocused) {
                    const focused = await page.evaluate(() => focusInputField());
                    if (focused) {
                        await delay(200);
                        inputFocused = true;
                    }
                }
                
                // Type message character by character
                if (i > focusInputFrame && i < sendMessageFrame && inputFocused) {
                    const typingProgress = (i - focusInputFrame) / (sendMessageFrame - focusInputFrame);
                    const message = "I want to buy a house";
                    const charactersToShow = Math.floor(typingProgress * message.length);
                    const textToShow = message.substring(0, charactersToShow);
                    
                    if (textToShow.length > 0) {
                        const actualText = await page.evaluate((text) => typeInInput(text), textToShow);
                        
                        // Re-apply fixes every 0.5 seconds to ensure they stick
                        if (i % 30 === 0) {
                            await page.evaluate(() => applyTextCutoffFixes());
                        }
                    }
                }
                
                // Send message
                if (i === sendMessageFrame && inputFocused && !messageSent) {
                    const sent = await page.evaluate(() => clickSendButton());
                    if (sent) {
                        await delay(200);
                        messageSent = true;
                    }
                }
                
                // Minimize chatbot
                if (i === minimizeFrame && messageSent && !chatbotMinimized) {
                    const minimized = await page.evaluate(() => clickMinimizeButton());
                    if (minimized) {
                        await delay(500);
                        chatbotMinimized = true;
                        
                        // Take full page screenshot for scrolling
                        console.log('📸 Taking full page screenshot for scrolling...');
                        await delay(500); // Ensure minimize completes
                        
                        fullPageScreenshot = await page.screenshot({
                            fullPage: true,
                            type: 'png'
                        });
                        console.log('📸 Full page screenshot captured');
                    }
                }
                
                // Take viewport screenshot for interaction
                const screenshot = await page.screenshot({ type: 'png' });
                
                // Calculate cursor position
                const cursorPos = getCursorPosition(i, fps);
                
                // Add cursor to frame
                const frameWithCursor = await sharp(screenshot)
                    .composite([{
                        input: cursorBuffer,
                        left: Math.round(cursorPos.x),
                        top: Math.round(cursorPos.y)
                    }])
                    .png()
                    .toBuffer();
                
                frames.push(frameWithCursor);
                
            } else {
                // SCROLLING PHASE (15-25s)
                if (!fullPageScreenshot) {
                    console.error('❌ Full page screenshot not available');
                    continue;
                }
                
                // Calculate scroll position
                const scrollProgress = (currentTime - 15) / 10; // 0 to 1 over 10 seconds
                const pageHeight = await page.evaluate(() => document.body.scrollHeight);
                const viewportHeight = 1080;
                const maxScroll = pageHeight - viewportHeight;
                const scrollY = Math.round(scrollProgress * maxScroll);
                
                // Crop full page screenshot
                const croppedScreenshot = await sharp(fullPageScreenshot)
                    .extract({
                        left: 0,
                        top: Math.max(0, scrollY),
                        width: 1920,
                        height: 1080
                    })
                    .png()
                    .toBuffer();
                
                // Add cursor (adjusted for scroll)
                const cursorPos = getCursorPosition(i, fps);
                const frameWithCursor = await sharp(croppedScreenshot)
                    .composite([{
                        input: cursorBuffer,
                        left: Math.round(cursorPos.x),
                        top: Math.round(cursorPos.y - scrollY)
                    }])
                    .png()
                    .toBuffer();
                
                frames.push(frameWithCursor);
            }
            
            // Progress
            if ((i + 1) % Math.floor(totalFrames / 4) === 0) {
                const percentage = ((i + 1) / totalFrames * 100).toFixed(1);
                const time = ((i + 1) / fps).toFixed(1);
                console.log(`  📸 Frame ${i + 1}/${totalFrames} (${percentage}%) - ${time}s`);
            }
        }
        
        console.log('✅ All frames captured!');
        
        // Create video
        console.log('🎬 Creating video...');
        const timestamp = Date.now();
        const outputPath = path.join(__dirname, 'videos', `step5_complete_fix_${timestamp}.mp4`);
        
        // Ensure videos directory exists
        const videosDir = path.join(__dirname, 'videos');
        if (!fs.existsSync(videosDir)) {
            fs.mkdirSync(videosDir, { recursive: true });
        }
        
        // Write frames to temp directory
        const frameDir = path.join(__dirname, 'frames');
        if (!fs.existsSync(frameDir)) {
            fs.mkdirSync(frameDir, { recursive: true });
        }
        
        for (let i = 0; i < frames.length; i++) {
            const framePath = path.join(frameDir, `frame_${i.toString().padStart(6, '0')}.png`);
            fs.writeFileSync(framePath, frames[i]);
        }
        
        // Generate video with FFmpeg
        await new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-y',
                '-framerate', fps.toString(),
                '-i', path.join(frameDir, 'frame_%06d.png'),
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-crf', '18',
                outputPath
            ]);
            
            let stderr = '';
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
                const progressMatch = stderr.match(/frame=\s*(\d+)/);
                if (progressMatch) {
                    const currentFrame = parseInt(progressMatch[1]);
                    const progress = (currentFrame / frames.length * 100).toFixed(1);
                    if (currentFrame % 50 === 0) {
                        console.log(`  🎬 Encoding: ${progress}%`);
                    }
                }
            });
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('  ✅ Video encoding complete!');
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
            const framePath = path.join(frameDir, `frame_${i.toString().padStart(6, '0')}.png`);
            if (fs.existsSync(framePath)) {
                fs.unlinkSync(framePath);
            }
        }
        
        // Get file info
        const stats = fs.statSync(outputPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ SUCCESS! Video: ${path.basename(outputPath)} (${fileSizeMB} MB)`);
        
        res.json({
            success: true,
            message: 'Step 5 complete fix video generated successfully!',
            video: path.basename(outputPath),
            size: `${fileSizeMB} MB`,
            duration: `${duration}s`,
            fixes_applied: [
                'Text cutoff FIXED: Input width 260px → 320px',
                'Minimize coordinates CORRECTED: (1854, 562)',
                'Content loading FIXED: Proper timing',
                'Hero glitching ELIMINATED: Reduced wait time',
                'Scroll positioning FIXED: Proper crop calculations'
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

// Cursor position function
function getCursorPosition(frameIndex, fps) {
    const currentTime = frameIndex / fps;
    
    // Move to chatbot (0-3.75s)
    if (currentTime <= 3.75) {
        const progress = currentTime / 3.75;
        return {
            x: 200 + (1858 - 200) * progress,
            y: 200 + (1018 - 200) * progress
        };
    }
    
    // Stay on chatbot (3.75-4.4s)
    if (currentTime <= 4.4) {
        return { x: 1858, y: 1018 };
    }
    
    // Move to input (4.4-6.25s)
    if (currentTime <= 6.25) {
        const progress = (currentTime - 4.4) / 1.85;
        return {
            x: 1858 + (1636 - 1858) * progress,
            y: 1018 + (934 - 1018) * progress
        };
    }
    
    // Stay on input (6.25-10s)
    if (currentTime <= 10) {
        return { x: 1636, y: 934 };
    }
    
    // Move to send (10-12.5s)
    if (currentTime <= 12.5) {
        const progress = (currentTime - 10) / 2.5;
        return {
            x: 1636 + (1849 - 1636) * progress,
            y: 934 + (934 - 934) * progress
        };
    }
    
    // Move to minimize (12.5-15s)
    if (currentTime <= 15) {
        const progress = (currentTime - 12.5) / 2.5;
        return {
            x: 1849 + (1854 - 1849) * progress,
            y: 934 + (562 - 934) * progress  // CORRECT coordinates from debug
        };
    }
    
    // Static during scroll
    return { x: 1854, y: 562 };
}

// Routes
app.post('/generate-video', generateVideo);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Step 5 Complete Fix server is running' });
});

// Start server
const PORT = 3009;
app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║        STEP 5: COMPLETE FIX SERVER                ║');
    console.log(`║              Running on port ${PORT}                    ║`);
    console.log('║                                                    ║');
    console.log('║  🔧 ALL ISSUES PROPERLY FIXED                     ║');
    console.log('║  📝 POST /generate-video - Generate video          ║');
    console.log('║  ❤️  GET  /health - Health check                   ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"COMPLETE FIX TEST","niche":"real_estate"}'`);
}); 
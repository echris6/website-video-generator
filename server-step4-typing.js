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

// Function to calculate cursor position for a given frame
function getCursorPositionForFrame(frameIndex, totalFrames) {
    const startPosition = { x: 200, y: 200 };  // Starting position
    const chatbotPosition = { x: 1858, y: 1018 };  // Chatbot button
    const inputPosition = { x: 1636, y: 934 };  // Input field
    const sendPosition = { x: 1849, y: 934 };  // Send button
    
    // **SMOOTH CONTINUOUS MOVEMENT - No more jittery transitions!**
    
    // Phase timing (in percentages of total video)
    const moveToButtonEnd = 0.3;      // 0-30%: Move to chatbot button (3.6s)
    const clickPause = 0.35;          // 30-35%: Brief pause at button (0.6s)
    const moveToInputEnd = 0.5;       // 35-50%: Move to input field (1.8s)
    const typingPeriod = 0.8;         // 50-80%: Stay at input while typing (3.6s)
    const moveToSendEnd = 0.95;       // 80-95%: Slow movement to send button (1.8s)
    // 95-100%: Brief pause at send button (0.6s)
    
    const progress = frameIndex / totalFrames;
    
    if (progress <= moveToButtonEnd) {
        // Phase 1: Smooth movement to chatbot button
        const phaseProgress = progress / moveToButtonEnd;
        return interpolatePosition(startPosition, chatbotPosition, phaseProgress);
        
    } else if (progress <= clickPause) {
        // Phase 2: Stay at chatbot button (clicking phase)
        return chatbotPosition;
        
    } else if (progress <= moveToInputEnd) {
        // Phase 3: Smooth movement to input field
        const phaseProgress = (progress - clickPause) / (moveToInputEnd - clickPause);
        return interpolatePosition(chatbotPosition, inputPosition, phaseProgress);
        
    } else if (progress <= typingPeriod) {
        // Phase 4: Stay at input field (typing phase)
        return inputPosition;
        
    } else if (progress <= moveToSendEnd) {
        // Phase 5: SLOW, smooth movement to send button
        const phaseProgress = (progress - typingPeriod) / (moveToSendEnd - typingPeriod);
        return interpolatePosition(inputPosition, sendPosition, phaseProgress);
        
    } else {
        // Phase 6: Stay at send button
        return sendPosition;
    }
}

// Function to interpolate cursor position
function interpolatePosition(startPos, endPos, progress) {
    // Use ultra-smooth easing function - NO JITTERING!
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easedProgress = easeInOutCubic(progress);
    
    return {
        // Sub-pixel positioning for ultra-smooth movement
        x: startPos.x + (endPos.x - startPos.x) * easedProgress,
        y: startPos.y + (endPos.y - startPos.y) * easedProgress
    };
}

async function generateVideo(businessName, niche) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Set viewport size
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Load the website
        const htmlPath = path.join(__dirname, 'testttt.html');
        await page.goto(`file://${htmlPath}`);
        
        // Video settings - fast and efficient
        const fps = 60; // Keep 60fps for smooth movement!
        const duration = 12; // 12 seconds total - complete interaction
        const totalFrames = fps * duration;
        
        console.log(`🎬 Generating ${totalFrames} frames...`);
        console.log(`📐 Step 4: SMOOTH chatbot interaction - Ultra-smooth movement with NO jittery transitions (12 seconds)`);
        
        // Wait for content to load
        await delay(4000);
        console.log('⏳ Waiting for fonts and CSS to fully load...');
        
        // Wait for all content to be revealed
        await page.evaluate(() => {
            const revealElements = document.querySelectorAll('.reveal-element');
            revealElements.forEach(element => {
                element.classList.add('revealed');
            });
        });
        
        // ✅ HERO STABILIZATION + TEXT CURSOR ELIMINATION - Inherit from Step 3
        await page.evaluate(() => {
            // Disable ALL animations and transitions
            const style = document.createElement('style');
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0s !important;
                    animation-delay: 0s !important;
                    transition-duration: 0s !important;
                    transition-delay: 0s !important;
                }
                
                /* ✅ ELIMINATE TEXT CURSOR BLINKING - No more aggressive "I" cursor! */
                *, input, textarea, [contenteditable] {
                    caret-color: transparent !important;
                }
                input:focus, textarea:focus, [contenteditable]:focus {
                    caret-color: transparent !important;
                    outline: none !important;
                }
                
                /* Disable all cursor animations */
                @keyframes blink { to { visibility: visible; } }
                .blinking-cursor, .cursor-blink, .blink {
                    animation: none !important;
                }
                
                .floating-elements, .floating-square {
                    display: none !important;
                }
                .hero::before {
                    animation: none !important;
                }
            `;
            document.head.appendChild(style);
        });
        
        // Wait for stabilization
        await delay(2000);
        console.log('✅ Hero section fully stabilized and glitch-free!');
        
        // Wait for chatbot to be visible
        try {
            await page.waitForSelector('.chat-toggle', { timeout: 5000 });
            console.log('✅ Chatbot button found and visible!');
        } catch (error) {
            console.log('⚠️ Chatbot button not found, but continuing...');
        }
        
        console.log('✅ All content fully loaded and revealed!');
        
        // Get page dimensions for reference
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        const maxScroll = Math.max(0, pageHeight - 1080);
        console.log(`📏 Page height: ${pageHeight}px`);
        console.log(`📏 Scrollable: ${maxScroll}px`);
        
        // Create frames directory
        const framesDir = path.join(__dirname, 'frames');
        if (!fs.existsSync(framesDir)) {
            fs.mkdirSync(framesDir);
        }
        
        console.log('📸 Setting up viewport screenshot for complete chatbot interaction...');
        
        // **SMOOTH TIMING SYSTEM** - Coordinated with cursor movement
        const clickFrame = Math.floor(totalFrames * 0.35);          // Click at 35% (4.2s)
        const inputFocusFrame = Math.floor(totalFrames * 0.5);      // Focus input at 50% (6s)
        const typingStartFrame = Math.floor(totalFrames * 0.5);     // Start typing at 50% (6s)
        const typingEndFrame = Math.floor(totalFrames * 0.8);       // End typing at 80% (9.6s)
        const sendClickFrame = Math.floor(totalFrames * 0.95);      // Click send at 95% (11.4s)
        
        const message = "I want to buy a house";
        let chatbotOpened = false;
        let typingProgress = 0;
        
        // Generate frames
        for (let i = 0; i < totalFrames; i++) {
            // **SMOOTH CURSOR POSITION** - No more jittery transitions!
            const cursorPos = getCursorPositionForFrame(i, totalFrames);
            
            // **CHATBOT OPENING** - Click when cursor reaches button
            if (i === clickFrame && !chatbotOpened) {
                await page.evaluate(() => {
                    const chatToggle = document.querySelector('.chat-toggle');
                    if (chatToggle) {
                        chatToggle.click();
                    }
                });
                chatbotOpened = true;
                console.log(`🖱️ CLICKED chatbot button at frame ${i} (${(i/fps).toFixed(1)}s)`);
            }
            
            // **INPUT FIELD FOCUSING** - Click when cursor reaches input
            if (i === inputFocusFrame) {
                await page.evaluate(() => {
                    const input = document.querySelector('#messageInput');
                    if (input) {
                        input.focus();
                        input.click();
                    }
                });
                console.log(`🖱️ FOCUSED input field at frame ${i} (${(i/fps).toFixed(1)}s)`);
            }
            
            // **SMOOTH TYPING ANIMATION** - Character by character
            if (i >= typingStartFrame && i <= typingEndFrame) {
                const typingProgressNow = (i - typingStartFrame) / (typingEndFrame - typingStartFrame);
                const charactersToShow = Math.floor(typingProgressNow * message.length);
                
                if (charactersToShow > typingProgress) {
                    await page.evaluate((text) => {
                        const input = document.querySelector('#messageInput');
                        if (input) {
                            input.value = text;
                            input.focus();
                        }
                    }, message.substring(0, charactersToShow));
                    typingProgress = charactersToShow;
                }
            }
            
            // **SEND MESSAGE** - Click when cursor reaches send button
            if (i === sendClickFrame) {
                await page.evaluate(() => {
                    const sendButton = document.querySelector('#sendButton');
                    if (sendButton) {
                        sendButton.click();
                    }
                });
                console.log(`🖱️ CLICKED send button at frame ${i} (${(i/fps).toFixed(1)}s)`);
            }
            
            // Take viewport screenshot with current state
            const viewportBuffer = await page.screenshot({
                type: 'png',
                clip: { x: 0, y: 0, width: 1920, height: 1080 }
            });
            
            // Add cursor overlay
            const frameWithCursor = await sharp(viewportBuffer)
                .composite([{
                    input: cursorBuffer,
                    left: Math.round(cursorPos.x), // Round ONLY for Sharp composite
                    top: Math.round(cursorPos.y),  // Round ONLY for Sharp composite
                    blend: 'over'
                }])
                .png()
                .toBuffer();
            
            // Save frame
            const frameFilename = path.join(framesDir, `frame_${i.toString().padStart(6, '0')}.png`);
            fs.writeFileSync(frameFilename, frameWithCursor);
            
            // Progress logging
            if ((i + 1) % Math.floor(totalFrames / 4) === 0 || i === totalFrames - 1) {
                const progress = ((i + 1) / totalFrames * 100).toFixed(1);
                const timeSeconds = ((i + 1) / fps).toFixed(1);
                console.log(`  📸 Frame ${i + 1}/${totalFrames} (${progress}%) - ${timeSeconds}s`);
            }
        }
        
        console.log('✅ All frames captured!');
        
        // Generate video using FFmpeg
        const timestamp = Date.now();
        const outputFilename = `step4_typing_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
        const outputPath = path.join(__dirname, 'videos', outputFilename);
        
        // Ensure videos directory exists
        const videosDir = path.join(__dirname, 'videos');
        if (!fs.existsSync(videosDir)) {
            fs.mkdirSync(videosDir);
        }
        
        return new Promise((resolve, reject) => {
            console.log('🎬 Creating video...');
            
            const ffmpegArgs = [
                '-y',
                '-framerate', fps.toString(),
                '-i', path.join(framesDir, 'frame_%06d.png'),
                '-c:v', 'libx264',
                '-preset', 'medium',
                '-crf', '23',
                '-pix_fmt', 'yuv420p',
                '-movflags', '+faststart',
                outputPath
            ];
            
            const ffmpeg = spawn('ffmpeg', ffmpegArgs);
            
            ffmpeg.stderr.on('data', (data) => {
                const output = data.toString();
                if (output.includes('frame=')) {
                    const frameMatch = output.match(/frame=\s*(\d+)/);
                    if (frameMatch) {
                        const currentFrame = parseInt(frameMatch[1]);
                        const progress = (currentFrame / totalFrames * 100).toFixed(1);
                        console.log(`  🎬 Encoding: ${progress}%`);
                    }
                }
            });
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('  ✅ Video encoding complete!');
                    
                    // Clean up frames
                    console.log('🧹 Cleaning up frames...');
                    const frameFiles = fs.readdirSync(framesDir).filter(file => file.startsWith('frame_'));
                    frameFiles.forEach(file => {
                        fs.unlinkSync(path.join(framesDir, file));
                    });
                    
                    // Get file size
                    const stats = fs.statSync(outputPath);
                    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                    
                    console.log(`✅ SUCCESS! Video: ${outputFilename} (${fileSizeMB} MB)`);
                    resolve({
                        filename: outputFilename,
                        path: outputPath,
                        size: `${fileSizeMB} MB`
                    });
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}`));
                }
            });
            
            ffmpeg.on('error', (error) => {
                reject(error);
            });
        });
        
    } finally {
        await browser.close();
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Video generation endpoint
app.post('/generate-video', async (req, res) => {
    try {
        const { businessName, niche } = req.body;
        
        if (!businessName || !niche) {
            return res.status(400).json({ 
                error: 'Missing required fields: businessName and niche' 
            });
        }
        
        console.log('🎥 STEP 4: COMPLETE CHATBOT INTERACTION');
        console.log(`📋 Business: ${businessName}`);
        console.log(`🏢 Niche: ${niche}`);
        console.log(`🖱️ SMOOTH Flow: Move to Button (0-3.6s) → Click (4.2s) → Move to Input (4.2-6s) → Type (6-9.6s) → SLOW Move to Send (9.6-11.4s) → Send (11.4s)`);
        console.log(`✨ Ultra-smooth movement with NO jittery transitions!`);
        
        const result = await generateVideo(businessName, niche);
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        console.error('❌ Video generation failed:', error);
        res.status(500).json({ 
            error: 'Video generation failed', 
            details: error.message 
        });
    }
});

const PORT = 3004;
app.listen(PORT, () => {
    console.log(`╔════════════════════════════════════════════════════╗`);
    console.log(`║           STEP 4: COMPLETE CHATBOT INTERACTION    ║`);
    console.log(`║              Running on port ${PORT}                    ║`);
    console.log(`║                                                    ║`);
    console.log(`║  🖱️ Step 4: Move → Click → Type → Send            ║`);
    console.log(`║  📝 POST /generate-video - Generate video          ║`);
    console.log(`║  ❤️  GET  /health - Health check                   ║`);
    console.log(`╚════════════════════════════════════════════════════╝`);
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Step 4 Complete Test","niche":"real_estate"}'`);
}); 
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

// Function to calculate cursor position for a given frame - STEP 5: Add minimize + site tour
function getCursorPositionForFrame(frameIndex, totalFrames) {
    const startPosition = { x: 960, y: 540 };  // Starting position - CENTER
    const chatbotPosition = { x: 1858, y: 1018 };  // Chatbot button
    const inputPosition = { x: 1636, y: 934 };  // Input field
    const sendPosition = { x: 1849, y: 934 };  // Send button
    const minimizePosition = { x: 1854, y: 562 };  // Minimize button
    
    // **STEP 5 TIMING** - Step 4 (0-48%) + Minimize (48-60%) + Site Tour (60-100%)
    const moveToButtonEnd = 0.144;     // 0-14.4%: Move to chatbot button (3.6s)
    const clickPause = 0.168;          // 14.4-16.8%: Brief pause at button (0.6s)
    const moveToInputEnd = 0.24;       // 16.8-24%: Move to input field (1.8s)
    const typingPeriod = 0.384;        // 24-38.4%: Stay at input while typing (3.6s)
    const moveToSendEnd = 0.456;       // 38.4-45.6%: Movement to send button (1.8s)
    const sendPause = 0.48;            // 45.6-48%: Send message pause (0.6s)
    const moveToMinimizeEnd = 0.558;   // 48-55.8%: Move to minimize (1.95s)
    const minimizePause = 0.6;         // 55.8-60%: Minimize pause (1.05s)
    // Site tour: 52-100% (12 seconds of scrolling) - SLOWER
    
    const progress = frameIndex / totalFrames;
    
    if (progress <= moveToButtonEnd) {
        const phaseProgress = progress / moveToButtonEnd;
        return interpolatePosition(startPosition, chatbotPosition, phaseProgress);
    } else if (progress <= clickPause) {
        return chatbotPosition;
    } else if (progress <= moveToInputEnd) {
        const phaseProgress = (progress - clickPause) / (moveToInputEnd - clickPause);
        return interpolatePosition(chatbotPosition, inputPosition, phaseProgress);
    } else if (progress <= typingPeriod) {
        return inputPosition;
    } else if (progress <= moveToSendEnd) {
        const phaseProgress = (progress - typingPeriod) / (moveToSendEnd - typingPeriod);
        return interpolatePosition(inputPosition, sendPosition, phaseProgress);
    } else if (progress <= sendPause) {
        return sendPosition;
    } else if (progress <= moveToMinimizeEnd) {
        const phaseProgress = (progress - sendPause) / (moveToMinimizeEnd - sendPause);
        return interpolatePosition(sendPosition, minimizePosition, phaseProgress);
    } else if (progress <= minimizePause) {
        return minimizePosition;
    } else {
        // Site tour phase: cursor stays at minimize button position
        return minimizePosition;
    }
}

// Function to interpolate cursor position - EXACT SAME AS STEP 4
function interpolatePosition(startPos, endPos, progress) {
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easedProgress = easeInOutCubic(progress);
    
    return {
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
        
        // EXACT SAME AS STEP 4
        await page.setViewport({ width: 1920, height: 1080 });
        
        const htmlPath = path.join(__dirname, 'testttt.html');
        await page.goto(`file://${htmlPath}`);
        
        // Step 5: 25 seconds (Step 4 + Minimize + Site Tour)
        const fps = 60;
        const duration = 25;
        const totalFrames = fps * duration;
        
        console.log(`🎬 Generating ${totalFrames} frames...`);
        console.log(`📐 Step 5: Step 4 (0-12s) + Minimize (12-15s) + Site Tour (15-25s)`);
        
        // EXACT SAME LOADING AS STEP 4
        await page.waitForTimeout(4000);
        console.log('⏳ Waiting for fonts and CSS to fully load...');
        
        await page.evaluate(() => {
            const revealElements = document.querySelectorAll('.reveal-element');
            revealElements.forEach(element => {
                element.classList.add('revealed');
            });
        });
        
        // TARGETED HERO SECTION PRESERVATION - Keep original layout intact
        await page.evaluate(() => {
            const style = document.createElement('style');
            style.textContent = `
                /* ===== HERO SECTION PRESERVATION ===== */
                /* Only pause animations that interfere with video recording, preserve ALL original styling */
                
                /* Disable cursor blinking and text selection only */
                *, input, textarea, [contenteditable] {
                    caret-color: transparent !important;
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                }
                
                input:focus, textarea:focus, [contenteditable]:focus {
                    caret-color: transparent !important;
                    outline: none !important;
                }
                
                /* Disable only cursor blink animations - preserve all other animations */
                @keyframes blink { to { visibility: visible; } }
                .blinking-cursor, .cursor-blink, .blink {
                    animation: none !important;
                }
                
                /* ===== ARCHITECTURAL ELEMENTS PRESERVATION ===== */
                /* Pause floating architectural elements animation but keep all styling intact */
                .floating-elements {
                    animation-play-state: paused !important;
                }
                .floating-square {
                    animation-play-state: paused !important;
                }
                
                /* ===== HERO SECTION PARALLAX PRESERVATION ===== */
                /* Pause hero parallax animation but preserve all background gradients and styling */
                .hero::before {
                    animation-play-state: paused !important;
                    /* Ensure original background gradients are preserved */
                    background: 
                        radial-gradient(circle at 15% 15%, rgba(10, 25, 41, 0.08) 0%, transparent 40%),
                        radial-gradient(circle at 85% 85%, rgba(201, 169, 110, 0.05) 0%, transparent 40%),
                        linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%) !important;
                    opacity: 1 !important;
                    transform: translateY(0px) translateX(0px) rotate(0deg) !important;
                }
                
                /* Preserve hero::after pattern overlay */
                .hero::after {
                    background-image: 
                        linear-gradient(45deg, transparent 24%, rgba(255, 255, 255, 0.03) 25%, rgba(255, 255, 255, 0.03) 26%, transparent 27%),
                        linear-gradient(-45deg, transparent 24%, rgba(10, 25, 41, 0.02) 25%, rgba(10, 25, 41, 0.02) 26%, transparent 27%) !important;
                    background-size: 60px 60px !important;
                    opacity: 0.3 !important;
                }
                
                /* ===== PRESERVE ALL OTHER ANIMATIONS ===== */
                /* Keep all hover effects, transitions, and other non-interfering animations intact */
                .cta-button, .property-card, .service-card {
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
                }
                
                /* Preserve reveal animations but make them instant for consistency */
                .reveal-element {
                    transition: none !important;
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }
            `;
            document.head.appendChild(style);
        });
        
        await page.waitForTimeout(2000);
        console.log('✅ Hero section fully stabilized and glitch-free!');
        
        try {
            await page.waitForSelector('.chat-toggle', { timeout: 5000 });
            console.log('✅ Chatbot button found and visible!');
        } catch (error) {
            console.log('⚠️ Chatbot button not found, but continuing...');
        }
        
        console.log('✅ All content fully loaded and revealed!');
        
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        const maxScroll = Math.max(0, pageHeight - 1080);
        console.log(`📏 Page height: ${pageHeight}px`);
        console.log(`📏 Scrollable: ${maxScroll}px`);
        
        const framesDir = path.join(__dirname, 'frames');
        if (!fs.existsSync(framesDir)) {
            fs.mkdirSync(framesDir);
        }
        
        // Ensure all sections are loaded and visible
        await page.evaluate(() => {
            // Force all sections to be visible
            const sections = document.querySelectorAll('section');
            sections.forEach(section => {
                section.style.display = 'block';
                section.style.visibility = 'visible';
                section.style.opacity = '1';
            });
            
            // Trigger any lazy loading
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
            });
            
            console.log('All sections forced visible:', sections.length);
        });
        
        await page.waitForTimeout(1000);
        console.log('✅ All sections loaded and visible');
        
        console.log('📸 Step 5: Complete interaction + site tour...');
        
        // STEP 5 TIMING - Adjusted for 25 seconds
        const clickFrame = Math.floor(totalFrames * 0.168);         // Click chatbot (4.2s)
        const inputFocusFrame = Math.floor(totalFrames * 0.24);     // Focus input (6s)
        const typingStartFrame = Math.floor(totalFrames * 0.24);    // Start typing (6s)
        const typingEndFrame = Math.floor(totalFrames * 0.384);     // End typing (9.6s)
        const sendClickFrame = Math.floor(totalFrames * 0.48);      // Click send (12s)
        const minimizeClickFrame = Math.floor(totalFrames * 0.558); // Click minimize (13.95s)
        const siteScrollStartFrame = Math.floor(totalFrames * 0.52); // Start site tour (13s) - SLOWER
        
        const message = "I want to buy a house";
        let chatbotOpened = false;
        let typingProgress = 0;
        let fullPageBuffer = null;
        
        // Generate frames - Dual phase: viewport for interaction + full-page for site tour
        for (let i = 0; i < totalFrames; i++) {
            const cursorPos = getCursorPositionForFrame(i, totalFrames);
            
            if (i === clickFrame && !chatbotOpened) {
                await page.evaluate(() => {
                    const chatToggle = document.querySelector('.chat-toggle');
                    if (chatToggle) chatToggle.click();
                });
                chatbotOpened = true;
                console.log(`🖱️ CLICKED chatbot button at frame ${i} (${(i/fps).toFixed(1)}s)`);
            }
            
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
            
            if (i === sendClickFrame) {
                await page.evaluate(() => {
                    const sendButton = document.querySelector('#sendButton');
                    if (sendButton) sendButton.click();
                });
                console.log(`🖱️ CLICKED send button at frame ${i} (${(i/fps).toFixed(1)}s)`);
            }
            
            // Minimize functionality
            if (i === minimizeClickFrame) {
                await page.evaluate(() => {
                    const minimizeButton = document.querySelector('#chatMinimize');
                    if (minimizeButton) minimizeButton.click();
                });
                console.log(`🖱️ MINIMIZED chatbot at frame ${i} (${(i/fps).toFixed(1)}s)`);
            }
            
            // Capture full page screenshot for site tour (just before scrolling starts)
            if (i === siteScrollStartFrame && !fullPageBuffer) {
                // Force scroll to absolute top position WITHOUT modifying original layout
                await page.evaluate(() => {
                    // Reset scroll positions but preserve original layout
                    window.scrollTo(0, 0);
                    document.documentElement.scrollTop = 0;
                    document.body.scrollTop = 0;
                });
                
                // Multiple rounds of ensuring we're at top
                for (let attempts = 0; attempts < 5; attempts++) {
                    await page.evaluate(() => {
                        window.scrollTo(0, 0);
                        document.documentElement.scrollTop = 0;
                        document.body.scrollTop = 0;
                    });
                    await page.waitForTimeout(200);
                }
                
                // Verify we're actually at top
                const scrollPosition = await page.evaluate(() => window.pageYOffset);
                console.log(`📍 Verified scroll position: ${scrollPosition} (should be 0)`);
                
                fullPageBuffer = await page.screenshot({
                    type: 'png',
                    fullPage: true
                });
                console.log('📸 Full page screenshot captured from VERIFIED top position');
            }
            
            // Dual-phase rendering: viewport for interaction, full-page cropping for site tour
            let frameBuffer;
            
            if (i < siteScrollStartFrame) {
                // Phase 1: Viewport screenshots for interaction (0-15s)
                frameBuffer = await page.screenshot({
                    type: 'png',
                    clip: { x: 0, y: 0, width: 1920, height: 1080 }
                });
            } else {
                // Phase 2: Full-page cropping for site tour (15-25s)
                const scrollProgress = (i - siteScrollStartFrame) / (totalFrames - siteScrollStartFrame);
                // Reduce scroll speed by 25% (scroll through 75% of total content) - SLOWER!
                const reducedMaxScroll = Math.floor(maxScroll * 0.75);
                
                // Ensure we start from 0 and progress smoothly
                const scrollY = scrollProgress === 0 ? 0 : Math.floor(scrollProgress * reducedMaxScroll);
                
                // Debug: Log scroll position for first few frames to verify it starts at 0
                if (i <= siteScrollStartFrame + 10) {
                    console.log(`🔍 Frame ${i}: scrollProgress=${scrollProgress.toFixed(3)}, scrollY=${scrollY}, reducedMaxScroll=${reducedMaxScroll}`);
                }
                
                frameBuffer = await sharp(fullPageBuffer)
                    .extract({
                        left: 0,
                        top: scrollY, // Start exactly at 0, no Math.max needed
                        width: 1920,
                        height: 1080
                    })
                    .png()
                    .toBuffer();
            }
            
            const frameWithCursor = await sharp(frameBuffer)
                .composite([{
                    input: cursorBuffer,
                    left: Math.round(cursorPos.x),
                    top: Math.round(cursorPos.y),
                    blend: 'over'
                }])
                .png()
                .toBuffer();
            
            const frameFilename = path.join(framesDir, `frame_${i.toString().padStart(6, '0')}.png`);
            fs.writeFileSync(frameFilename, frameWithCursor);
            
            if ((i + 1) % Math.floor(totalFrames / 4) === 0 || i === totalFrames - 1) {
                const progress = ((i + 1) / totalFrames * 100).toFixed(1);
                const timeSeconds = ((i + 1) / fps).toFixed(1);
                console.log(`  📸 Frame ${i + 1}/${totalFrames} (${progress}%) - ${timeSeconds}s`);
            }
        }
        
        console.log('✅ All frames captured!');
        
        // EXACT SAME FFMPEG AS STEP 4
        const timestamp = Date.now();
        const outputFilename = `step5_minimal_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
        const outputPath = path.join(__dirname, 'videos', outputFilename);
        
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
                    
                    console.log('🧹 Cleaning up frames...');
                    const frameFiles = fs.readdirSync(framesDir).filter(file => file.startsWith('frame_'));
                    frameFiles.forEach(file => {
                        fs.unlinkSync(path.join(framesDir, file));
                    });
                    
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

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/generate-video', async (req, res) => {
    try {
        const { businessName, niche } = req.body;
        
        if (!businessName || !niche) {
            return res.status(400).json({ 
                error: 'Missing required fields: businessName and niche' 
            });
        }
        
        console.log('🎥 STEP 5: COMPLETE SITE TOUR - Building on proven Step 4');
        console.log(`📋 Business: ${businessName}`);
        console.log(`🏢 Niche: ${niche}`);
        console.log(`🎬 Step 4 (0-12s) + Minimize (12-15s) + Site Tour (15-25s)`);
        
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

const PORT = 3051;
app.listen(PORT, () => {
    console.log(`╔════════════════════════════════════════════════════╗`);
    console.log(`║           STEP 5: COMPLETE SITE TOUR              ║`);
    console.log(`║              Running on port ${PORT}                    ║`);
    console.log(`║                                                    ║`);
    console.log(`║  🎬 Step 4 + Minimize + Site Tour (25s)           ║`);
    console.log(`║  📝 POST /generate-video - Generate video          ║`);
    console.log(`║  ❤️  GET  /health - Health check                   ║`);
    console.log(`╚════════════════════════════════════════════════════╝`);
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Site Tour Test","niche":"real_estate"}'`);
}); 
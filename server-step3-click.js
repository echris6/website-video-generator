#!/usr/bin/env node

// DISABLED: This server conflicts with server-hvac-step5.js and causes multiple videos
// Use server-hvac-step5.js instead for HVAC video generation
console.log('⚠️  server-step3-click.js is DISABLED to prevent multiple video generation');
console.log('🔧 Use server-hvac-step5.js on port 3025 instead');
process.exit(0);

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
    const startPosition = { x: 200, y: 200 };  // Same as Step 1 & 2
    const endPosition = { x: 1858, y: 1018 };  // Chatbot button position
    
    // ULTRA FAST MOVEMENT - Complete movement in first 40% of video!
    const movementFrames = Math.floor(totalFrames * 0.4); // 40% for movement (2.4s)
    
    if (frameIndex < movementFrames) {
        // Ultra fast smooth movement with better easing
        const moveProgress = frameIndex / movementFrames;
        return interpolatePosition(startPosition, endPosition, moveProgress);
    } else {
        // Static at chatbot button
        return endPosition;
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
        
        // Video settings - inherit Step 2's ultra-fast timing
        const fps = 60; // Keep 60fps for buttery smooth movement!
        const duration = 8; // 8 seconds total - movement + click + widget opens
        const totalFrames = fps * duration;
        
        console.log(`🎬 Generating ${totalFrames} frames...`);
        console.log(`📐 Step 3: ULTRA FAST cursor movement + clicking (8 seconds total)`);
        
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
        
        // ✅ HERO STABILIZATION - Fix glitching animations
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
        
        console.log('📸 Setting up viewport screenshot for hero section with chatbot...');
        
        // Calculate click timing
        const movementFrames = Math.floor(totalFrames * 0.4); // 40% for movement (3.2s)
        const clickFrame = movementFrames + Math.floor(totalFrames * 0.1); // Click 0.8s after movement ends
        
        // Generate frames
        for (let i = 0; i < totalFrames; i++) {
            // Get cursor position for this frame
            const cursorPos = getCursorPositionForFrame(i, totalFrames);
            
            // Check if we should click (and if widget should be open)
            const shouldShowWidget = i >= clickFrame;
            
            // If it's time to click, open the widget
            if (i === clickFrame) {
                await page.evaluate(() => {
                    // Find and click the chatbot button
                    const chatToggle = document.querySelector('.chat-toggle');
                    if (chatToggle) {
                        chatToggle.click();
                    }
                });
                console.log(`🖱️ CLICKED chatbot button at frame ${i} (${(i/fps).toFixed(1)}s)`);
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
        const outputFilename = `step3_click_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
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
        
        console.log('🎥 STEP 3: CURSOR MOVEMENT + CLICKING');
        console.log(`📋 Business: ${businessName}`);
        console.log(`🏢 Niche: ${niche}`);
        console.log(`🖱️ Cursor: ULTRA FAST movement (2.4s) → CLICK (3.2s) → Widget Opens → Static (8s total)`);
        
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

const PORT = 3003;
app.listen(PORT, () => {
    console.log(`╔════════════════════════════════════════════════════╗`);
    console.log(`║           STEP 3: CURSOR MOVEMENT + CLICKING      ║`);
    console.log(`║              Running on port ${PORT}                    ║`);
    console.log(`║                                                    ║`);
    console.log(`║  🖱️ Step 3: Move → Click → Widget Opens           ║`);
    console.log(`║  📝 POST /generate-video - Generate video          ║`);
    console.log(`║  ❤️  GET  /health - Health check                   ║`);
    console.log(`╚════════════════════════════════════════════════════╝`);
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Step 3 Click Test","niche":"real_estate"}'`);
}); 
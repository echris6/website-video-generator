const express = require('express');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Universal delay function compatible with all Puppeteer versions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const PORT = 3002;

app.use(express.json({ limit: '50mb' }));
app.use(express.static('videos'));

// Load cursor image
let cursorBuffer;
try {
    cursorBuffer = fs.readFileSync(path.join(__dirname, 'cursor.png'));
    console.log('✅ Cursor loaded:', path.join(__dirname, 'cursor.png'));
} catch (error) {
    console.error('❌ Could not load cursor.png:', error.message);
    process.exit(1);
}

// Load the testttt.html file for our website template
const websiteTemplate = fs.readFileSync(path.join(__dirname, 'testttt.html'), 'utf8');

console.log(`
╔════════════════════════════════════════════════════╗
║           STEP 2: CURSOR MOVEMENT                 ║
║              Running on port ${PORT}                    ║
║                                                    ║
║  🖱️ Step 2: Cursor moves to chatbot button        ║
║  📝 POST /generate-video - Generate video          ║
║  ❤️  GET  /health - Health check                   ║
╚════════════════════════════════════════════════════╝
`);

// Function to interpolate cursor position
function interpolatePosition(startPos, endPos, progress) {
    // Use ultra-smooth easing function - NO JITTERING!
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easedProgress = easeInOutCubic(progress);
    
    return {
        // REMOVED Math.round() to prevent jittering - allow sub-pixel positioning
        x: startPos.x + (endPos.x - startPos.x) * easedProgress,
        y: startPos.y + (endPos.y - startPos.y) * easedProgress
    };
}

// Function to calculate cursor position for a given frame
function getCursorPositionForFrame(frameIndex, totalFrames) {
    const startPosition = { x: 200, y: 200 };  // Same as Step 1
    const endPosition = { x: 1858, y: 1018 };  // Chatbot button position
    
    // ULTRA FAST MOVEMENT - Complete movement in first 40% of video!
    const movementFrames = Math.floor(totalFrames * 0.4); // 40% for movement (was 60%)
    const endStaticFrames = totalFrames - movementFrames; // 60% static at end
    
    if (frameIndex < movementFrames) {
        // Ultra fast smooth movement with better easing
        const moveProgress = frameIndex / movementFrames;
        return interpolatePosition(startPosition, endPosition, moveProgress);
    } else {
        // Static at chatbot button
        return endPosition;
    }
}

async function generateVideo(businessName, niche) {
    console.log(`🎥 STEP 2: CURSOR MOVEMENT`);
    console.log(`📋 Business: ${businessName}`);
    console.log(`🏢 Niche: ${niche}`);
    console.log(`🖱️ Cursor: ULTRA FAST movement (200,200) → chatbot in 2.4s → static (6s total) - 60fps!`);

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        console.log('🚀 Launching browser...');
        
        // Create website content
        const websiteContent = websiteTemplate
            .replace(/{{businessName}}/g, businessName)
            .replace(/{{heroTitle}}/g, 'Luxury Real Estate Excellence')
            .replace(/{{primaryColor}}/g, '#0a1929')
            .replace(/{{secondaryColor}}/g, '#c8a882')
            .replace(/{{backgroundColor}}/g, '#fdfdfd')
            .replace(/{{textColor}}/g, '#0a1929')
            .replace(/{{accentColor}}/g, '#d4af37');

        await page.setContent(websiteContent);
        console.log('📄 Loading website content...');
        
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
                
                /* Hide floating elements that cause glitches */
                .floating-elements,
                .floating-square {
                    display: none !important;
                }
                
                /* Disable parallax animations */
                .hero::before,
                .hero::after {
                    animation: none !important;
                    transform: none !important;
                }
                
                /* Force stable states */
                .reveal-element {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }
            `;
            document.head.appendChild(style);
            
            console.log('🎯 Hero section stabilized - animations disabled');
        });
        
        // Extra wait for stabilization
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
        
        // Get page dimensions
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        const viewportHeight = 1080;
        const maxScroll = Math.max(0, pageHeight - viewportHeight);
        
        console.log(`📏 Page height: ${pageHeight}px`);
        console.log(`📏 Scrollable: ${maxScroll}px`);
        
        // Video settings
        const fps = 60; // Keep 60fps for buttery smooth movement!
        const duration = 6; // Reduced from 10 to 6 seconds - FASTER!
        const totalFrames = fps * duration;
        
        console.log(`🎬 Generating ${totalFrames} frames...`);
        console.log(`📐 Step 2: Static hero section + ULTRA FAST cursor movement (60fps, 6-second duration)`);
        
        // For Step 2, we only show the hero section (viewport) - NO scrolling!
        // This ensures the fixed position chatbot button is visible
        console.log('📸 Setting up viewport screenshot for hero section with chatbot...');
        
        // Create frames directory
        const framesDir = path.join(__dirname, 'frames');
        if (!fs.existsSync(framesDir)) {
            fs.mkdirSync(framesDir);
        }
        
        // Generate frames - each frame is just the current viewport (hero + chatbot)
        for (let i = 0; i < totalFrames; i++) {
            // Get cursor position for this frame  
            const cursorPos = getCursorPositionForFrame(i, totalFrames);
            
            // Take viewport screenshot (hero section with fixed chatbot visible)
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
            const framePath = path.join(framesDir, `frame_${i.toString().padStart(6, '0')}.png`);
            fs.writeFileSync(framePath, frameWithCursor);
            
            // Progress indicator
            if ((i + 1) % 150 === 0 || i === totalFrames - 1) {
                const percent = ((i + 1) / totalFrames * 100).toFixed(1);
                const seconds = ((i + 1) / fps).toFixed(1);
                console.log(`  📸 Frame ${i + 1}/${totalFrames} (${percent}%) - ${seconds}s`);
            }
        }
        
        console.log('✅ All frames captured!');
        
        // Create video with ffmpeg
        const timestamp = Date.now();
        const videoFilename = `step2_movement_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
        const videoPath = path.join(__dirname, 'videos', videoFilename);
        
        console.log('🎬 Creating video...');
        
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(path.join(framesDir, 'frame_%06d.png'))
                .inputFPS(fps)
                .outputOptions([
                    '-c:v libx264',
                    '-preset medium',
                    '-crf 28',
                    '-pix_fmt yuv420p',
                    '-movflags +faststart'
                ])
                .output(videoPath)
                .on('progress', (progress) => {
                    if (progress.percent) {
                        console.log(`  🎬 Encoding: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', () => {
                    console.log('  ✅ Video encoding complete!');
                    resolve();
                })
                .on('error', reject)
                .run();
        });
        
        // Clean up frames
        console.log('🧹 Cleaning up frames...');
        fs.readdirSync(framesDir).forEach(file => {
            if (file.startsWith('frame_')) {
                fs.unlinkSync(path.join(framesDir, file));
            }
        });
        
        // Get video file size
        const stats = fs.statSync(videoPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ SUCCESS! Video: ${videoFilename} (${fileSizeInMB} MB)`);
        
        return {
            filename: videoFilename,
            path: videoPath,
            size: `${fileSizeInMB} MB`
        };
        
    } finally {
        await browser.close();
    }
}

// Routes
app.post('/generate-video', async (req, res) => {
    try {
        const { businessName, niche } = req.body;
        
        if (!businessName || !niche) {
            return res.status(400).json({ 
                error: 'Missing required fields: businessName and niche' 
            });
        }
        
        const result = await generateVideo(businessName, niche);
        res.json({ success: true, ...result });
        
    } catch (error) {
        console.error('❌ Video generation failed:', error);
        res.status(500).json({ 
            error: 'Video generation failed', 
            details: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', step: '2 - Cursor Movement' });
});

app.listen(PORT, () => {
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Step 2 Movement Test","niche":"real_estate"}'`);
}); 
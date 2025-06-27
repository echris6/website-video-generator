const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

const app = express();
const PORT = 3002; // Different port to avoid conflicts

app.use(express.json());

// Ensure directories exist
async function ensureDirectories() {
    const dirs = ['videos', 'frames'];
    for (const dir of dirs) {
        if (!existsSync(dir)) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
}

// Simple cursor injection
async function injectSimpleCursor(page) {
    await page.evaluate(() => {
        // Add cursor styles
        const style = document.createElement('style');
        style.textContent = `
            .simple-cursor {
                position: fixed;
                width: 16px;
                height: 16px;
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid white;
                border-radius: 50%;
                pointer-events: none;
                z-index: 99999;
                transform: translate(-50%, -50%);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;
                display: none;
            }
            .simple-cursor.visible {
                display: block;
            }
            .simple-cursor.clicking {
                transform: translate(-50%, -50%) scale(1.3);
                background: rgba(255, 0, 0, 0.8);
            }
        `;
        document.head.appendChild(style);

        // Create cursor element
        const cursor = document.createElement('div');
        cursor.className = 'simple-cursor';
        cursor.id = 'simple-cursor';
        document.body.appendChild(cursor);

        // Simple cursor functions
        window.showCursor = (x, y) => {
            const cursor = document.getElementById('simple-cursor');
            if (cursor) {
                cursor.style.left = x + 'px';
                cursor.style.top = y + 'px';
                cursor.classList.add('visible');
            }
        };

        window.hideCursor = () => {
            const cursor = document.getElementById('simple-cursor');
            if (cursor) {
                cursor.classList.remove('visible');
            }
        };

        window.clickAnimation = () => {
            const cursor = document.getElementById('simple-cursor');
            if (cursor) {
                cursor.classList.add('clicking');
                setTimeout(() => {
                    cursor.classList.remove('clicking');
                }, 200);
            }
        };

        window.clickChatButton = () => {
            const chatToggle = document.getElementById('chatToggle');
            if (chatToggle) {
                chatToggle.click();
                return true;
            }
            return false;
        };
    });
}

// Main video generation endpoint
app.post('/generate-video', async (req, res) => {
    let browser;
    let frameDir;
    
    try {
        await ensureDirectories();
        
        const { businessName = 'Test Website', niche = 'real_estate' } = req.body;
        console.log(`\n🎥 FINAL VIDEO GENERATION - Screenshot Cropping + Simple Cursor`);
        console.log(`📋 Business: ${businessName}`);
        console.log(`🏢 Niche: ${niche}`);
        
        // Create unique frame directory
        const timestamp = Date.now();
        const filename = `final_${niche}_${timestamp}.mp4`;
        frameDir = path.join(__dirname, 'frames', `final_${timestamp}`);
        await fs.mkdir(frameDir, { recursive: true });
        
        // Launch browser
        console.log('\n🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Load HTML content
        console.log('📄 Loading website content...');
        const htmlContent = await fs.readFile('testttt.html', 'utf8');
        await page.setContent(htmlContent);
        await page.waitForTimeout(3000);
        
        // Inject simple cursor
        console.log('🖱️ Injecting cursor functionality...');
        await injectSimpleCursor(page);
        
        // Get page dimensions
        const dimensions = await page.evaluate(() => ({
            scrollHeight: document.body.scrollHeight,
            clientHeight: window.innerHeight
        }));
        
        const scrollableHeight = Math.max(0, dimensions.scrollHeight - dimensions.clientHeight);
        console.log(`📏 Page height: ${dimensions.scrollHeight}px`);
        console.log(`📏 Scrollable: ${scrollableHeight}px`);
        
        // Generate 30-second video (1800 frames at 60fps)
        // Phase 1: Initial view (0-3s) = frames 0-179
        // Phase 2: Cursor interaction (3-8s) = frames 180-479  
        // Phase 3: Scrolling (8-30s) = frames 480-1799
        
        const totalFrames = 1800;
        const phase1End = 180;    // 3 seconds
        const phase2End = 480;    // 8 seconds  
        const scrollFrames = totalFrames - phase2End; // 22 seconds of scrolling
        const scrollPerFrame = scrollableHeight / scrollFrames;
        
        console.log(`\n🎬 Generating ${totalFrames} frames...`);
        console.log(`📋 Phase 1: Initial view (0-3s) = frames 0-${phase1End-1}`);
        console.log(`📋 Phase 2: Cursor demo (3-8s) = frames ${phase1End}-${phase2End-1}`);
        console.log(`📋 Phase 3: Screenshot cropping (8-30s) = frames ${phase2End}-${totalFrames-1}`);
        console.log(`📐 Crop offset per frame: ${scrollPerFrame.toFixed(2)}px`);
        
        // Generate all frames
        for (let frame = 0; frame < totalFrames; frame++) {
            if (frame < phase1End) {
                // Phase 1: Initial page view - just stay at top
                // No cursor, just the page
                await page.evaluate(() => window.hideCursor());
                
            } else if (frame < phase2End) {
                // Phase 2: Cursor interaction
                const cursorFrame = frame - phase1End;
                const totalCursorFrames = phase2End - phase1End;
                
                if (cursorFrame === 0) {
                    // Show cursor at starting position
                    await page.evaluate(() => window.showCursor(100, 200));
                } else if (cursorFrame < 60) {
                    // Move cursor towards chat button (60 frames = 1 second)
                    const progress = cursorFrame / 60;
                    const startX = 100, startY = 200;
                    const endX = 1870, endY = 950; // Chat button position
                    const currentX = startX + (endX - startX) * progress;
                    const currentY = startY + (endY - startY) * progress;
                    await page.evaluate((x, y) => window.showCursor(x, y), currentX, currentY);
                } else if (cursorFrame === 60) {
                    // Click the chat button
                    await page.evaluate((x, y) => {
                        window.showCursor(x, y);
                        window.clickAnimation();
                        window.clickChatButton();
                    }, 1870, 950);
                } else if (cursorFrame < 120) {
                    // Keep cursor visible near chat button for 1 second
                    await page.evaluate((x, y) => window.showCursor(x, y), 1870, 950);
                } else {
                    // Fade out cursor
                    await page.evaluate(() => window.hideCursor());
                }
                
            } else {
                // Phase 3: Screenshot cropping method - hide cursor
                await page.evaluate(() => window.hideCursor());
            }
            
            // Take screenshot or crop from full page screenshot
            const frameNumber = String(frame + 1).padStart(6, '0');
            
            if (frame < phase2End) {
                // Phase 1 & 2: Regular screenshots
                await page.screenshot({
                    path: path.join(frameDir, `frame_${frameNumber}.png`),
                    clip: { x: 0, y: 0, width: 1920, height: 1080 }
                });
            } else {
                // Phase 3: Use the proven screenshot cropping method
                if (frame === phase2End) {
                    // Take full page screenshot once at start of phase 3
                    console.log('📸 Taking full page screenshot for cropping approach...');
                    global.fullPageScreenshot = await page.screenshot({
                        fullPage: true,
                        type: 'png'
                    });
                    console.log('✅ Full page screenshot captured');
                }
                
                // Crop from the full page screenshot
                const scrollFrame = frame - phase2End;
                const cropY = Math.min(Math.round(scrollFrame * scrollPerFrame), scrollableHeight);
                
                await sharp(global.fullPageScreenshot)
                    .extract({ 
                        left: 0, 
                        top: cropY, 
                        width: 1920, 
                        height: 1080 
                    })
                    .png()
                    .toFile(path.join(frameDir, `frame_${frameNumber}.png`));
            }
            
            // Progress logging
            if ((frame + 1) % 300 === 0) {
                const progress = ((frame + 1) / totalFrames * 100).toFixed(1);
                const seconds = ((frame + 1) / 60).toFixed(1);
                let phase = '';
                if (frame < phase1End) phase = 'Initial View';
                else if (frame < phase2End) phase = 'Cursor Demo';
                else phase = 'Screenshot Cropping';
                console.log(`  📸 Frame ${frame + 1}/${totalFrames} (${progress}%) - ${seconds}s - ${phase}`);
            }
        }
        
        console.log('\n✅ All frames captured!');
        
        // Create video
        const videoPath = path.join(__dirname, 'videos', filename);
        console.log('\n🎬 Creating video...');
        await createVideo(frameDir, videoPath);
        
        // Clean up
        await fs.rm(frameDir, { recursive: true });
        console.log('🧹 Cleaned up frames');
        
        // Get file size
        const stats = await fs.stat(videoPath);
        const fileSize = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`\n✅ SUCCESS! Video: ${filename} (${fileSize} MB)`);
        
        res.json({
            success: true,
            video_url: `/videos/${filename}`,
            file_name: filename,
            file_size_mb: fileSize,
            duration: '30 seconds',
            frames: totalFrames,
            phases: {
                initial_view: '0-3s',
                cursor_demo: '3-8s', 
                screenshot_cropping: '8-30s'
            }
        });
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        
        // Clean up on error
        if (frameDir && existsSync(frameDir)) {
            await fs.rm(frameDir, { recursive: true }).catch(() => {});
        }
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Create video using FFmpeg
function createVideo(frameDir, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(path.join(frameDir, 'frame_%06d.png'))
            .inputFPS(60)
            .videoCodec('libx264')
            .outputOptions([
                '-crf 18',
                '-preset fast',
                '-pix_fmt yuv420p'
            ])
            .fps(60)
            .output(outputPath)
            .on('progress', (progress) => {
                if (progress.percent) {
                    process.stdout.write(`\r  🎬 Encoding: ${progress.percent.toFixed(1)}%`);
                }
            })
            .on('end', () => {
                console.log('\n  ✅ Video encoding complete!');
                resolve();
            })
            .on('error', (err) => {
                console.log('\n  ❌ Video encoding failed:', err.message);
                reject(err);
            })
            .run();
    });
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Final Video Generator Ready' });
});

// Serve videos
app.use('/videos', express.static('videos'));

// Start server
app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║          FINAL VIDEO GENERATOR                    ║');
    console.log(`║          Running on port ${PORT}                    ║`);
    console.log('║                                                    ║');
    console.log('║  🎯 Combines screenshot cropping + simple cursor   ║');
    console.log('║  📝 POST /generate-video - Generate video          ║');
    console.log('║  ❤️  GET  /health - Health check                   ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
}); 
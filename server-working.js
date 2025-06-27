const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = 3001; // Different port to avoid conflicts

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

// Main video generation endpoint
app.post('/generate-video', async (req, res) => {
    let browser;
    let frameDir;
    
    try {
        await ensureDirectories();
        
        const { businessName = 'Test Website', niche = 'real_estate' } = req.body;
        console.log(`\n🎥 SIMPLE RELIABLE VIDEO GENERATION`);
        console.log(`📋 Business: ${businessName}`);
        console.log(`🏢 Niche: ${niche}`);
        
        // Create unique frame directory
        const timestamp = Date.now();
        const filename = `working_${niche}_${timestamp}.mp4`;
        frameDir = path.join(__dirname, 'frames', `working_${timestamp}`);
        await fs.mkdir(frameDir, { recursive: true });
        
        // Launch browser with better settings
        console.log('\n🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Load HTML content
        console.log('📄 Loading website content...');
        const htmlContent = await fs.readFile('testttt.html', 'utf8');
        await page.setContent(htmlContent);
        await page.waitForTimeout(3000); // Let page fully load
        
        // Get page dimensions
        const dimensions = await page.evaluate(() => ({
            scrollHeight: document.body.scrollHeight,
            clientHeight: window.innerHeight
        }));
        
        const scrollableHeight = Math.max(0, dimensions.scrollHeight - dimensions.clientHeight);
        console.log(`📏 Page height: ${dimensions.scrollHeight}px`);
        console.log(`📏 Scrollable: ${scrollableHeight}px`);
        
        // Generate 30-second video (1800 frames at 60fps)
        const totalFrames = 1800;
        const scrollPerFrame = scrollableHeight / totalFrames;
        
        console.log(`\n🎬 Generating ${totalFrames} frames...`);
        console.log(`📐 Scroll per frame: ${scrollPerFrame.toFixed(2)}px`);
        
        // Generate all frames with smooth scrolling
        for (let frame = 0; frame < totalFrames; frame++) {
            const scrollPosition = Math.round(frame * scrollPerFrame);
            
            // Scroll to position
            await page.evaluate(scrollY => {
                window.scrollTo(0, scrollY);
            }, scrollPosition);
            
            // Take screenshot
            const frameNumber = String(frame + 1).padStart(6, '0');
            await page.screenshot({
                path: path.join(frameDir, `frame_${frameNumber}.png`),
                clip: { x: 0, y: 0, width: 1920, height: 1080 }
            });
            
            // Progress logging
            if ((frame + 1) % 300 === 0) { // Every 5 seconds
                const progress = ((frame + 1) / totalFrames * 100).toFixed(1);
                const seconds = ((frame + 1) / 60).toFixed(1);
                console.log(`  📸 Frame ${frame + 1}/${totalFrames} (${progress}%) - ${seconds}s`);
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
            frames: totalFrames
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
    res.json({ status: 'OK', message: 'Simple Video Generator Ready' });
});

// Serve videos
app.use('/videos', express.static('videos'));

// Start server
app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║              SIMPLE VIDEO GENERATOR               ║');
    console.log(`║              Running on port ${PORT}                ║`);
    console.log('║                                                    ║');
    console.log('║  📝 POST /generate-video - Generate smooth video   ║');
    console.log('║  ❤️  GET  /health - Health check                   ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
}); 
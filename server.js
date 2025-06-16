const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

const app = express();
const PORT = 3000;

// Create videos and frames directories
const VIDEOS_DIR = path.join(__dirname, 'videos');
const FRAMES_DIR = path.join(__dirname, 'frames');

async function ensureDirectories() {
    try {
        if (!existsSync(VIDEOS_DIR)) {
            await fs.mkdir(VIDEOS_DIR, { recursive: true });
            console.log('Created videos directory');
        }
        if (!existsSync(FRAMES_DIR)) {
            await fs.mkdir(FRAMES_DIR, { recursive: true });
            console.log('Created frames directory');
        }
    } catch (error) {
        console.error('Error creating directories:', error);
    }
}

ensureDirectories();

// Middleware
app.use(express.json({ limit: '10mb' }));
const upload = multer();

// Serve static video files
app.use('/videos', express.static(VIDEOS_DIR));

// Default video settings optimized for SCREENSHOT-BASED 60fps
const DEFAULT_VIDEO_SETTINGS = {
    width: 1920,
    height: 1080,
    fps: 60,                // True 60fps with screenshots
    videoCRF: 18,           
    videoCodec: 'libx264',  
    videoPreset: 'fast',    
    videoBitrate: 3000,     
    duration: 20            // 20 seconds as requested
};

// Scrolling configuration
const SCROLL_CONFIG = {
    pageLoadWait: 5000,     // 5 seconds wait after page load
    recordingDuration: 20,  // 20 seconds recording time
    fps: 60                 // 60 frames per second
};

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Website Scrolling Video Generator API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * List all generated videos
 */
app.get('/videos-list', async (req, res) => {
    try {
        const files = await fs.readdir(VIDEOS_DIR);
        const videos = [];

        for (const file of files) {
            if (file.endsWith('.mp4') || file.endsWith('.webm')) {
                const filePath = path.join(VIDEOS_DIR, file);
                const stats = await fs.stat(filePath);
                videos.push({
                    name: file,
                    url: `/videos/${file}`,
                    size: stats.size,
                    sizeReadable: formatFileSize(stats.size),
                    created: stats.birthtime
                });
            }
        }

        res.json({
            success: true,
            count: videos.length,
            videos: videos.sort((a, b) => b.created - a.created)
        });
    } catch (error) {
        console.error('Error listing videos:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list videos',
            message: error.message
        });
    }
});

/**
 * SCREENSHOT-BASED video generation endpoint
 */
app.post('/generate-video', upload.none(), async (req, res) => {
    let browser = null;
    let page = null;
    let frameDir = null;

    try {
        // Validate required fields
        const { html_content, business_name, settings = {} } = req.body;
        
        if (!html_content) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: html_content'
            });
        }

        if (!business_name) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: business_name'
            });
        }

        console.log(`🎥 PURE SCREENSHOT METHOD - Starting video generation for: ${business_name}`);

        // Generate filename and frame directory
        const timestamp = Date.now();
        const safeBusinessName = business_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeBusinessName}_${timestamp}.mp4`;
        const filePath = path.join(VIDEOS_DIR, filename);
        frameDir = path.join(FRAMES_DIR, `${safeBusinessName}_${timestamp}`);
        
        // Create frame directory
        await fs.mkdir(frameDir, { recursive: true });

        // Merge video settings with defaults
        const videoSettings = { ...DEFAULT_VIDEO_SETTINGS, ...settings };

        // Launch Puppeteer with enhanced settings
        console.log('Launching Puppeteer...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-gpu',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ]
        });

        page = await browser.newPage();
        
        // Set larger viewport to ensure proper rendering
        await page.setViewport({
            width: videoSettings.width,
            height: videoSettings.height,
            deviceScaleFactor: 1
        });

        // Set enhanced user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Set HTML content with extended waiting
        console.log('Setting HTML content...');
        await page.setContent(html_content, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 45000
        });

        // Wait exactly 5 seconds after page load before recording
        console.log('⏳ Waiting 5 seconds for page to fully load...');
        await page.waitForTimeout(SCROLL_CONFIG.pageLoadWait);

        // Ensure page is scrolled to top
        await page.evaluate(() => {
            window.scrollTo(0, 0);
        });

        console.log('✅ Page loaded, starting video generation in 3... 2... 1...');

        // Get comprehensive page dimensions
        const pageInfo = await page.evaluate(() => {
            const body = document.body;
            const html = document.documentElement;
            
            return {
                scrollHeight: Math.max(body.scrollHeight, html.scrollHeight),
                clientHeight: Math.max(body.clientHeight, html.clientHeight),
                offsetHeight: Math.max(body.offsetHeight, html.offsetHeight),
                viewportHeight: window.innerHeight,
                bodyScrollHeight: body.scrollHeight,
                documentScrollHeight: document.documentElement.scrollHeight
            };
        });

        console.log('Page dimensions:', pageInfo);
        
        const totalHeight = Math.max(pageInfo.scrollHeight, pageInfo.bodyScrollHeight, pageInfo.documentScrollHeight);
        const viewportHeight = videoSettings.height;
        const scrollableHeight = Math.max(0, totalHeight - viewportHeight);

        console.log(`Total height: ${totalHeight}px, Viewport: ${viewportHeight}px, Scrollable height: ${scrollableHeight}px`);

        // Capture screenshots for smooth scrolling
        await captureScrollingScreenshots(page, scrollableHeight, frameDir, videoSettings);

        // Create video from screenshots using FFmpeg
        console.log('Creating video from screenshots...');
        await createVideoFromScreenshots(frameDir, filePath, videoSettings);

        // Clean up frame directory
        await fs.rmdir(frameDir, { recursive: true });
        console.log('Cleaned up frame directory');

        // Get file stats
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;

        console.log(`Video generated successfully: ${filename} (${formatFileSize(fileSize)})`);

        // Send response
        res.json({
            success: true,
            video_url: `/videos/${filename}`,
            file_name: filename,
            file_size: fileSize,
            file_size_readable: formatFileSize(fileSize),
            duration_estimate: `${videoSettings.duration} seconds`,
            settings_used: videoSettings
        });

    } catch (error) {
        console.error('Error generating video:', error);
        
        // Clean up frame directory on error
        if (frameDir && existsSync(frameDir)) {
            try {
                await fs.rmdir(frameDir, { recursive: true });
            } catch (cleanupError) {
                console.error('Error cleaning up frame directory:', cleanupError);
            }
        }

        res.status(500).json({
            success: false,
            error: 'Failed to generate video',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

/**
 * Capture screenshots for exactly 20 seconds of smooth scrolling
 */
async function captureScrollingScreenshots(page, scrollableHeight, frameDir, videoSettings) {
    console.log('🎬 Starting 20-second video generation...');
    
    const totalFrames = SCROLL_CONFIG.fps * SCROLL_CONFIG.recordingDuration; // 60 * 20 = 1200 frames
    const viewportHeight = videoSettings.height; // 1080px
    
    console.log(`📊 Video specs:`);
    console.log(`  - Total frames: ${totalFrames}`);
    console.log(`  - Duration: ${SCROLL_CONFIG.recordingDuration} seconds`);
    console.log(`  - FPS: ${SCROLL_CONFIG.fps}`);
    console.log(`  - Viewport: ${videoSettings.width}x${viewportHeight}`);
    console.log(`  - Scrollable height: ${scrollableHeight}px`);
    
    if (scrollableHeight <= 0) {
        console.log('⚠️ Page fits in viewport - creating static video');
        for (let i = 0; i < totalFrames; i++) {
            const frameNumber = String(i + 1).padStart(6, '0');
            await page.screenshot({
                path: path.join(frameDir, `frame_${frameNumber}.png`),
                fullPage: false,
                clip: { x: 0, y: 0, width: videoSettings.width, height: viewportHeight }
            });
            
            if (i % 120 === 0) { // Log every 2 seconds
                console.log(`📸 Generated static frame ${i + 1}/${totalFrames} (${((i + 1) / totalFrames * 100).toFixed(1)}%)`);
            }
        }
        return;
    }

    // Calculate scroll increment per frame for smooth scrolling
    const scrollPerFrame = scrollableHeight / totalFrames;
    
    console.log(`🎯 Scroll settings:`);
    console.log(`  - Scroll per frame: ${scrollPerFrame.toFixed(4)}px`);
    console.log(`  - Total scroll distance: ${scrollableHeight}px`);
    console.log(`  - Will scroll from top (0px) to bottom (${scrollableHeight}px)`);
    console.log('');
    console.log('🚀 Starting smooth scroll capture...');

    console.log('📸 Taking full page screenshot for cropping approach...');
    
    // Take one full page screenshot
    const fullPageScreenshot = await page.screenshot({
        fullPage: true,
        type: 'png'
    });
    
    // Get the full page dimensions to calculate crop positions
    const fullPageHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`📐 Full page height: ${fullPageHeight}px`);
    

    
    // Capture all frames by cropping from the full page screenshot
    for (let frame = 0; frame < totalFrames; frame++) {
        const currentScrollPosition = Math.round(frame * scrollPerFrame);
        const secondsElapsed = frame / SCROLL_CONFIG.fps;
        
        // Calculate crop position (ensure we don't go beyond the page)
        const cropY = Math.min(currentScrollPosition, fullPageHeight - viewportHeight);
        
        // Crop the frame from the full page screenshot
        const frameNumber = String(frame + 1).padStart(6, '0');
        const framePath = path.join(frameDir, `frame_${frameNumber}.png`);
        
        await sharp(fullPageScreenshot)
            .extract({ 
                left: 0, 
                top: cropY, 
                width: videoSettings.width, 
                height: viewportHeight 
            })
            .png()
            .toFile(framePath);

        // Enhanced debugging every 60 frames (every second)
        if (frame % 60 === 0) {
            const currentSection = getSectionName(currentScrollPosition, scrollableHeight);
            console.log(`🎬 Frame ${frame + 1}/${totalFrames} | ${secondsElapsed.toFixed(1)}s | Crop Y: ${cropY}px | Section: ${currentSection} | Progress: ${((frame + 1) / totalFrames * 100).toFixed(1)}%`);
        }
    }
    
    console.log('✅ Screenshot capture completed!');
    console.log(`📊 Final stats:`);
    console.log(`  - Generated ${totalFrames} frames`);
    console.log(`  - Duration: ${SCROLL_CONFIG.recordingDuration} seconds`);
    console.log(`  - Scrolled from 0px to ${(totalFrames * scrollPerFrame).toFixed(0)}px`);
}

/**
 * Determine which section of the page we're currently viewing
 */
function getSectionName(scrollPosition, totalScrollHeight) {
    const progress = scrollPosition / totalScrollHeight;
    
    if (progress < 0.2) return 'Hero/Top';
    if (progress < 0.4) return 'Services';
    if (progress < 0.6) return 'About';
    if (progress < 0.8) return 'Contact';
    return 'Footer/Bottom';
}

/**
 * Create video from screenshots using FFmpeg
 */
function createVideoFromScreenshots(frameDir, outputPath, videoSettings) {
    return new Promise((resolve, reject) => {
        const { fps, videoCRF, videoCodec, videoPreset, videoBitrate } = videoSettings;
        
        ffmpeg()
            .input(path.join(frameDir, 'frame_%06d.png'))
            .inputFPS(fps)
            .videoCodec(videoCodec)
            .outputOptions([
                `-crf ${videoCRF}`,
                `-preset ${videoPreset}`,
                `-b:v ${videoBitrate}k`,
                '-pix_fmt yuv420p'
            ])
            .fps(fps)
            .output(outputPath)
            .on('start', (commandLine) => {
                console.log('FFmpeg started with command:', commandLine);
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                    console.log(`FFmpeg progress: ${progress.percent.toFixed(1)}%`);
                }
            })
            .on('end', () => {
                console.log('FFmpeg processing finished successfully');
                resolve();
            })
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                reject(err);
            })
            .run();
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Start server
app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   Website Scrolling Video Generator API            ║');
    console.log(`║   Server running on port ${PORT}                      ║`);
    console.log(`║   http://localhost:${PORT}                           ║`);
    console.log('╠════════════════════════════════════════════════════╣');
    console.log('║   Endpoints:                                       ║');
    console.log('║   POST /generate-video - Generate scrolling video  ║');
    console.log('║   GET  /health - Health check                      ║');
    console.log('║   GET  /videos-list - List all videos              ║');
    console.log('║   GET  /videos/:filename - Download video          ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('    ');
}); 
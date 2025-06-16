const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');

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
    duration: 25            // 25 seconds for thorough scrolling
};

// Scrolling configuration
const SCROLL_CONFIG = {
    totalDuration: 25,      // Extended duration for complete page viewing
    initialDelay: 2000,     // Longer initial delay for page loading
    endDelay: 1000,         // End delay to show final content
    loadWaitTime: 3000      // Additional time for page content to load
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

        console.log(`Starting SCREENSHOT-BASED video generation for: ${business_name}`);

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

        // Wait for page to fully render and load all content
        console.log('Waiting for page to fully load...');
        await page.waitForTimeout(SCROLL_CONFIG.loadWaitTime);

        // Wait for any images to load
        try {
            await page.waitForFunction(() => {
                const images = document.querySelectorAll('img');
                return Array.from(images).every(img => img.complete || img.naturalHeight > 0);
            }, { timeout: 5000 });
        } catch (e) {
            console.log('Some images may still be loading, continuing...');
        }

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
 * Capture screenshots at precise intervals for smooth scrolling
 */
async function captureScrollingScreenshots(page, scrollableHeight, frameDir, videoSettings) {
    const { fps, duration } = videoSettings;
    
    if (scrollableHeight <= 0) {
        console.log('Page content fits in viewport, creating static video');
        // Create multiple frames for minimum duration
        const minFrames = Math.max(fps * 3, 180); // Minimum 3 seconds
        
        for (let i = 0; i < minFrames; i++) {
            const frameNumber = String(i + 1).padStart(6, '0');
            await page.screenshot({
                path: path.join(frameDir, `frame_${frameNumber}.png`),
                fullPage: false,
                clip: { x: 0, y: 0, width: videoSettings.width, height: videoSettings.height }
            });
        }
        console.log(`Created ${minFrames} static frames for short content`);
        return;
    }

    console.log('Starting SCREENSHOT-BASED smooth scrolling...');
    
    // Calculate frames and scrolling
    const totalFrames = fps * duration; // e.g., 60 * 25 = 1500 frames
    const effectiveScrollTime = duration - 5; // Reserve 5 seconds for viewing (2s start + 3s end)
    const scrollFrames = fps * effectiveScrollTime;
    const scrollPerFrame = scrollableHeight / scrollFrames;
    
    console.log(`Capturing ${totalFrames} frames (${scrollFrames} scrolling frames) at ${scrollPerFrame.toFixed(4)}px per frame`);

    // Initial viewing period (2 seconds at top)
    const initialFrames = fps * 2;
    console.log('Capturing initial static frames (showing top of page)...');
    
    for (let frame = 0; frame < initialFrames; frame++) {
        await page.evaluate(() => window.scrollTo(0, 0));
        
        const frameNumber = String(frame + 1).padStart(6, '0');
        await page.screenshot({
            path: path.join(frameDir, `frame_${frameNumber}.png`),
            fullPage: false,
            clip: { x: 0, y: 0, width: videoSettings.width, height: videoSettings.height }
        });
    }

    // Scrolling phase
    console.log('Starting smooth scrolling phase...');
    for (let scrollFrame = 0; scrollFrame < scrollFrames; scrollFrame++) {
        const currentScroll = scrollFrame * scrollPerFrame;
        const frameNumber = initialFrames + scrollFrame + 1;
        
        // Smooth scroll to position
        await page.evaluate((scrollY) => {
            window.scrollTo({
                top: scrollY,
                behavior: 'instant'
            });
        }, currentScroll);

        // Ensure scroll is applied
        await page.waitForTimeout(8);

        // Capture screenshot
        const frameNumberStr = String(frameNumber).padStart(6, '0');
        await page.screenshot({
            path: path.join(frameDir, `frame_${frameNumberStr}.png`),
            fullPage: false,
            clip: { x: 0, y: 0, width: videoSettings.width, height: videoSettings.height }
        });

        // Progress logging
        if (scrollFrame % 60 === 0) {
            console.log(`Captured scrolling frame ${scrollFrame + 1}/${scrollFrames} (${((scrollFrame + 1) / scrollFrames * 100).toFixed(1)}%)`);
        }
    }

    // Final viewing period (3 seconds at bottom)
    const finalFrames = fps * 3;
    console.log('Capturing final static frames (showing bottom of page)...');
    
    // Ensure we're at the bottom
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });

    for (let frame = 0; frame < finalFrames; frame++) {
        const frameNumber = initialFrames + scrollFrames + frame + 1;
        const frameNumberStr = String(frameNumber).padStart(6, '0');
        
        await page.screenshot({
            path: path.join(frameDir, `frame_${frameNumberStr}.png`),
            fullPage: false,
            clip: { x: 0, y: 0, width: videoSettings.width, height: videoSettings.height }
        });
    }
    
    console.log(`Screenshot capture completed! Generated ${totalFrames} frames total`);
    console.log(`  - ${initialFrames} initial frames (top view)`);
    console.log(`  - ${scrollFrames} scrolling frames`);
    console.log(`  - ${finalFrames} final frames (bottom view)`);
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
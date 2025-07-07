#!/usr/bin/env node
// DISABLED: This script conflicts with the HVAC workflow and causes multiple videos to be generated
// Use server-hvac-step5.js instead for HVAC video generation

process.exit(0); // Exit early to prevent execution

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

const RESULTS_FILE = path.join('.github', 'scripts', 'processing-results.json');
const VIDEOS_DIR = 'videos';
const FRAMES_DIR = 'frames';

// EXACT SAME SETTINGS AS WORKING server.js
const DEFAULT_VIDEO_SETTINGS = {
    width: 1920,
    height: 1080,
    fps: 60,                // True 60fps with screenshots
    videoCRF: 18,           
    videoCodec: 'libx264',  
    videoPreset: 'fast',    
    videoBitrate: 3000,     
    autopad: { color: 'white' },
    aspectRatio: '16:9'
};

// EXACT SAME SCROLL CONFIG AS WORKING server.js
const SCROLL_CONFIG = {
    pageLoadWait: 5000,     // 5 seconds wait after page load
    recordingDuration: 18,  // 18 seconds recording time (10% faster)
    fps: 60,                // 60 frames per second
    scrollIncrementMs: 16.67 // 60fps timing
};

function createSafeFilename(name) {
    const timestamp = Date.now();
    const safeName = name.replace(/[^a-z0-9\s-]/gi, '_').toLowerCase().replace(/\s+/g, '_');
    return `${safeName}_${timestamp}`;
}

function getDynamicSection(scrollY, scrollableHeight) {
    const progress = scrollY / scrollableHeight;
    
    if (progress < 0.2) return "Hero/Top";
    if (progress < 0.4) return "Services";
    if (progress < 0.6) return "About";
    if (progress < 0.8) return "Contact";
    return "Footer/Bottom";
}

// Ensure directories exist
async function ensureDirectories() {
    try {
        if (!fs.existsSync(VIDEOS_DIR)) {
            await fs.promises.mkdir(VIDEOS_DIR, { recursive: true });
            console.log('Created videos directory');
        }
        if (!fs.existsSync(FRAMES_DIR)) {
            await fs.promises.mkdir(FRAMES_DIR, { recursive: true });
            console.log('Created frames directory');
        }
    } catch (error) {
        console.error('Error creating directories:', error);
    }
}

/**
 * EXACT SAME captureScrollingScreenshots function as working server.js
 */
async function captureScrollingScreenshots(page, videoFilename, totalFrames, scrollableHeight) {
    const framesDir = path.join(FRAMES_DIR, videoFilename);
    
    if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
    }
    
    console.log('📸 Taking full page screenshot for cropping approach...');
    
    // Take one full page screenshot (EXACT SAME as server.js)
    const fullPageScreenshot = await page.screenshot({
        fullPage: true,
        type: 'png'
    });
    
    // Get the full page dimensions to calculate crop positions (EXACT SAME as server.js)
    const fullPageHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`📐 Full page height: ${fullPageHeight}px`);
    
    // Calculate scroll increment per frame for smooth scrolling (EXACT SAME as server.js)
    const scrollPerFrame = scrollableHeight / totalFrames;
    
    // Capture all frames by cropping from the full page screenshot (EXACT SAME as server.js)
    for (let frame = 0; frame < totalFrames; frame++) {
        const currentScrollPosition = Math.round(frame * scrollPerFrame);
        const secondsElapsed = frame / SCROLL_CONFIG.fps;
        
        // Calculate crop position (ensure we don't go beyond the page) - EXACT SAME as server.js
        const cropY = Math.min(currentScrollPosition, fullPageHeight - DEFAULT_VIDEO_SETTINGS.height);
        
        // Enhanced debugging every 60 frames (every second) - EXACT SAME as server.js
        if (frame % 60 === 0) {
            const currentSection = getDynamicSection(currentScrollPosition, scrollableHeight);
            console.log(`🎬 Frame ${frame + 1}/${totalFrames} | ${secondsElapsed.toFixed(1)}s | Crop Y: ${cropY}px | Section: ${currentSection} | Progress: ${((frame + 1) / totalFrames * 100).toFixed(1)}%`);
        }
        
        // Crop the frame from the full page screenshot - EXACT SAME as server.js
        const frameNumber = String(frame + 1).padStart(6, '0');
        const framePath = path.join(framesDir, `frame_${frameNumber}.png`);
        
        await sharp(fullPageScreenshot)
            .extract({ 
                left: 0, 
                top: cropY, 
                width: DEFAULT_VIDEO_SETTINGS.width, 
                height: DEFAULT_VIDEO_SETTINGS.height 
            })
            .png()
            .toFile(framePath);
    }
    
    console.log('✅ Screenshot capture completed!');
    console.log(`📊 Final stats:`);
    console.log(`  - Generated ${totalFrames} frames`);
    console.log(`  - Duration: ${SCROLL_CONFIG.recordingDuration} seconds`);
    console.log(`  - Scrolled from 0px to ${(totalFrames * scrollPerFrame).toFixed(0)}px`);
    
    return framesDir;
}

/**
 * EXACT SAME createVideoFromScreenshots function as working server.js
 */
async function createVideoFromScreenshots(framesDir, outputPath) {
    return new Promise((resolve, reject) => {
        console.log('Creating video from screenshots...');
        
        const command = ffmpeg()
            .input(path.join(framesDir, 'frame_%06d.png'))
            .inputFPS(SCROLL_CONFIG.fps)
            .outputOptions([
                '-y',
                `-vcodec ${DEFAULT_VIDEO_SETTINGS.videoCodec}`,
                `-r ${SCROLL_CONFIG.fps}`,
                `-crf ${DEFAULT_VIDEO_SETTINGS.videoCRF}`,
                `-preset ${DEFAULT_VIDEO_SETTINGS.videoPreset}`,
                `-b:v ${DEFAULT_VIDEO_SETTINGS.videoBitrate}k`,
                '-pix_fmt yuv420p'
            ])
            .output(outputPath);
        
        console.log(`FFmpeg started with command: ${command._getArguments().join(' ')}`);
        
        command
            .on('progress', (progress) => {
                if (progress.percent) {
                    console.log(`FFmpeg progress: ${progress.percent.toFixed(1)}%`);
                }
            })
            .on('end', () => {
                console.log('FFmpeg processing finished successfully');
                
                // Clean up frames directory
                try {
                    fs.rmSync(framesDir, { recursive: true, force: true });
                    console.log('Cleaned up frame directory');
                } catch (cleanupError) {
                    console.warn('Warning: Could not clean up frames directory:', cleanupError.message);
                }
                
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

/**
 * Generate video using EXACT SAME method as working server.js
 */
async function generateVideo(website) {
    console.log(`🎥 PURE SCREENSHOT METHOD - Starting video generation for: ${website.name}`);
    
    const browser = await puppeteer.launch({
        headless: 'new',
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
        await page.setViewport({
            width: DEFAULT_VIDEO_SETTINGS.width,
            height: DEFAULT_VIDEO_SETTINGS.height
        });
        
        console.log('Launching Puppeteer...');
        console.log('Setting HTML content...');
        
        // Use HTML content directly (EXACT SAME as server.js)
        await page.setContent(website.htmlContent, { 
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 45000 
        });
        
        // EXACT SAME WAIT AS server.js
        console.log('⏳ Waiting 5 seconds for page to fully load...');
        await page.waitForTimeout(SCROLL_CONFIG.pageLoadWait);
        console.log('✅ Page loaded, starting video generation in 3... 2... 1...');
        
        // Get page dimensions - EXACT SAME AS server.js
        const dimensions = await page.evaluate(() => {
            return {
                scrollHeight: Math.max(
                    document.body.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.clientHeight,
                    document.documentElement.scrollHeight,
                    document.documentElement.offsetHeight
                ),
                clientHeight: document.documentElement.clientHeight,
                offsetHeight: document.documentElement.offsetHeight,
                viewportHeight: window.innerHeight,
                bodyScrollHeight: document.body.scrollHeight,
                documentScrollHeight: document.documentElement.scrollHeight
            };
        });
        
        console.log('Page dimensions:', dimensions);
        
        const totalHeight = dimensions.scrollHeight;
        const viewportHeight = DEFAULT_VIDEO_SETTINGS.height;
        const scrollableHeight = Math.max(0, totalHeight - viewportHeight);
        
        console.log(`Total height: ${totalHeight}px, Viewport: ${viewportHeight}px, Scrollable height: ${scrollableHeight}px`);
        
        // Generate video filename
        const videoFilename = createSafeFilename(website.name);
        const outputPath = path.join(VIDEOS_DIR, `${videoFilename}.mp4`);
        
        // Ensure videos directory exists
        if (!fs.existsSync(VIDEOS_DIR)) {
            fs.mkdirSync(VIDEOS_DIR, { recursive: true });
        }
        
        // EXACT SAME SETTINGS AS server.js
        const totalFrames = SCROLL_CONFIG.recordingDuration * SCROLL_CONFIG.fps; // 1080 frames (18s × 60fps)
        
        console.log('🎬 Starting 18-second video generation...');
        console.log('📊 Video specs:');
        console.log(`  - Total frames: ${totalFrames}`);
        console.log(`  - Duration: ${SCROLL_CONFIG.recordingDuration} seconds`);
        console.log(`  - FPS: ${SCROLL_CONFIG.fps}`);
        console.log(`  - Viewport: ${DEFAULT_VIDEO_SETTINGS.width}x${DEFAULT_VIDEO_SETTINGS.height}`);
        console.log(`  - Scrollable height: ${scrollableHeight}px`);
        
        const scrollPerFrame = scrollableHeight / totalFrames;
        console.log('🎯 Scroll settings:');
        console.log(`  - Scroll per frame: ${scrollPerFrame.toFixed(4)}px`);
        console.log(`  - Total scroll distance: ${scrollableHeight}px`);
        console.log(`  - Will scroll from top (0px) to bottom (${scrollableHeight}px)`);
        
        console.log('🚀 Starting smooth scroll capture...');
        
        // Capture screenshots using EXACT SAME method as server.js
        const framesDir = await captureScrollingScreenshots(page, videoFilename, totalFrames, scrollableHeight);
        
        // Create video from screenshots using EXACT SAME method as server.js
        await createVideoFromScreenshots(framesDir, outputPath);
        
        // Check if video was created successfully
        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            const fileSizeKB = (stats.size / 1024).toFixed(2);
            console.log(`Video generated successfully: ${path.basename(outputPath)} (${fileSizeKB} KB)`);
            return { success: true, filename: path.basename(outputPath), size: fileSizeKB };
        } else {
            throw new Error('Video file was not created');
        }
        
    } catch (error) {
        console.error('Error generating video:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

async function main() {
    try {
        console.log('🚀 Starting GitHub Actions video generation...');
        
        // Check if results file exists
        if (!fs.existsSync(RESULTS_FILE)) {
            console.error('❌ No processing results file found');
            process.exit(1);
        }
        
        // Read website data
        const websites = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
        
        if (!websites || websites.length === 0) {
            console.error('❌ No website data found');
            process.exit(1);
        }
        
        if (websites.length > 1) {
            console.log(`📋 Found ${websites.length} websites, processing the first one only`);
        }
        
        // Process only the first website (like the local server)
        const website = websites[0];
        console.log(`🎯 Processing website: ${website.name}`);
        
        // Validate HTML content is available (like server.js)
        if (!website.htmlContent) {
            console.error('❌ No HTML content found in website data');
            console.error('Expected htmlContent field to be present');
            process.exit(1);
        }
        
        console.log(`📄 HTML content size: ${website.htmlContent.length} characters`);
        
        // Generate the video
        const result = await generateVideo(website);
        
        if (result.success) {
            console.log('✅ Video generation completed successfully!');
            console.log(`📹 Generated: ${result.filename} (${result.size} KB)`);
        } else {
            console.error('❌ Video generation failed');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the main function
if (require.main === module) {
    main();
} 
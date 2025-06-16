#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

const RESULTS_FILE = path.join('.github', 'scripts', 'processing-results.json');
const VIDEOS_DIR = path.join(__dirname, '..', '..', 'videos');
const FRAMES_DIR = path.join(__dirname, '..', '..', 'frames');

// EXACT SAME SETTINGS AS WORKING server.js
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

// EXACT SAME SCROLL CONFIG AS WORKING server.js
const SCROLL_CONFIG = {
    pageLoadWait: 5000,     // 5 seconds wait after page load
    recordingDuration: 20,  // 20 seconds recording time
    fps: 60                 // 60 frames per second
};

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
 * EXACT SAME getSectionName function as working server.js
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
 * EXACT SAME createVideoFromScreenshots function as working server.js
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

/**
 * Generate video using EXACT SAME method as working server.js
 */
async function generateVideo(website) {
    const { name, htmlFilePath } = website;
    let browser = null;
    let page = null;
    let frameDir = null;

    try {
        console.log(`🎥 PURE SCREENSHOT METHOD - Starting video generation for: ${name}`);

        // Read HTML content
        const html_content = fs.readFileSync(htmlFilePath, 'utf8');

        // Generate filename and frame directory - SAME AS server.js
        const timestamp = Date.now();
        const safeBusinessName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeBusinessName}_${timestamp}.mp4`;
        const filePath = path.join(VIDEOS_DIR, filename);
        frameDir = path.join(FRAMES_DIR, `${safeBusinessName}_${timestamp}`);
        
        // Create frame directory
        await fs.promises.mkdir(frameDir, { recursive: true });

        // EXACT SAME video settings as server.js
        const videoSettings = { ...DEFAULT_VIDEO_SETTINGS };

        // Launch Puppeteer with EXACT SAME settings as server.js
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
        
        // EXACT SAME viewport settings as server.js
        await page.setViewport({
            width: videoSettings.width,
            height: videoSettings.height,
            deviceScaleFactor: 1
        });

        // EXACT SAME user agent as server.js
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Set HTML content with EXACT SAME settings as server.js
        console.log('Setting HTML content...');
        await page.setContent(html_content, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 45000
        });

        // EXACT SAME wait time as server.js
        console.log('⏳ Waiting 5 seconds for page to fully load...');
        await page.waitForTimeout(SCROLL_CONFIG.pageLoadWait);

        // Ensure page is scrolled to top - SAME AS server.js
        await page.evaluate(() => {
            window.scrollTo(0, 0);
        });

        console.log('✅ Page loaded, starting video generation in 3... 2... 1...');

        // EXACT SAME page dimension calculation as server.js
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

        // Capture screenshots - EXACT SAME function as server.js
        await captureScrollingScreenshots(page, scrollableHeight, frameDir, videoSettings);

        // Create video - EXACT SAME function as server.js
        console.log('Creating video from screenshots...');
        await createVideoFromScreenshots(frameDir, filePath, videoSettings);

        // Clean up frame directory - SAME AS server.js
        await fs.promises.rmdir(frameDir, { recursive: true });
        console.log('Cleaned up frame directory');

        // Get file stats - SAME AS server.js
        const stats = await fs.promises.stat(filePath);
        const fileSize = stats.size;

        console.log(`Video generated successfully: ${filename} (${formatFileSize(fileSize)})`);

        return {
            success: true,
            filename,
            size: formatFileSize(fileSize),
            message: `Video generated using screenshot-based method`
        };

    } catch (error) {
        console.error('Error generating video:', error);
        
        // Clean up frame directory on error - SAME AS server.js
        if (frameDir && fs.existsSync(frameDir)) {
            try {
                await fs.promises.rmdir(frameDir, { recursive: true });
            } catch (cleanupError) {
                console.error('Error cleaning up frame directory:', cleanupError);
            }
        }

        return {
            success: false,
            error: error.message
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function generateAllVideos() {
    console.log('🚀 Starting screenshot-based video generation process...\n');
    
    // Ensure directories exist
    await ensureDirectories();
    
    // Check if processing results exist
    if (!fs.existsSync(RESULTS_FILE)) {
        throw new Error(`❌ Processing results file not found: ${RESULTS_FILE}`);
    }
    
    // Read the processed website data
    const websites = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
    console.log(`📋 Found ${websites.length} websites to process`);
    
    if (websites.length === 0) {
        console.log('ℹ️  No websites to process');
        return;
    }
    
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    // Process each website
    for (const website of websites) {
        const result = await generateVideo(website);
        results.push({
            website: website.name,
            category: website.category,
            ...result
        });
        
        if (result.success) {
            successCount++;
        } else {
            failureCount++;
        }
        
        // Small delay between videos
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save generation results
    const summaryPath = path.join('.github', 'scripts', 'generation-results.json');
    const summary = {
        timestamp: new Date().toISOString(),
        totalWebsites: websites.length,
        successful: successCount,
        failed: failureCount,
        method: 'screenshot-based-direct',
        settings: {
            duration: SCROLL_CONFIG.recordingDuration,
            fps: SCROLL_CONFIG.fps,
            totalFrames: SCROLL_CONFIG.fps * SCROLL_CONFIG.recordingDuration,
            resolution: `${DEFAULT_VIDEO_SETTINGS.width}x${DEFAULT_VIDEO_SETTINGS.height}`,
            pageLoadWait: SCROLL_CONFIG.pageLoadWait
        },
        results
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`\n📊 Generation summary saved to: ${summaryPath}`);
    
    // Print final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 SCREENSHOT-BASED VIDEO GENERATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total websites processed: ${websites.length}`);
    console.log(`✅ Successful generations: ${successCount}`);
    console.log(`❌ Failed generations: ${failureCount}`);
    console.log(`🎬 Method: Screenshot-based with Sharp cropping`);
    console.log(`⏱️  Duration: ${SCROLL_CONFIG.recordingDuration} seconds each`);
    console.log(`🎞️  FPS: ${SCROLL_CONFIG.fps} (${SCROLL_CONFIG.fps * SCROLL_CONFIG.recordingDuration} frames)`);
    console.log('='.repeat(60));
    
    if (successCount > 0) {
        console.log('\n🎉 Successfully generated videos:');
        results.filter(r => r.success).forEach(r => {
            console.log(`   📹 ${r.website} (${r.category}) → ${r.filename}`);
        });
    }
    
    if (failureCount > 0) {
        console.log('\n💥 Failed video generations:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`   ❌ ${r.website} (${r.category}) → ${r.error}`);
        });
    }
    
    if (failureCount > 0) {
        console.warn(`\n⚠️  ${failureCount} video(s) failed to generate`);
    }
}

// List generated videos
async function listVideos() {
    try {
        console.log('📹 Listing generated videos...');
        if (!fs.existsSync(VIDEOS_DIR)) {
            console.log('📂 Videos directory does not exist');
            return { videos: [] };
        }
        
        const files = await fs.promises.readdir(VIDEOS_DIR);
        const videos = [];

        for (const file of files) {
            if (file.endsWith('.mp4') || file.endsWith('.webm')) {
                const filePath = path.join(VIDEOS_DIR, file);
                const stats = await fs.promises.stat(filePath);
                videos.push({
                    name: file,
                    size: formatFileSize(stats.size),
                    created: stats.birthtime
                });
            }
        }

        console.log(`✅ Found ${videos.length} videos`);
        return { videos: videos.sort((a, b) => b.created - a.created) };
    } catch (error) {
        console.error('❌ Failed to list videos:', error.message);
        return { videos: [] };
    }
}

// Main execution
if (require.main === module) {
    (async () => {
        try {
            await generateAllVideos();
            
            // Final check - list all videos
            const videoList = await listVideos();
            if (videoList.videos.length > 0) {
                console.log('\n📂 Final video inventory:');
                videoList.videos.forEach(video => {
                    console.log(`   📹 ${video.name} (${video.size})`);
                });
            }
            
            console.log('\n🎉 Screenshot-based video generation workflow completed successfully!');
            
        } catch (error) {
            console.error('\n💥 Video generation workflow failed:', error.message);
            process.exit(1);
        }
    })();
} 
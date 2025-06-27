const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');
const ffmpeg = require('fluent-ffmpeg');

async function testScrollSpeed() {
    console.log('🧪 Testing Scroll Speed - 10 second video with fast scrolling\n');
    
    let browser;
    const frameDir = path.join(__dirname, 'test-scroll-frames');
    
    try {
        // Create frame directory
        if (!existsSync(frameDir)) {
            await fs.mkdir(frameDir, { recursive: true });
        }
        
        // Launch browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Load the test website
        const htmlContent = await fs.readFile('testttt.html', 'utf8');
        await page.setContent(htmlContent);
        await page.waitForTimeout(3000);
        
        // Get page dimensions
        const dimensions = await page.evaluate(() => ({
            scrollHeight: document.body.scrollHeight,
            clientHeight: window.innerHeight
        }));
        
        const scrollableHeight = Math.max(0, dimensions.scrollHeight - dimensions.clientHeight);
        console.log(`📏 Page height: ${dimensions.scrollHeight}px`);
        console.log(`📏 Scrollable: ${scrollableHeight}px`);
        
        // Generate 10-second video (600 frames at 60fps) - FAST SCROLL
        const totalFrames = 600;
        const scrollPerFrame = scrollableHeight / totalFrames;
        
        console.log(`🎬 Generating ${totalFrames} frames...`);
        console.log(`📐 FAST scroll per frame: ${scrollPerFrame.toFixed(2)}px`);
        console.log(`⚡ This will scroll ${(scrollPerFrame * 60).toFixed(0)}px per second!\n`);
        
        // Generate frames with visual feedback
        for (let frame = 0; frame < totalFrames; frame++) {
            const scrollPosition = Math.round(frame * scrollPerFrame);
            
            // Add visual indicator to show scroll position
            await page.evaluate((scrollY, currentFrame, totalFrames) => {
                window.scrollTo(0, scrollY);
                
                // Add a visual indicator
                let indicator = document.getElementById('scroll-indicator');
                if (!indicator) {
                    indicator = document.createElement('div');
                    indicator.id = 'scroll-indicator';
                    indicator.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: red;
                        color: white;
                        padding: 10px 20px;
                        border-radius: 10px;
                        font-family: Arial;
                        font-size: 16px;
                        font-weight: bold;
                        z-index: 99999;
                        box-shadow: 0 4px 20px rgba(255,0,0,0.5);
                    `;
                    document.body.appendChild(indicator);
                }
                
                const progress = ((currentFrame / totalFrames) * 100).toFixed(1);
                indicator.textContent = `SCROLL: ${scrollY}px (${progress}%)`;
            }, scrollPosition, frame, totalFrames);
            
            // Small delay to ensure scroll takes effect
            await page.waitForTimeout(10);
            
            // Take screenshot
            const frameNumber = String(frame + 1).padStart(6, '0');
            await page.screenshot({
                path: path.join(frameDir, `frame_${frameNumber}.png`),
                clip: { x: 0, y: 0, width: 1920, height: 1080 }
            });
            
            // Progress logging
            if ((frame + 1) % 100 === 0) {
                const progress = ((frame + 1) / totalFrames * 100).toFixed(1);
                const seconds = ((frame + 1) / 60).toFixed(1);
                console.log(`  📸 Frame ${frame + 1}/${totalFrames} (${progress}%) - ${seconds}s - Scroll: ${scrollPosition}px`);
            }
        }
        
        console.log('\n✅ All frames captured!');
        
        // Create video
        const videoPath = path.join(__dirname, 'videos', 'scroll_speed_test.mp4');
        console.log('\n🎬 Creating video...');
        
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(path.join(frameDir, 'frame_%06d.png'))
                .inputFPS(60)
                .videoCodec('libx264')
                .outputOptions(['-crf 18', '-preset fast', '-pix_fmt yuv420p'])
                .fps(60)
                .output(videoPath)
                .on('progress', (progress) => {
                    if (progress.percent) {
                        process.stdout.write(`\r  🎬 Encoding: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', () => {
                    console.log('\n  ✅ Video encoding complete!');
                    resolve();
                })
                .on('error', reject)
                .run();
        });
        
        // Clean up
        await fs.rm(frameDir, { recursive: true });
        console.log('🧹 Cleaned up frames');
        
        // Get file size
        const stats = await fs.stat(videoPath);
        const fileSize = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`\n✅ SUCCESS! Test video: scroll_speed_test.mp4 (${fileSize} MB)`);
        console.log('📺 Opening video...');
        
        // Open the video
        const { spawn } = require('child_process');
        spawn('open', [videoPath], { detached: true });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testScrollSpeed(); 
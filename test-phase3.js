const puppeteer = require('puppeteer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');

// Test Phase 3 only
async function testPhase3() {
    console.log('🧪 Testing Phase 3 (Scrolling) Only...\n');
    
    let browser;
    const frameDir = path.join(__dirname, 'test-frames-phase3');
    
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
        await page.waitForTimeout(3000); // Wait for page to fully load
        
        // Get page dimensions
        const totalHeight = await page.evaluate(() => document.body.scrollHeight);
        const viewportHeight = 1080;
        const scrollableHeight = Math.max(0, totalHeight - viewportHeight);
        
        console.log(`📊 Page dimensions:`);
        console.log(`  - Total height: ${totalHeight}px`);
        console.log(`  - Viewport height: ${viewportHeight}px`);
        console.log(`  - Scrollable height: ${scrollableHeight}px\n`);
        
        // Test parameters
        const scrollStartFrame = 780;
        const totalFrames = 1800;
        const scrollFrames = totalFrames - scrollStartFrame; // 1020 frames
        const scrollPerFrame = scrollableHeight / scrollFrames;
        
        console.log(`📊 Scroll phase specs:`);
        console.log(`  - Frames to capture: ${scrollFrames}`);
        console.log(`  - Scroll per frame: ${scrollPerFrame.toFixed(2)}px`);
        console.log(`  - Total scroll distance: ${scrollableHeight}px\n`);
        
        // Method 1: Try full page screenshot with timeout
        console.log('🧪 Method 1: Testing full page screenshot with timeout...');
        const startTime = Date.now();
        
        try {
            const fullPageScreenshot = await Promise.race([
                page.screenshot({ fullPage: true, type: 'png' }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Full page screenshot timeout')), 15000)
                )
            ]);
            
            const elapsed = Date.now() - startTime;
            console.log(`✅ Full page screenshot captured in ${elapsed}ms`);
            
            // Test cropping a few frames
            console.log('\n🧪 Testing frame cropping...');
            for (let i = 0; i < 5; i++) {
                const frame = scrollStartFrame + (i * 200);
                const scrollFrameIndex = frame - scrollStartFrame;
                const currentScrollPosition = Math.round(scrollFrameIndex * scrollPerFrame);
                const cropY = Math.min(currentScrollPosition, scrollableHeight);
                
                const frameNumber = String(frame + 1).padStart(6, '0');
                const framePath = path.join(frameDir, `frame_${frameNumber}.png`);
                
                await sharp(fullPageScreenshot)
                    .extract({ 
                        left: 0, 
                        top: cropY, 
                        width: 1920, 
                        height: viewportHeight 
                    })
                    .png()
                    .toFile(framePath);
                    
                console.log(`  ✅ Frame ${frame} cropped at Y: ${cropY}px`);
            }
            
        } catch (error) {
            console.log(`❌ Full page screenshot failed: ${error.message}`);
            console.log(`  Time elapsed: ${Date.now() - startTime}ms\n`);
            
            // Method 2: Fallback to regular scrolling
            console.log('🧪 Method 2: Testing fallback scrolling method...');
            
            for (let i = 0; i < 5; i++) {
                const frame = scrollStartFrame + (i * 200);
                const scrollFrameIndex = frame - scrollStartFrame;
                const currentScrollPosition = Math.round(scrollFrameIndex * scrollPerFrame);
                
                await page.evaluate((scrollY) => window.scrollTo(0, scrollY), currentScrollPosition);
                
                const frameNumber = String(frame + 1).padStart(6, '0');
                await page.screenshot({
                    path: path.join(frameDir, `frame_${frameNumber}.png`),
                    fullPage: false,
                    clip: { x: 0, y: 0, width: 1920, height: viewportHeight }
                });
                
                console.log(`  ✅ Frame ${frame} captured at scroll position: ${currentScrollPosition}px`);
            }
        }
        
        console.log('\n✅ Phase 3 test completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Phase 3 test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
        
        // Clean up test frames
        if (existsSync(frameDir)) {
            await fs.rm(frameDir, { recursive: true });
            console.log('\n🧹 Cleaned up test frames');
        }
    }
}

// Run the test
testPhase3(); 
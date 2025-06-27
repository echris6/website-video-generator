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

// **PROVEN STEP 4 FOUNDATION** - Complete chatbot interaction that works perfectly
async function generateVideo(businessName, niche) {
    const browser = await puppeteer.launch({
        headless: 'new',
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

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Load website
    const htmlPath = path.join(__dirname, 'testttt.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(htmlContent);
    
    console.log('⏳ Content loaded');

    // Inject proven functions from Step 4
    await page.evaluate(() => {
        // Proven chatbot detection
        window.findChatbotButton = () => {
            const button = document.querySelector('.chat-toggle');
            if (button) {
                const rect = button.getBoundingClientRect();
                return {
                    x: Math.round(rect.left + rect.width / 2),
                    y: Math.round(rect.top + rect.height / 2),
                    found: true
                };
            }
            return { found: false };
        };

        // Proven minimize button detection  
        window.findMinimizeButton = () => {
            const button = document.querySelector('.chat-minimize');
            if (button) {
                const rect = button.getBoundingClientRect();
                return {
                    x: Math.round(rect.left + rect.width / 2),
                    y: Math.round(rect.top + rect.height / 2),
                    found: true
                };
            }
            return { found: false };
        };

        // Proven text fixes that work
        window.applyTextFixes = () => {
            const input = document.querySelector('#messageInput');
            if (input) {
                input.style.width = '320px';
                input.style.flex = '0 0 auto';
                input.style.minWidth = '320px';
                return true;
            }
            return false;
        };

        // Proven interaction functions
        window.clickChatbot = () => {
            const button = document.querySelector('.chat-toggle');
            if (button) {
                button.click();
                return true;
            }
            return false;
        };

        window.minimizeChatbot = () => {
            const button = document.querySelector('.chat-minimize');
            if (button) {
                button.click();
                return true;
            }
            return false;
        };

        window.typeMessage = () => {
            const input = document.querySelector('#messageInput');
            if (input) {
                input.focus();
                input.value = 'I want to buy a house';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                return true;
            }
            return false;
        };

        window.sendMessage = () => {
            const button = document.querySelector('.send-button');
            if (button) {
                button.click();
                return true;
            }
            return false;
        };
    });

    console.log('✅ All functions injected and ready');

    // Get page info
    const pageInfo = await page.evaluate(() => ({
        height: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight
    }));
    
    console.log(`📏 Page height: ${pageInfo.height}px`);
    console.log(`📏 Scrollable: ${pageInfo.height - pageInfo.viewportHeight}px`);

    // **STEP 5 PLAN**: 
    // Phase 1 (0-15s): Step 4 interaction + minimize
    // Phase 2 (15-25s): Site tour scroll
    const totalFrames = 1500; // 25 seconds at 60fps
    const phase1Frames = 900;  // 15 seconds interaction
    const phase2Frames = 600;  // 10 seconds site tour

    console.log(`🎬 Generating ${totalFrames} frames...`);
    console.log(`📐 Step 5: Complete interaction (15s) + site tour (10s)`);

    const frames = [];
    
    // **PHASE 1: PROVEN STEP 4 INTERACTION + MINIMIZE**
    for (let i = 0; i < phase1Frames; i++) {
        const timeS = (i / 60); // Current time in seconds
        
        // Step 4 proven timing with minimize added
        if (i === 240) { // 4s - click chatbot
            await page.evaluate(() => window.clickChatbot());
            await page.evaluate(() => window.applyTextFixes());
            console.log(`🖱️ CLICKED chatbot button at frame ${i} (${timeS.toFixed(1)}s)`);
        }
        
        if (i === 420) { // 7s - type message  
            await page.evaluate(() => window.typeMessage());
            console.log(`⌨️ TYPED message at frame ${i} (${timeS.toFixed(1)}s)`);
        }
        
        if (i === 720) { // 12s - send message
            await page.evaluate(() => window.sendMessage());
            console.log(`🖱️ SENT message at frame ${i} (${timeS.toFixed(1)}s)`);
        }
        
        if (i === 840) { // 14s - minimize chatbot
            await page.evaluate(() => window.minimizeChatbot());
            console.log(`🖱️ MINIMIZED chatbot at frame ${i} (${timeS.toFixed(1)}s)`);
        }

        // Cursor positioning for interaction phase
        let cursorX = 200, cursorY = 200;
        
        if (i >= 0 && i < 240) {
            // Move to chatbot button (0-4s)
            const progress = i / 240;
            cursorX = 200 + (1858 - 200) * progress;
            cursorY = 200 + (1018 - 200) * progress;
        } else if (i >= 420 && i < 720) {
            // Move to input field area during typing (7-12s)
            cursorX = 1636;
            cursorY = 934;
        } else if (i >= 720 && i < 840) {
            // Move to minimize button (12-14s)  
            const progress = (i - 720) / 120;
            cursorX = 1636 + (1854 - 1636) * progress;
            cursorY = 934 + (562 - 934) * progress;
        } else if (i >= 840) {
            // Cursor off-screen during site tour prep
            cursorX = 50;
            cursorY = 50;
        }

        // Take viewport screenshot for interaction
        const screenshot = await page.screenshot({ 
            type: 'png',
            clip: { x: 0, y: 0, width: 1920, height: 1080 }
        });
        
        // Add cursor overlay
        const frameWithCursor = await sharp(screenshot)
            .composite([{
                input: cursorBuffer,
                left: Math.round(cursorX) - 12,
                top: Math.round(cursorY) - 6,
                blend: 'over'
            }])
            .png()
            .toBuffer();
            
        frames.push(frameWithCursor);

        // Progress logging
        if (i % 300 === 0 || i === phase1Frames - 1) {
            console.log(`  📸 Frame ${i}/${totalFrames} (${(i/totalFrames*100).toFixed(1)}%) - ${timeS.toFixed(1)}s`);
        }
    }

    // **PHASE 2: SITE TOUR SCROLL**
    console.log('📸 Taking full page screenshot for site tour...');
    const fullPageScreenshot = await page.screenshot({ 
        type: 'png',
        fullPage: true 
    });
    console.log('📸 Full page screenshot captured');

    const maxScroll = pageInfo.height - pageInfo.viewportHeight;
    
    for (let i = 0; i < phase2Frames; i++) {
        const scrollProgress = i / (phase2Frames - 1);
        const scrollY = scrollProgress * maxScroll;
        
        // Crop the full page screenshot to show current scroll position
        const croppedFrame = await sharp(fullPageScreenshot)
            .extract({ 
                left: 0, 
                top: Math.round(scrollY), 
                width: 1920, 
                height: 1080 
            })
            .png()
            .toBuffer();
            
        frames.push(croppedFrame);

        // Progress logging
        const totalFrame = phase1Frames + i;
        const timeS = totalFrame / 60;
        if (i % 150 === 0 || i === phase2Frames - 1) {
            console.log(`  📸 Frame ${totalFrame}/${totalFrames} (${(totalFrame/totalFrames*100).toFixed(1)}%) - ${timeS.toFixed(1)}s`);
        }
    }

    console.log('✅ All frames captured!');

    // Create video using FFmpeg
    const timestamp = Date.now();
    const outputPath = path.join(__dirname, 'videos', `step5_clean_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`);
    
    console.log('🎬 Creating video...');
    
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-f', 'image2pipe',
            '-vcodec', 'png',
            '-r', '60',
            '-i', '-',
            '-vcodec', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-preset', 'medium',
            '-crf', '23',
            outputPath
        ]);

        let frameIndex = 0;
        const writeNextFrame = () => {
            if (frameIndex < frames.length) {
                ffmpeg.stdin.write(frames[frameIndex]);
                frameIndex++;
                setImmediate(writeNextFrame);
            } else {
                ffmpeg.stdin.end();
            }
        };

        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();
            if (output.includes('frame=')) {
                const match = output.match(/frame=\s*(\d+)/);
                if (match) {
                    const currentFrame = parseInt(match[1]);
                    const progress = (currentFrame / totalFrames * 100).toFixed(1);
                    console.log(`  🎬 Encoding: ${progress}%`);
                }
            }
        });

        ffmpeg.on('close', async (code) => {
            await browser.close();
            
            if (code === 0) {
                const stats = fs.statSync(outputPath);
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                console.log('  ✅ Video encoding complete!');
                console.log(`✅ SUCCESS! Video: ${path.basename(outputPath)} (${sizeMB} MB)`);
                resolve({
                    success: true,
                    video: path.basename(outputPath),
                    size: `${sizeMB} MB`,
                    duration: '25s',
                    frames: totalFrames
                });
            } else {
                reject(new Error(`FFmpeg failed with code ${code}`));
            }
        });

        ffmpeg.on('error', reject);
        writeNextFrame();
    });
}

// API endpoint
app.post('/generate-video', async (req, res) => {
    try {
        const { businessName = 'Clean Step 5 Test', niche = 'real_estate' } = req.body;
        
        console.log('🎥 STEP 5: CLEAN IMPLEMENTATION');
        console.log(`📋 Business: ${businessName}`);
        console.log(`🏢 Niche: ${niche}`);
        console.log('🧹 Clean systematic approach: Step 4 + minimize + site tour');

        const result = await generateVideo(businessName, niche);
        res.json(result);
    } catch (error) {
        console.error('❌ Video generation failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', server: 'Step 5 Clean Implementation' });
});

const PORT = 3030;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║           STEP 5: CLEAN IMPLEMENTATION            ║
║              Running on port ${PORT}                   ║
║                                                    ║
║  🧹 SYSTEMATIC: Step 4 + minimize + site tour     ║
║  📝 POST /generate-video - Generate video          ║
║  ❤️  GET  /health - Health check                   ║
╚════════════════════════════════════════════════════╝
`);
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Clean Step 5 Test","niche":"real_estate"}'`);
}); 
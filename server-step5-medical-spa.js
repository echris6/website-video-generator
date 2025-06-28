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

// **SIMPLE PROVEN TEXT FIXES** - Exact copy from debug analysis that worked
const applyWorkingFixesFunction = `
    function applyWorkingFixes() {
        console.log('🎯 Applying PRECISION fixes based on ACTUAL HTML structure...');
        
        // 1. STOP FLOATING CIRCLES GLITCHING - These are the main culprits
        const floatingCircles = document.querySelectorAll('.floating-circle');
        floatingCircles.forEach(circle => {
            circle.style.setProperty('animation', 'none', 'important');
            circle.style.setProperty('transform', 'none', 'important');
            circle.style.setProperty('opacity', '0.05', 'important'); // Nearly invisible
        });
        console.log('✅ Disabled ' + floatingCircles.length + ' floating circles causing glitching');
        
        // 2. ZERO LAYOUT IMPACT - Only fix floating circles
        const style = document.createElement('style');
        style.innerHTML = \`
            /* ONLY stop floating circles glitching - NOTHING ELSE */
            .floating-circle {
                animation: none !important;
                opacity: 0.02 !important;
            }
            
            /* ONLY cursor blinking fix - NO layout changes whatsoever */
            * {
                caret-color: transparent !important;
            }
        \`;
        document.head.appendChild(style);
        
        console.log('🎯 ULTRA MINIMAL fixes applied - only floating circles + cursor blinking (ZERO layout impact)!');
    }
`;

// **PROVEN CURSOR & CHATBOT FUNCTIONS** - From working servers
const chatbotFunctions = `
    function findChatbotButton() {
        // Use ACTUAL selector from test22.html
        const button = document.querySelector('#chatbot-trigger');
            if (button) {
                const rect = button.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
            console.log('✅ Chatbot button found at (' + x + ', ' + y + ') using #chatbot-trigger');
                return { x, y, element: button };
        }
        console.log('❌ #chatbot-trigger not found');
        return null;
    }
    
    function findMinimizeButton() {
        // Use ACTUAL selector from test22.html
        const button = document.querySelector('#chatbot-close');
            if (button) {
                const rect = button.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
            console.log('✅ Minimize button found at (' + x + ', ' + y + ') using #chatbot-close');
                return { x, y, element: button };
        }
        console.log('❌ #chatbot-close not found');
        return null;
    }
    
    function clickChatbotButton() {
        // Use ACTUAL selector from test22.html
        const button = document.querySelector('#chatbot-trigger');
            if (button) {
                button.click();
            console.log('✅ Chatbot button clicked using #chatbot-trigger');
                return true;
        }
        console.log('❌ #chatbot-trigger not found');
        return false;
    }
    
    function clickInputField() {
        // Use ACTUAL selector from test22.html
        const input = document.querySelector('#chatbot-input');
            if (input) {
                input.click();
                input.focus();
            console.log('✅ Input field clicked and focused: #chatbot-input');
                return true;
        }
        console.log('❌ #chatbot-input not found');
        return false;
    }
    
    function typeInInput(text) {
        // Use ACTUAL selector from test22.html
        const input = document.querySelector('#chatbot-input');
            if (input) {
                input.value = text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Typed: "' + text + '" in #chatbot-input');
                return true;
        }
        console.log('❌ #chatbot-input not found for typing');
        return false;
    }
    
    function clickSendButton() {
        // Medical spa uses Enter key on #chatbot-input (confirmed from HTML)
        const input = document.querySelector('#chatbot-input');
            if (input) {
                const enterEvent = new KeyboardEvent('keypress', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                });
                input.dispatchEvent(enterEvent);
            console.log('✅ Enter key pressed on #chatbot-input to send message');
                return true;
        }
        console.log('❌ #chatbot-input not found for sending');
        return false;
    }
    
    function clickMinimizeButton() {
        // Use ACTUAL selector from test22.html with multiple attempts
        const selectors = ['#chatbot-close', '.chatbot-close', '#close-button', '.close-btn'];
        
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) {
                button.click();
                console.log('✅ Minimize button clicked using: ' + selector);
                
                // Wait a bit then verify it worked
                setTimeout(() => {
                    const container = document.querySelector('.chatbot-container');
                    if (container && !container.classList.contains('active')) {
                        console.log('✅ Chatbot successfully minimized');
                    }
                }, 100);
                
                return true;
            }
        }
        
        // Fallback: try clicking chat trigger to close
        const trigger = document.querySelector('#chatbot-trigger');
        if (trigger) {
            trigger.click();
            console.log('✅ Chat toggled closed as fallback using #chatbot-trigger');
            return true;
        }
        
        console.log('❌ Could not minimize chatbot - no minimize button found');
        return false;
    }
`;

// **STEP 5 CURSOR POSITIONING** - Simplified and accurate
function getCursorPositionForFrame(frameIndex, totalFrames) {
    // Fixed coordinates based on actual chatbot layout
    const startPosition = { x: 200, y: 200 };
    const chatbotPosition = { x: 1858, y: 1018 };    // Chatbot button
    const inputPosition = { x: 1636, y: 934 };      // Input field  
    const sendPosition = { x: 1849, y: 934 };       // Send button (same as input for medical spa)
    const minimizePosition = { x: 1854, y: 562 };   // CORRECT coordinates from debug analysis
    
    // **STEP 5 TIMING** - 25 seconds total
    const moveToButtonEnd = 0.15;      // 0-15%: Move to chatbot (0-3.75s)
    const clickPause = 0.176;          // 15-17.6%: Click button (3.75-4.4s)
    const moveToInputEnd = 0.25;       // 17.6-25%: Move to input (4.4-6.25s)
    const typingEnd = 0.4;             // 25-40%: Typing (6.25-10s)
    const moveToSendEnd = 0.476;       // 40-47.6%: Move to send (10-11.9s)
    const sendPause = 0.5;             // 47.6-50%: Send message (11.9-12.5s)
    const moveToMinimizeEnd = 0.53;    // 50-53%: FASTER movement to minimize (12.5-13.25s)
    const minimizePause = 0.55;        // 53-55%: Minimize click (13.25-13.75s)
    // 58-100%: Scrolling phase (14.5-25s) - MORE time for scrolling
    
    const progress = frameIndex / totalFrames;
    
    if (progress <= moveToButtonEnd) {
        const phaseProgress = progress / moveToButtonEnd;
        return interpolatePosition(startPosition, chatbotPosition, phaseProgress);
    } else if (progress <= clickPause) {
        return chatbotPosition;
    } else if (progress <= moveToInputEnd) {
        const phaseProgress = (progress - clickPause) / (moveToInputEnd - clickPause);
        return interpolatePosition(chatbotPosition, inputPosition, phaseProgress);
    } else if (progress <= typingEnd) {
        return inputPosition;
    } else if (progress <= moveToSendEnd) {
        const phaseProgress = (progress - typingEnd) / (moveToSendEnd - typingEnd);
        return interpolatePosition(inputPosition, sendPosition, phaseProgress);
    } else if (progress <= sendPause) {
        return sendPosition;
    } else if (progress <= moveToMinimizeEnd) {
        const phaseProgress = (progress - sendPause) / (moveToMinimizeEnd - sendPause);
        return interpolatePosition(sendPosition, minimizePosition, phaseProgress);
    } else if (progress <= minimizePause) {
        return minimizePosition;
    } else {
        // During scrolling - cursor STAYS at minimize position (no jumping!)
        return minimizePosition;
    }
}

function interpolatePosition(startPos, endPos, progress) {
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easedProgress = easeInOutCubic(progress);
    
    return {
        x: startPos.x + (endPos.x - startPos.x) * easedProgress,
        y: startPos.y + (endPos.y - startPos.y) * easedProgress
    };
}

async function generateVideo(testId) {
    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Load the medical spa website
        const websiteContent = fs.readFileSync(path.join(__dirname, 'test22.html'), 'utf8');
        await page.setContent(websiteContent);

        const fps = 60;
        const duration = 30; // 30 seconds: fast interaction + slow scrolling
        const totalFrames = fps * duration;
        
        console.log(`🎬 Generating ${totalFrames} frames for medical spa...`);
        console.log(`📐 Step 5: MEDICAL SPA COMPLETE SITE TOUR (25 seconds)`);
        console.log(`💬 Message: "What are your hours?"`);
        
        // Wait for content to load - MINIMAL wait to prevent hero glitching
        await delay(500);
        console.log('⏳ Waiting for content to fully load...');
        
        // Inject chatbot functions and text fix function (but don't apply fixes yet - wait until chatbot opens)
        await page.evaluate(chatbotFunctions);
        await page.evaluate(applyWorkingFixesFunction);
        
        // Reveal all content
        await page.evaluate(() => {
            const revealElements = document.querySelectorAll('.reveal-element');
            revealElements.forEach(element => {
                element.classList.add('revealed');
            });
        });
        
        await delay(500);
        console.log('✅ All fixes applied and content ready!');
        
        // Get page dimensions
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        const viewportHeight = 1080;
        const maxScroll = Math.max(0, pageHeight - viewportHeight);
        
        console.log(`📏 Page height: ${pageHeight}px`);
        console.log(`📏 Scrollable: ${maxScroll}px`);
        
        // Create frames directory
        const framesDir = path.join(__dirname, 'frames');
        if (!fs.existsSync(framesDir)) {
            fs.mkdirSync(framesDir);
        }
        
        // **FIXED TIMING SYSTEM**
        const clickFrame = Math.floor(totalFrames * 0.176);         // Click at 4.4s
        const inputFocusFrame = Math.floor(totalFrames * 0.25);     // Focus input at 6.25s
        const typingStartFrame = Math.floor(totalFrames * 0.25);    // Start typing at 6.25s
        const typingEndFrame = Math.floor(totalFrames * 0.4);       // End typing at 10s
        const sendClickFrame = Math.floor(totalFrames * 0.476);     // Send at 11.9s
        const minimizeClickFrame = Math.floor(totalFrames * 0.55);  // Minimize at 13.75s
        const scrollStartFrame = Math.floor(totalFrames * 0.58);    // Scroll at 14.5s - AFTER MINIMIZE COMPLETES
        
        const message = "What are your hours?"; // Medical spa appropriate question
        let chatbotOpened = false;
        let chatbotMinimized = false;
        let typingProgress = 0;
        let fullPageBuffer = null;
        
        // Generate frames
        for (let i = 0; i < totalFrames; i++) {
            let frameBuffer;
            
            if (i < scrollStartFrame) {
                // **INTERACTION PHASE**: Viewport screenshots
                
                // Handle chatbot interaction
                if (i === clickFrame && !chatbotOpened) {
                    await page.evaluate(() => clickChatbotButton());
                    console.log(`🖱️ CLICKED chatbot button at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    chatbotOpened = true;
                    await delay(500);
                    
                    // **APPLY TEXT CUTOFF FIXES AFTER CHATBOT OPENS**
                    await page.evaluate(() => {
                        if (typeof applyWorkingFixes === 'function') {
                            applyWorkingFixes();
                        } else {
                            console.log('❌ applyWorkingFixes function not found');
                        }
                    });
                    console.log('🔧 Applied text cutoff fixes after chatbot opened');
                    await delay(200);
                }
                
                if (i === inputFocusFrame) {
                    await page.evaluate(() => clickInputField());
                    console.log(`🖱️ FOCUSED input field at frame ${i} (${(i/fps).toFixed(1)}s)`);
                }
                
                // Handle typing
                if (i >= typingStartFrame && i < typingEndFrame) {
                    const typingFrames = typingEndFrame - typingStartFrame;
                    const currentProgress = (i - typingStartFrame) / typingFrames;
                    const charactersToShow = Math.floor(currentProgress * message.length);
                    
                    if (charactersToShow > typingProgress) {
                        const textToShow = message.substring(0, charactersToShow);
                        await page.evaluate((text) => typeInInput(text), textToShow);
                        
                        typingProgress = charactersToShow;
                    }
                }
                
                if (i === sendClickFrame) {
                    await page.evaluate(() => clickSendButton());
                    console.log(`🖱️ PRESSED ENTER to send message at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    await delay(300);
                }
                
                // **FIXED MINIMIZE CLICKING** - Use dynamic coordinates
                if (i === minimizeClickFrame && !chatbotMinimized) {
                    await page.evaluate(() => clickMinimizeButton());
                    console.log(`🖱️ MINIMIZED chatbot at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    chatbotMinimized = true;
                    
                    // Give extra time for minimize animation to complete
                    await delay(800);
                    
                    // Force hide chatbot container to ensure it's minimized
                    await page.evaluate(() => {
                        const container = document.querySelector('.chatbot-container');
                        if (container) {
                            container.style.display = 'none';
                            console.log('✅ Forced chatbot container hidden');
                        }
                    });
                }
                
                frameBuffer = await page.screenshot({ 
                    type: 'png',
                    clip: { x: 0, y: 0, width: 1920, height: 1080 }
                });
                
            } else {
                // **SCROLLING PHASE**: Full page screenshot with scrolling
                
                if (!fullPageBuffer) {
                    console.log('📸 Taking full page screenshot for scrolling...');
                    
                    // **ENSURE ALL CONTENT IS PROPERLY LOADED**
                    await page.evaluate(() => {
                        // Force reveal all content elements
                        const revealElements = document.querySelectorAll('.reveal-element');
                        revealElements.forEach(element => {
                            element.classList.add('revealed');
                            element.style.opacity = '1';
                            element.style.transform = 'translateY(0)';
                            element.style.visibility = 'visible';
                        });
                        
                        // Force load all sections with content
                        const sections = document.querySelectorAll('section');
                        sections.forEach(section => {
                            section.style.opacity = '1';
                            section.style.visibility = 'visible';
                        });
                        
                        // Scroll to top for clean screenshot
                        window.scrollTo(0, 0);
                    });
                    
                    // Give content time to fully render
                    await delay(1000);
                    
                    // Take full page screenshot with proper dimensions
                    fullPageBuffer = await page.screenshot({ 
                        fullPage: true,
                        type: 'png'
                    });
                    console.log('📸 Full page screenshot captured with all content loaded');
                }
                
                const scrollProgress = (i - scrollStartFrame) / (totalFrames - scrollStartFrame);
                // GUARANTEED 100% SCROLL: Ensure we reach the very end of the site
                const scrollY = Math.round(scrollProgress * maxScroll); // Full 100% scroll guaranteed
                
                // Get fullPageBuffer dimensions for safe extraction
                const { width: imageWidth, height: imageHeight } = await sharp(fullPageBuffer).metadata();
                
                // Ensure extract coordinates are within bounds
                const safeScrollY = Math.max(0, Math.min(scrollY, imageHeight - 1080));
                const extractHeight = Math.min(1080, imageHeight - safeScrollY);
                
                // Only extract if we have valid dimensions
                if (extractHeight > 0 && imageWidth >= 1920) {
                // Crop full page screenshot to simulate smooth scrolling
                frameBuffer = await sharp(fullPageBuffer)
                        .extract({ left: 0, top: safeScrollY, width: 1920, height: extractHeight })
                        .resize(1920, 1080, { fit: 'fill' }) // Ensure consistent output size
                    .png()
                    .toBuffer();
                } else {
                    // Fallback: use viewport screenshot
                    console.log(`⚠️ Invalid extract dimensions at frame ${i}, using viewport screenshot`);
                    frameBuffer = await page.screenshot({ 
                        type: 'png',
                        clip: { x: 0, y: 0, width: 1920, height: 1080 }
                    });
                }
            }
            
            // Add cursor overlay
            const cursorPos = getCursorPositionForFrame(i, totalFrames);
            const frameWithCursor = await sharp(frameBuffer)
                .composite([{
                    input: cursorBuffer,
                    left: Math.round(cursorPos.x),
                    top: Math.round(cursorPos.y),
                    blend: 'over'
                }])
                .png()
                .toBuffer();
            
            // Save frame
            const framePath = path.join(framesDir, `frame_${i.toString().padStart(6, '0')}.png`);
            fs.writeFileSync(framePath, frameWithCursor);
            
            // Progress logging
            if ((i + 1) % Math.floor(totalFrames / 4) === 0) {
                const percentage = ((i + 1) / totalFrames * 100).toFixed(1);
                const timeSeconds = ((i + 1) / fps).toFixed(1);
                console.log(`  📸 Frame ${i + 1}/${totalFrames} (${percentage}%) - ${timeSeconds}s`);
            }
        }
        
        console.log('✅ All frames captured!');
        
        // Create video using FFmpeg
        console.log('🎬 Creating video...');
        const videoPath = path.join(__dirname, 'videos', `medical_spa_hours_test_${testId}_${Date.now()}.mp4`);
        
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-framerate', fps.toString(),
            '-i', path.join(framesDir, 'frame_%06d.png'),
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-crf', '18',
            '-preset', 'medium',
            videoPath
        ]);

        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();
            const match = output.match(/frame=\s*(\d+)/);
            if (match) {
                const currentFrame = parseInt(match[1]);
                const percentage = (currentFrame / totalFrames * 100).toFixed(1);
                console.log(`  🎬 Encoding: ${percentage}%`);
            }
        });

        await new Promise((resolve, reject) => {
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('  ✅ Video encoding complete!');
                    resolve();
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}`));
                }
            });
        });

        // Clean up frames
        console.log('🧹 Cleaning up frames...');
        const frameFiles = fs.readdirSync(framesDir).filter(f => f.startsWith('frame_'));
        frameFiles.forEach(file => {
            fs.unlinkSync(path.join(framesDir, file));
        });

        const stats = fs.statSync(videoPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ SUCCESS! Video: ${path.basename(videoPath)} (${fileSizeInMB} MB)`);
        
        return {
            success: true,
            videoPath: path.basename(videoPath),
            fileSizeInMB: parseFloat(fileSizeInMB),
            duration: duration,
            fps: fps,
            frames: totalFrames
        };

    } catch (error) {
        console.error('❌ Video generation failed:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Video generation endpoint
app.post('/generate-video', async (req, res) => {
    try {
        const { testId } = req.body;
        
        console.log(`🎥 MEDICAL SPA TEST: COMPLETE SITE TOUR`);
        console.log(`📋 Test ID: ${testId}`);
        console.log(`🏢 Site: test22.html (Medical Spa)`);
        console.log(`💬 Question: "What are your hours?"`);
        console.log(`🎬 Complete Flow: Interaction → Minimize → Site Tour (25s)`);
        console.log('─'.repeat(50));
        
        const result = await generateVideo(testId);
        
        console.log('─'.repeat(50));
        console.log(`✅ SUCCESS! Medical spa video generated`);
        console.log(`📁 File: ${result.videoPath}`);
        console.log(`📊 Size: ${result.fileSizeInMB} MB`);
        console.log(`⏱️  Duration: ${result.duration}s`);
        console.log(`🎞️  FPS: ${result.fps}`);
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: error.stack
        });
    }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
    console.log(`🎬 Medical Spa Video Server running on port ${PORT}`);
    console.log(`📍 Endpoints:`);
    console.log(`   GET  /health - Health check`);
    console.log(`   POST /generate-video - Generate medical spa video`);
    console.log(`🎯 Ready to test medical spa with "What are your hours?" question!`);
}); 
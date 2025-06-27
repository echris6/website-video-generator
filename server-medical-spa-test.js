const express = require('express');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const sharp = require('sharp');

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

// **LUXURY SITE ANTI-GLITCH FIXES** - No HTML modifications, just stabilization
const applyWorkingFixesFunction = `
    function applyWorkingFixes() {
        console.log('🔧 Applying LUXURY SITE anti-glitch fixes (no HTML changes)...');
        
        // 1. ELIMINATE SITE GLITCHING - Disable floating circle animations
        const floatingElements = document.querySelectorAll('.floating-circle');
        floatingElements.forEach(element => {
            element.style.setProperty('animation', 'none', 'important');
            element.style.setProperty('transform', 'none', 'important');
            element.style.setProperty('opacity', '0.02', 'important');
        });
        console.log('✅ Floating circles disabled - no more glitching!');
        
        // 2. COMPREHENSIVE ANIMATION & CURSOR BLINKING ELIMINATION
        const style = document.createElement('style');
        style.innerHTML = \`
            *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                caret-color: transparent !important;
            }
            .floating-circle {
                animation: none !important;
                transform: none !important;
            }
            .chatbot-input, .chatbot-input:focus, #chatbot-input, #chatbot-input:focus {
                caret-color: transparent !important;
                transition: none !important;
                border-color: rgba(232, 180, 184, 0.5) !important;
                background: rgba(255, 255, 255, 0.3) !important;
            }
            input, textarea {
                caret-color: transparent !important;
            }
        \`;
        document.head.appendChild(style);
        console.log('✅ All animations & text cursor blinking disabled');
        
        // 3. Fix text cutoff WITHOUT changing UI appearance - INVISIBLE FIXES ONLY
        // lux.html uses #messageInput, not #chatbot-input
        const inputSelectors = ['#messageInput', '#chatbot-input', '.chatbot-input'];
        
        let inputFixed = false;
        
        // ULTRA MINIMAL FIX: Only change flex constraint, nothing else
        for (const selector of inputSelectors) {
            const input = document.querySelector(selector);
            if (input && !inputFixed) {
                // ONLY remove the flex constraint that causes text cutoff
                input.style.setProperty('flex', 'none', 'important');
                input.style.setProperty('width', '300px', 'important'); // Wider to fit "I want to buy a house"
                console.log('✅ Fixed flex constraint for full text display using: ' + selector);
                inputFixed = true;
                break;
            }
        }
        
        if (!inputFixed) {
            console.log('❌ No input field found with any selector');
        }
        
        console.log('🔧 ULTRA MINIMAL fixes applied - Only flex constraint removed, UI position preserved!');
    }
`;

// **PROVEN CURSOR & CHATBOT FUNCTIONS** - From working servers
const chatbotFunctions = `
    function findChatbotButton() {
        // Medical spa uses different selectors
        const selectors = ['#chatbot-trigger', '.chatbot-trigger', '#chatToggle', '.chat-toggle'];
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) {
                const rect = button.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                console.log('✅ Chatbot button found at (' + x + ', ' + y + ') using: ' + selector);
                return { x, y, element: button };
            }
        }
        return null;
    }
    
    function findMinimizeButton() {
        // TRY MULTIPLE SELECTORS for minimize button (medical spa uses different ones)
        const selectors = [
            '#chatbot-close',
            '.chatbot-close',
            '#chatMinimize',
            '.chat-minimize', 
            '.chat-header button',
            '.chatbot-header button'
        ];
        
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) {
                const rect = button.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                console.log('✅ Minimize button found at (' + x + ', ' + y + ') using selector: ' + selector);
                return { x, y, element: button };
            }
        }
        console.log('❌ Minimize button not found');
        return null;
    }
    
    function clickChatbotButton() {
        const selectors = ['#chatbot-trigger', '.chatbot-trigger', '#chatToggle', '.chat-toggle'];
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) {
                button.click();
                console.log('✅ Chatbot button clicked using: ' + selector);
                return true;
            }
        }
        return false;
    }
    
    function clickInputField() {
        const selectors = ['#chatbot-input', '.chatbot-input', '#messageInput'];
        for (const selector of selectors) {
            const input = document.querySelector(selector);
            if (input) {
                input.click();
                input.focus();
                console.log('✅ Input field clicked and focused using: ' + selector);
                return true;
            }
        }
        return false;
    }
    
    function typeInInput(text) {
        const selectors = ['#chatbot-input', '.chatbot-input', '#messageInput'];
        for (const selector of selectors) {
            const input = document.querySelector(selector);
            if (input) {
                input.value = text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('✅ Typed: "' + text + '" using: ' + selector);
                return true;
            }
        }
        return false;
    }
    
    function clickSendButton() {
        // Try clicking existing send button first (lux.html has one)
        const sendSelectors = ['#sendButton', '.send-button', '#chatbot-send', '.chatbot-send'];
        for (const selector of sendSelectors) {
            const button = document.querySelector(selector);
            if (button) {
                button.click();
                console.log('✅ Send button clicked using: ' + selector);
                return true;
            }
        }
        
        // Fallback: use Enter key if no send button found
        const inputSelectors = ['#chatbot-input', '.chatbot-input', '#messageInput'];
        for (const selector of inputSelectors) {
            const input = document.querySelector(selector);
            if (input) {
                const enterEvent = new KeyboardEvent('keypress', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                });
                input.dispatchEvent(enterEvent);
                console.log('✅ Enter pressed to send message using: ' + selector);
                return true;
            }
        }
        return false;
    }
    
    function clickMinimizeButton() {
        const minimize = findMinimizeButton();
        if (minimize && minimize.element) {
            minimize.element.click();
            console.log('✅ Minimize button clicked');
            return true;
        }
        
        // Fallback: try clicking chat trigger to close
        const selectors = ['#chatbot-trigger', '.chatbot-trigger', '#chatToggle', '.chat-toggle'];
        for (const selector of selectors) {
            const toggle = document.querySelector(selector);
            if (toggle) {
                toggle.click();
                console.log('✅ Chat toggled closed as fallback using: ' + selector);
                return true;
            }
        }
        
        console.log('❌ Could not minimize chatbot');
        return false;
    }
`;

// **STEP 5 CURSOR POSITIONING** - Updated for new send button
function getCursorPositionForFrame(frameIndex, totalFrames) {
    // Fixed coordinates based on actual chatbot layout with new send button
    const startPosition = { x: 200, y: 200 };
    const chatbotPosition = { x: 1858, y: 1018 };    // Chatbot button
    const inputPosition = { x: 1636, y: 934 };      // Input field  
    const sendPosition = { x: 1835, y: 934 };       // Send button position (adjusted for 300px input)
    const minimizePosition = { x: 1854, y: 562 };   // CORRECT coordinates from debug analysis
    
    // **STEP 5 TIMING** - 30 seconds: fast interaction + slow scrolling
    const moveToButtonEnd = 0.15;      // 0-15%: Move to chatbot (0-4.5s) - FAST
    const clickPause = 0.176;          // 15-17.6%: Click button (4.5-5.28s) - FAST
    const moveToInputEnd = 0.25;       // 17.6-25%: Move to input (5.28-7.5s) - FAST
    const typingEnd = 0.4;             // 25-40%: Typing (7.5-12s) - FAST
    const moveToSendEnd = 0.476;       // 40-47.6%: Move to send (12-14.28s) - FAST
    const sendPause = 0.5;             // 47.6-50%: Send message (14.28-15s) - FAST
    const moveToMinimizeEnd = 0.56;    // 50-56%: Move to minimize (15-16.8s) - FAST
    const minimizePause = 0.58;        // 56-58%: Minimize click (16.8-17.4s) - FAST
    // 60-100%: Scrolling phase (18-30s) - SLOW SCROLLING (12 seconds!)
    
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
        // During scrolling - cursor stays at minimize position
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

async function generateVideo(businessName, niche) {
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

        // Load the luxury website  
        const websiteContent = fs.readFileSync(path.join(__dirname, 'lux.html'), 'utf8');
        await page.setContent(websiteContent);

        const fps = 60;
        const duration = 30; // 30 seconds: fast interaction + slow scrolling
        const totalFrames = fps * duration;
        
        console.log(`🎬 Generating ${totalFrames} frames...`);
        console.log(`📐 Step 5: COMPLETE SITE TOUR - FIXED VERSION (30 seconds)`);
        
        // Wait for content to load - MINIMAL wait to prevent hero glitching
        await page.waitForDelay(500);
        console.log('⏳ Waiting for content to fully load...');
        
        // Inject chatbot functions and apply anti-glitch fixes IMMEDIATELY
        await page.evaluate(chatbotFunctions);
        await page.evaluate(applyWorkingFixesFunction);
        
        // APPLY ANTI-GLITCH FIXES RIGHT AWAY to prevent site glitching from the start
        await page.evaluate(() => {
            if (typeof applyWorkingFixes === 'function') {
                applyWorkingFixes();
            }
        });
        console.log('🔧 Anti-glitch fixes applied from the start');
        
        // Reveal all content
        await page.evaluate(() => {
            const revealElements = document.querySelectorAll('.reveal-element');
            revealElements.forEach(element => {
                element.classList.add('revealed');
            });
        });
        
        await page.waitForDelay(500);
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
        const clickFrame = Math.floor(totalFrames * 0.176);         // Click at 5.28s
        const inputFocusFrame = Math.floor(totalFrames * 0.25);     // Focus input at 7.5s
        const typingStartFrame = Math.floor(totalFrames * 0.25);    // Start typing at 7.5s
        const typingEndFrame = Math.floor(totalFrames * 0.4);       // End typing at 12s
        const sendClickFrame = Math.floor(totalFrames * 0.476);     // Send at 14.28s
        const minimizeClickFrame = Math.floor(totalFrames * 0.56);  // Minimize at 16.8s
        const scrollStartFrame = Math.floor(totalFrames * 0.6);     // Scroll at 18s - AFTER MINIMIZE COMPLETES
        
        const message = "I want to book a Botox treatment";
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
                    await page.waitForDelay(500);
                    
                    // **APPLY TEXT CUTOFF FIXES AFTER CHATBOT OPENS**
                    await page.evaluate(() => {
                        if (typeof applyWorkingFixes === 'function') {
                            applyWorkingFixes();
                        } else {
                            console.log('❌ applyWorkingFixes function not found');
                        }
                    });
                    console.log('🔧 Applied text cutoff fixes after chatbot opened');
                    await page.waitForDelay(200);
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
                    console.log(`🖱️ CLICKED send button at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    await page.waitForDelay(300);
                }
                
                // **FIXED MINIMIZE CLICKING** - Use dynamic coordinates
                if (i === minimizeClickFrame && !chatbotMinimized) {
                    await page.evaluate(() => clickMinimizeButton());
                    console.log(`🖱️ MINIMIZED chatbot at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    chatbotMinimized = true;
                    await page.waitForDelay(500);
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
                    await page.waitForDelay(1000);
                    
                    // Take full page screenshot with proper dimensions
                    fullPageBuffer = await page.screenshot({ 
                        fullPage: true,
                        type: 'png'
                    });
                    console.log('📸 Full page screenshot captured with all content loaded');
                }
                
                const scrollProgress = (i - scrollStartFrame) / (totalFrames - scrollStartFrame);
                // EXTRA SLOW & READABLE: Very gradual scrolling over 12 seconds, guaranteed to reach 100%
                const slowProgress = Math.min(scrollProgress * 1.05, 1.0); // Very slow pace but reaches 100%
                const scrollY = Math.round(slowProgress * maxScroll); // Full 100% scroll guaranteed
                
                // Crop full page screenshot to simulate smooth scrolling
                frameBuffer = await sharp(fullPageBuffer)
                    .extract({ left: 0, top: scrollY, width: 1920, height: 1080 })
                    .png()
                    .toBuffer();
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
        const videoPath = path.join(__dirname, 'videos', `step5_tour_${businessName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.mp4`);
        
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
        const { businessName, niche } = req.body;
        
        console.log(`🎥 STEP 5: COMPLETE SITE TOUR - ACTUALLY FIXED!`);
        console.log(`📋 Business: ${businessName}`);
        console.log(`🏢 Niche: ${niche}`);
        console.log(`🔧 FIXES: WORKING input width, CORRECT minimize position, PROPER content loading, FIXED scroll`);
        console.log(`🎬 Complete Flow: Interaction → Minimize → Site Tour (30s)`);
        
        const result = await generateVideo(businessName, niche);
        res.json(result);
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

const PORT = 3020;
app.listen(PORT, () => {
    console.log('✅ Cursor loaded:', path.join(__dirname, 'cursor.png'));
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║         LUXURY SITE TEST: COMPLETE SITE TOUR       ║');
    console.log(`║              Running on port ${PORT}                    ║`);
    console.log('║                                                    ║');
    console.log('║  ✨ HTML: lux.html (Luxury Site)                  ║');
    console.log('║  💬 Question: "I want to buy a house"            ║');
    console.log('║  📝 POST /generate-video - Generate video          ║');
    console.log('║  ❤️  GET  /health - Health check                   ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Lux Test","niche":"luxury"}'`);
}); 
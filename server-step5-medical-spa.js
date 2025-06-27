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

// **SIMPLE PROVEN TEXT FIXES** - Exact copy from debug analysis that worked
const applyWorkingFixesFunction = `
    function applyWorkingFixes() {
        console.log('🔧 Applying PROVEN working text fixes...');
        
        // Check for different chatbot structures
        let chatWidget = document.querySelector('.chat-widget');
        if (!chatWidget) {
            chatWidget = document.querySelector('.chatbot-container');
        }
        
        let inputField = document.querySelector('#messageInput');
        if (!inputField) {
            inputField = document.querySelector('#chatbot-input');
        }
        
        if (chatWidget) {
            chatWidget.style.setProperty('width', '420px', 'important');
            chatWidget.style.setProperty('min-width', '420px', 'important');
            console.log('✅ Chat widget widened to 420px');
        }
        
        if (inputField) {
            // CRITICAL: Remove flex and set explicit width (this is what fixes the cutoff)
            inputField.style.setProperty('flex', '0 0 auto', 'important');
            inputField.style.setProperty('width', '320px', 'important');
            inputField.style.setProperty('min-width', '320px', 'important');
            console.log('✅ Input field width set to 320px (was 260px)');
        }
        
        console.log('🔧 Simple text cutoff fixes applied successfully');
    }
`;

// **PROVEN CURSOR & CHATBOT FUNCTIONS** - From working servers
const chatbotFunctions = `
    function findChatbotButton() {
        // Check for different chatbot button selectors
        const selectors = [
            '#chatToggle', 
            '.chat-toggle',
            '#chatbot-trigger',
            '.chatbot-trigger'
        ];
        
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) {
                const rect = button.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                console.log('✅ Chatbot button found at (' + x + ', ' + y + ') using selector: ' + selector);
                return { x, y, element: button };
            }
        }
        return null;
    }
    
    function findMinimizeButton() {
        // TRY MULTIPLE SELECTORS for minimize button
        const selectors = [
            '#chatMinimize',
            '.chat-minimize', 
            '.chat-header button',
            '.chat-toggle.active',
            '#chatbot-close',
            '.chatbot-close'
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
        const selectors = ['#chatToggle', '.chat-toggle', '#chatbot-trigger', '.chatbot-trigger'];
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) {
                button.click();
                console.log('✅ Chatbot button clicked using selector: ' + selector);
                return true;
            }
        }
        return false;
    }
    
    function clickInputField() {
        const selectors = ['#messageInput', '#chatbot-input'];
        for (const selector of selectors) {
            const input = document.querySelector(selector);
            if (input) {
                input.click();
                input.focus();
                console.log('✅ Input field clicked and focused using selector: ' + selector);
                return true;
            }
        }
        return false;
    }
    
    function typeInInput(text) {
        const selectors = ['#messageInput', '#chatbot-input'];
        for (const selector of selectors) {
            const input = document.querySelector(selector);
            if (input) {
                input.value = text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('✅ Typed: "' + text + '"');
                return true;
            }
        }
        return false;
    }
    
    function clickSendButton() {
        // Medical spa doesn't have send button - just press Enter
        const selectors = ['#messageInput', '#chatbot-input'];
        for (const selector of selectors) {
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
                console.log('✅ Enter key pressed to send message');
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
        
        // Fallback: try clicking chat toggle to close
        const selectors = ['#chatToggle', '.chat-toggle', '#chatbot-trigger', '.chatbot-trigger'];
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
    const moveToMinimizeEnd = 0.56;    // 50-56%: SLOW SMOOTH movement to minimize (12.5-14s)
    const minimizePause = 0.58;        // 56-58%: Minimize click (14-14.5s)
    // 60-100%: Scrolling phase (15-25s) - TRULY GRADUAL & READABLE
    
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
        // During scrolling - cursor in corner
        return { x: 100, y: 100 };
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
        await page.waitForDelay(500);
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
        const clickFrame = Math.floor(totalFrames * 0.176);         // Click at 4.4s
        const inputFocusFrame = Math.floor(totalFrames * 0.25);     // Focus input at 6.25s
        const typingStartFrame = Math.floor(totalFrames * 0.25);    // Start typing at 6.25s
        const typingEndFrame = Math.floor(totalFrames * 0.4);       // End typing at 10s
        const sendClickFrame = Math.floor(totalFrames * 0.476);     // Send at 11.9s
        const minimizeClickFrame = Math.floor(totalFrames * 0.56);  // Minimize at 14s
        const scrollStartFrame = Math.floor(totalFrames * 0.6);     // Scroll at 15s - AFTER MINIMIZE COMPLETES
        
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
                    console.log(`🖱️ PRESSED ENTER to send message at frame ${i} (${(i/fps).toFixed(1)}s)`);
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
                // EXTRA SLOW & READABLE: Very gradual scrolling over 14 seconds, guaranteed to reach 100%
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
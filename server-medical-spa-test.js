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

// **LUXURY SITE ANTI-GLITCH FIXES** - No HTML modifications, just stabilization
const applyWorkingFixesFunction = `
    function applyWorkingFixes() {
        console.log('🔧 Applying MINIMAL INTERFERENCE fixes for M.HTML...');
        
        // 1. ZERO CHATBOT LAYOUT INTERFERENCE - Let M.HTML chatbot work 100% naturally
        console.log('✅ No chatbot layout interference - M.HTML chatbot works naturally');
        
        // 2. ONLY DISABLE TEXT CURSOR BLINKING - No width/layout changes
        const style = document.createElement('style');
        style.textContent = \`
            /* ONLY disable text cursor blinking during video - no layout changes */
            #chatbot-input, .chatbot-input, #messageInput {
                caret-color: transparent !important;
            }
        \`;
        document.head.appendChild(style);
        console.log('✅ Text cursor blinking disabled only - no layout interference');
        
        // 3. ONLY disable floating animations that might cause glitching
        const floatingElements = document.querySelectorAll('.floating-circle:not([class*="chat"]):not([id*="chat"])');
        floatingElements.forEach(element => {
            element.style.setProperty('animation', 'none', 'important');
            element.style.setProperty('transform', 'none', 'important');
            element.style.setProperty('opacity', '0.1', 'important');
        });
        console.log('✅ Floating animations disabled (chatbot preserved)');
        
        console.log('🔧 Minimal fixes applied - M.HTML chatbot UI preserved!');
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
        // PROFESSIONAL DIAGNOSTIC: Find exact close button coordinates
        console.log('🔍 PROFESSIONAL DIAGNOSTIC: Finding exact close button position...');
        
        // Try multiple close button selectors
        const selectors = [
            '#chatbot-close',      
            '.chatbot-close',      
            '.chatbot-header button',
            '[aria-label="Close"]',
            '.close-button',
            '.chatbot-container .close',
            '.chatbot-container button[type="button"]'
        ];
        
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) {
                const rect = button.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                console.log('✅ FOUND close button at (' + x + ', ' + y + ') using: ' + selector);
                console.log('📐 Button dimensions: ' + rect.width + 'x' + rect.height);
                console.log('📍 Button bounds: left=' + rect.left + ', top=' + rect.top + ', right=' + rect.right + ', bottom=' + rect.bottom);
                return { x, y, element: button };
            }
        }
        
        // Fallback: Find any button in chatbot header
        const chatbotContainer = document.querySelector('.chatbot-container');
        if (chatbotContainer) {
            const buttons = chatbotContainer.querySelectorAll('button');
            console.log('🔍 Found ' + buttons.length + ' buttons in chatbot container');
            
            for (let i = 0; i < buttons.length; i++) {
                const button = buttons[i];
                const rect = button.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                console.log('🔘 Button ' + (i+1) + ' at (' + x + ', ' + y + ') - text: "' + button.textContent.trim() + '"');
                
                // Look for close button indicators
                if (button.textContent.includes('×') || button.textContent.includes('✕') || 
                    button.textContent.includes('Close') || button.innerHTML.includes('×')) {
                    console.log('✅ FOUND close button by content at (' + x + ', ' + y + ')');
                    return { x, y, element: button };
                }
            }
        }
        
        console.log('❌ No close button found - will use fallback coordinates');
        return null;
    }
    
    function clickChatbotButton() {
        console.log('🔍 DIAGNOSTIC: Attempting to click chatbot button...');
        
        // Check initial state
        const container = document.querySelector('.chatbot-container');
        if (container) {
            console.log('🔍 Container found, initial classes:', container.className);
            console.log('🔍 Container initial display:', getComputedStyle(container).display);
            console.log('🔍 Container initial visibility:', getComputedStyle(container).visibility);
        }
        
        const selectors = ['#chatbot-trigger', '.chatbot-trigger', '#chatToggle', '.chat-toggle'];
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) {
                console.log('🔍 Found button with selector:', selector);
                console.log('🔍 Button text:', button.textContent.trim());
                console.log('🔍 Button style display:', getComputedStyle(button).display);
                
                // Click the button
                button.click();
                console.log('✅ Chatbot button clicked using: ' + selector);
                
                // Check state after click
                setTimeout(() => {
                    if (container) {
                        console.log('🔍 Container after click, classes:', container.className);
                        console.log('🔍 Container after click display:', getComputedStyle(container).display);
                        console.log('🔍 Container after click visibility:', getComputedStyle(container).visibility);
                        console.log('🔍 Container has active class:', container.classList.contains('active'));
                    }
                }, 100);
                
                return true;
            }
        }
        console.log('❌ No chatbot button found with any selector');
        return false;
    }
    
    function clickInputField() {
        console.log('🔍 DIAGNOSTIC: Attempting to click input field...');
        const selectors = ['#chatbot-input', '.chatbot-input', '#messageInput'];
        for (const selector of selectors) {
            const input = document.querySelector(selector);
            if (input) {
                console.log('🔍 Found input with selector:', selector);
                console.log('🔍 Input visible:', getComputedStyle(input).display !== 'none');
                
                input.click();
                input.focus();
                console.log('✅ Input field clicked and focused using: ' + selector);
                return true;
            }
        }
        console.log('❌ No input field found');
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
    
    function clickSendButton(niche) {
        // Medical spa niche has no send button - use Enter key directly
        if (niche === 'medical_spa' || niche === 'medical' || niche === 'spa') {
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
                    console.log('✅ Enter pressed to send message (medspa has no send button) using: ' + selector);
                    return true;
                }
            }
            return false;
        }
        
        // Other niches: Try clicking existing send button first
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
        console.log('🔍 PROFESSIONAL: Attempting to close chatbot for marketing video...');
        
        // Get actual close button coordinates
        const minimizeInfo = findMinimizeButton();
        if (minimizeInfo) {
            console.log('🎯 PROFESSIONAL: Using detected close button at (' + minimizeInfo.x + ', ' + minimizeInfo.y + ')');
            minimizeInfo.element.click();
            console.log('✅ PROFESSIONAL: Close button clicked successfully');
        }
        
        // Ensure chatbot is closed for clean marketing video
        const container = document.querySelector('.chatbot-container');
        if (container) {
            container.classList.remove('active');
            console.log('✅ PROFESSIONAL: Chatbot closed for clean marketing video');
            return true;
        }
        
        console.log('❌ PROFESSIONAL: Could not close chatbot');
        return false;
    }
`;

// **STEP 5 CURSOR POSITIONING** - EXACT COORDINATES from diagnostic script
function getCursorPositionForFrame(frameIndex, totalFrames) {
    // EXACT COORDINATES from screenshot analysis
    const startPosition = { x: 200, y: 200 };
    const chatbotPosition = { x: 1860, y: 1020 };    // EXACT: Chatbot trigger button 
    const inputPosition = { x: 1715, y: 935 };       // EXACT: Input field center
    const sendPosition = { x: 1715, y: 935 };        // EXACT: No send button - use Enter at input position
    const minimizePosition = { x: 1862, y: 545 };    // EXACT: Close "×" button position
    
    // **PROFESSIONAL TIMING** - 30 seconds marketing video with immediate send
    const moveToButtonEnd = 0.15;      // 0-15%: Move to chatbot (0-4.5s)
    const clickPause = 0.176;          // 15-17.6%: Click button (4.5-5.28s)
    const moveToInputEnd = 0.25;       // 17.6-25%: Move to input (5.28-7.5s)
    const typingEnd = 0.4;             // 25-40%: Typing (7.5-12s) - SMOOTH cursor during typing
    const moveToSendEnd = 0.41;        // 40-41%: Move to send (12-12.3s) - FASTER
    const sendPause = 0.42;            // 41-42%: Send message (12.3-12.6s) - IMMEDIATE
    const moveToMinimizeEnd = 0.56;    // 50-56%: Move to minimize (15-16.8s)
    const minimizePause = 0.58;        // 56-58%: Minimize click (16.8-17.4s)
    // 60-100%: Scrolling phase (18-30s)
    
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
        // **PROFESSIONAL FIX**: Keep cursor at input position during typing - no jumping!
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

        // Load the m.html website (complete n8n generated HTML)
        const websiteContent = fs.readFileSync(path.join(__dirname, 'm.html'), 'utf8');
        await page.setContent(websiteContent);

        const fps = 60;
        const duration = 30; // 30 seconds: fast interaction + slow scrolling
        const totalFrames = fps * duration;
        
        console.log(`🎬 Generating ${totalFrames} frames...`);
        console.log(`📐 Step 5: COMPLETE SITE TOUR - FIXED VERSION (30 seconds)`);
        
        // Wait for content to load - MINIMAL wait to prevent hero glitching
        await delay(500);
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
        
        // **FIXED TIMING SYSTEM** - Immediate send after typing
        const clickFrame = Math.floor(totalFrames * 0.176);         // Click at 5.28s
        const inputFocusFrame = Math.floor(totalFrames * 0.25);     // Focus input at 7.5s
        const typingStartFrame = Math.floor(totalFrames * 0.25);    // Start typing at 7.5s
        const typingEndFrame = Math.floor(totalFrames * 0.4);       // End typing at 12s
        const sendClickFrame = Math.floor(totalFrames * 0.42);      // FIXED: Send immediately at 12.6s (was 14.28s)
        const minimizeClickFrame = Math.floor(totalFrames * 0.56);  // Minimize at 16.8s
        const scrollStartFrame = Math.floor(totalFrames * 0.6);     // Scroll at 18s - AFTER MINIMIZE COMPLETES
        
        const message = "I want to book a Botox treatment"; // 32 characters - ensure input is wide enough
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
                    
                    // **CRITICAL FIX**: Wait longer for chatbot to fully appear
                    await delay(1000); // Increased wait time
                    
                    // **ENSURE CHATBOT IS VISIBLE**: Force active state if needed
                    await page.evaluate(() => {
                        const container = document.querySelector('.chatbot-container');
                        if (container && !container.classList.contains('active')) {
                            console.log('🔧 FORCE: Adding active class to chatbot container');
                            container.classList.add('active');
                        }
                        
                        // Diagnostic logging in video
                        if (container) {
                            console.log('📊 Chatbot state - Classes:', container.className);
                            console.log('📊 Chatbot state - Display:', getComputedStyle(container).display);
                            console.log('📊 Chatbot state - Has active:', container.classList.contains('active'));
                        }
                        
                        if (typeof applyWorkingFixes === 'function') {
                            applyWorkingFixes();
                        } else {
                            console.log('❌ applyWorkingFixes function not found');
                        }
                    });
                    console.log('🔧 Applied fixes and verified chatbot visibility');
                    await delay(500); // Additional settling time
                }
                
                if (i === inputFocusFrame) {
                    await page.evaluate(() => clickInputField());
                    console.log(`🖱️ FOCUSED input field at frame ${i} (${(i/fps).toFixed(1)}s)`);
                }
                
                // Handle typing - FIXED to include last character
                if (i >= typingStartFrame && i < typingEndFrame) {
                    const typingFrames = typingEndFrame - typingStartFrame;
                    const currentProgress = (i - typingStartFrame) / typingFrames;
                    // FIXED: Use Math.ceil to ensure last character is included
                    const charactersToShow = Math.ceil(currentProgress * message.length);
                    
                    if (charactersToShow > typingProgress) {
                        const textToShow = message.substring(0, charactersToShow);
                        await page.evaluate((text) => typeInInput(text), textToShow);
                        
                        typingProgress = charactersToShow;
                        console.log(`📝 Typing progress: "${textToShow}" (${charactersToShow}/${message.length} chars)`);
                    }
                }
                
                if (i === sendClickFrame) {
                    await page.evaluate((niche) => clickSendButton(niche), niche);
                    console.log(`🖱️ SEND MESSAGE at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    await delay(300);
                }
                
                // **FIXED MINIMIZE CLICKING** - Use dynamic coordinates
                if (i === minimizeClickFrame && !chatbotMinimized) {
                    await page.evaluate(() => clickMinimizeButton());
                    console.log(`🖱️ MINIMIZED chatbot at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    chatbotMinimized = true;
                    await delay(500);
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
                // EXTRA SLOW & READABLE: Very gradual scrolling over 12 seconds, guaranteed to reach 100%
                const slowProgress = Math.min(scrollProgress * 1.05, 1.0); // Very slow pace but reaches 100%
                const scrollY = Math.round(slowProgress * maxScroll); // Full 100% scroll guaranteed
                
                // **FIXED: Add bounds checking to prevent Sharp extraction errors**
                const fullPageImage = sharp(fullPageBuffer);
                const { width: fullWidth, height: fullHeight } = await fullPageImage.metadata();
                
                // Ensure extraction stays within bounds
                const safeScrollY = Math.min(scrollY, Math.max(0, fullHeight - 1080));
                const extractHeight = Math.min(1080, fullHeight - safeScrollY);
                
                // Crop full page screenshot to simulate smooth scrolling with bounds checking
                frameBuffer = await fullPageImage
                    .extract({ 
                        left: 0, 
                        top: safeScrollY, 
                        width: 1920, 
                        height: extractHeight 
                    })
                    .resize(1920, 1080, { 
                        fit: 'contain',
                        background: { r: 253, g: 248, b: 251, alpha: 1 } // Background color
                    })
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
        console.log(`🔧 FIXES: EXACT coordinates from diagnostic (1860,1020) → (1715,935) → (1862,545)`);
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
    console.log('║  ✨ HTML: m.html (Complete n8n Generated)        ║');
    console.log('║  💬 Question: "I want to book a Botox treatment" ║');
    console.log('║  📝 POST /generate-video - Generate video          ║');
    console.log('║  ❤️  GET  /health - Health check                   ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Lux Test","niche":"luxury"}'`);
}); 
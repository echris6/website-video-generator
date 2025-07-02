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

// **HVAC ANTI-GLITCH FIXES** - Professional site stabilization
const applyHVACFixesFunction = `
    function applyHVACFixes() {
        console.log('🔧 Applying HVAC PROFESSIONAL anti-glitch fixes...');
        
        // 1. ELIMINATE FLOATING BLUEPRINT ANIMATIONS
        const floatingElements = document.querySelectorAll('.floating-blueprint');
        floatingElements.forEach(element => {
            element.style.setProperty('animation', 'none', 'important');
            element.style.setProperty('transform', 'none', 'important');
            element.style.setProperty('opacity', '0.01', 'important');
        });
        console.log('✅ Blueprint animations disabled - professional stability!');
        
        // 2. NUCLEAR ANIMATION ELIMINATION - STOP ALL GLITCHING
        const style = document.createElement('style');
        style.innerHTML = \`
            /* KILL ALL ANIMATIONS AND TRANSITIONS */
            *, *::before, *::after {
                animation: none !important;
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                animation-iteration-count: 0 !important;
                transition: none !important;
                transition-duration: 0s !important;
                transform: none !important;
                caret-color: transparent !important;
            }
            
            /* SPECIFIC HVAC GLITCH FIXES */
            .floating-blueprint {
                animation: none !important;
                transform: none !important;
                opacity: 0 !important;
            }
            .emergency-banner {
                animation: none !important;
                transform: translateY(0) !important;
                position: static !important;
            }
            .emergency-badge {
                animation: none !important;
            }
            .premium-preloader {
                display: none !important;
            }
            .hvac-spinner {
                animation: none !important;
            }
            
            /* DISABLE ALL REVEAL ANIMATIONS */
            .reveal-element, .reveal-left, .reveal-right {
                animation: none !important;
                transition: none !important;
                opacity: 1 !important;
                transform: none !important;
            }
            
            /* KILL ALL HERO SECTION GLITCHING */
            .stat-number, .counter-number, .stat-item, .hero-stats {
                animation: none !important;
                transition: none !important;
                transform: none !important;
            }
            
            /* KILL HERO BADGES ANIMATIONS */
            .hero-badges, .hero-badge, .emergency-badge {
                animation: none !important;
                transition: none !important;
                transform: none !important;
            }
            
            /* KILL SERVICE CARD SHIMMER AND HOVER EFFECTS */
            .service-card, .service-card::before, .service-card::after {
                animation: none !important;
                transition: none !important;
                transform: none !important;
                opacity: 1 !important;
            }
            
            /* KILL ALL HOVER EFFECTS */
            *:hover, *:focus {
                animation: none !important;
                transition: none !important;
                transform: none !important;
            }
            
            /* INPUT STABILITY */
            #hvacMessageInput, #hvacMessageInput:focus {
                caret-color: transparent !important;
                transition: none !important;
            }
        \`;
        document.head.appendChild(style);
        console.log('✅ All animations & cursor blinking disabled - professional ready!');
        
        // 3. NO UI CHANGES - Just ensure input works without altering appearance
        const hvacInput = document.querySelector('#hvacMessageInput');
        if (hvacInput) {
            // NO visual changes - just ensure it's functional
            console.log('✅ HVAC input field found and ready (no UI changes)');
        } else {
            console.log('❌ HVAC input field not found');
        }
        
        console.log('🔧 HVAC professional fixes applied - Emergency ready!');
    }
`;

// **HVAC CHATBOT FUNCTIONS** - Emergency-focused interactions
const hvacChatbotFunctions = `
    function findHVACChatButton() {
        const selectors = ['#hvacChatToggle', '.hvac-chat-toggle'];
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) {
                const rect = button.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                console.log('✅ HVAC chat button found at (' + x + ', ' + y + ') using: ' + selector);
                return { x, y, element: button };
            }
        }
        console.log('❌ HVAC chat button not found');
        return null;
    }
    
    function findHVACMinimizeButton() {
        const selectors = ['#hvacChatMinimize', '.hvac-chat-minimize'];
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) {
                const rect = button.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                console.log('✅ HVAC minimize button found at (' + x + ', ' + y + ') using: ' + selector);
                return { x, y, element: button };
            }
        }
        console.log('❌ HVAC minimize button not found');
        return null;
    }
    
    function clickHVACChatButton() {
        const selectors = ['#hvacChatToggle', '.hvac-chat-toggle'];
        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) {
                button.click();
                console.log('✅ HVAC chat button clicked using: ' + selector);
                return true;
            }
        }
        return false;
    }
    
    function clickHVACInputField() {
        const selectors = ['#hvacMessageInput', '.hvac-message-input'];
        for (const selector of selectors) {
            const input = document.querySelector(selector);
            if (input) {
                input.click();
                input.focus();
                console.log('✅ HVAC input field clicked and focused using: ' + selector);
                return true;
            }
        }
        return false;
    }
    
    function typeInHVACInput(text) {
        const selectors = ['#hvacMessageInput', '.hvac-message-input'];
        for (const selector of selectors) {
            const input = document.querySelector(selector);
            if (input) {
                input.value = text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('✅ HVAC typed: "' + text + '" using: ' + selector);
                return true;
            }
        }
        return false;
    }
    
    function clickHVACSendButton() {
        const sendSelectors = ['#hvacSendButton', '.hvac-send-button'];
        for (const selector of sendSelectors) {
            const button = document.querySelector(selector);
            if (button) {
                button.click();
                console.log('✅ HVAC send button clicked using: ' + selector);
                return true;
            }
        }
        
        // Fallback: Enter key
        const inputSelectors = ['#hvacMessageInput', '.hvac-message-input'];
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
                console.log('✅ HVAC Enter pressed to send using: ' + selector);
                return true;
            }
        }
        return false;
    }
    
    function clickHVACMinimizeButton() {
        const minimize = findHVACMinimizeButton();
        if (minimize && minimize.element) {
            minimize.element.click();
            console.log('✅ HVAC minimize button clicked');
            return true;
        }
        
        // Fallback: toggle chat closed
        const selectors = ['#hvacChatToggle', '.hvac-chat-toggle'];
        for (const selector of selectors) {
            const toggle = document.querySelector(selector);
            if (toggle) {
                toggle.click();
                console.log('✅ HVAC chat toggled closed as fallback using: ' + selector);
                return true;
            }
        }
        
        console.log('❌ Could not minimize HVAC chatbot');
        return false;
    }
`;

// **HVAC STEP 5 CURSOR POSITIONING** - Emergency service demo
function getHVACCursorPositionForFrame(frameIndex, totalFrames) {
    // HVAC-specific coordinates for professional emergency service demo
    const startPosition = { x: 200, y: 200 };
    const chatbotPosition = { x: 1858, y: 1018 };    // HVAC chat button
    const inputPosition = { x: 1636, y: 934 };      // Input field  
    const sendPosition = { x: 1835, y: 934 };       // Send button
    const minimizePosition = { x: 1854, y: 562 };   // Minimize button
    
    // **HVAC EMERGENCY TIMING** - 30 seconds professional demo (first 15s same speed, scrolling slower)
    const moveToButtonEnd = 0.125;     // 0-12.5%: Move to chat (0-3.75s) - SAME TIMING
    const clickPause = 0.147;          // 12.5-14.7%: Click button (3.75-4.4s) - SAME TIMING
    const moveToInputEnd = 0.208;      // 14.7-20.8%: Move to input (4.4-6.25s) - SAME TIMING
    const typingEnd = 0.333;           // 20.8-33.3%: Typing emergency message (6.25-10s) - SAME TIMING
    const moveToSendEnd = 0.397;       // 33.3-39.7%: Move to send (10-11.9s) - SAME TIMING
    const sendPause = 0.417;           // 39.7-41.7%: Send message (11.9-12.5s) - SAME TIMING
    const moveToMinimizeEnd = 0.467;   // 41.7-46.7%: SLOW SMOOTH movement to minimize (12.5-14s) - SAME TIMING
    const minimizePause = 0.483;       // 46.7-48.3%: Minimize click (14-14.5s) - SAME TIMING
    // 50-100%: Professional site tour (15-30s) - SLOWER & MORE READABLE SCROLLING
    
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
        // During professional site tour - cursor stays at minimize position
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

async function generateHVACVideo(businessName, niche, htmlContent) {
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

        // Load the HVAC professional website  
        const websiteContent = htmlContent || fs.readFileSync(path.join(__dirname, 'hvac1.html'), 'utf8');
        await page.setContent(websiteContent);

        const fps = 60;
        const duration = 30; // 30 seconds professional demo - extended for slower scrolling
        const totalFrames = fps * duration;
        
        console.log(`🎬 Generating ${totalFrames} frames for HVAC professional demo...`);
        console.log(`🚨 HVAC Emergency Service Demo - 30s with SLOWER scrolling (15s chatbot + 15s scroll)`);
        
        // EXTENDED WAIT - Let all animations fully settle before recording  
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('⏳ HVAC site loading with extended wait - all animations should be settled...');
        
        // Inject HVAC functions and apply professional fixes IMMEDIATELY
        await page.evaluate(hvacChatbotFunctions);
        await page.evaluate(applyHVACFixesFunction);
        
        // Apply professional stability fixes from the start
        await page.evaluate(() => {
            if (typeof applyHVACFixes === 'function') {
                applyHVACFixes();
            }
        });
        console.log('🔧 HVAC professional fixes applied - Emergency ready!');
        
        // Reveal all professional content
        await page.evaluate(() => {
            const revealElements = document.querySelectorAll('.reveal-element, .reveal-left, .reveal-right');
            revealElements.forEach(element => {
                element.classList.add('revealed');
            });
        });
        
        // ULTRA-AGGRESSIVE GLITCH ELIMINATION - TARGET SPECIFIC PROBLEM ELEMENTS
        await page.evaluate(() => {
            console.log('🔥 APPLYING ULTRA-AGGRESSIVE ANTI-GLITCH FIXES...');
            
            // 1. KILL ALL ANIMATIONS ON ALL ELEMENTS
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                el.style.animation = 'none';
                el.style.transition = 'none';
                el.style.transform = 'none';
                el.style.animationDuration = '0s';
                el.style.transitionDuration = '0s';
            });
            
                         // 2. ULTRA-TARGET HERO SECTION GLITCHING ELEMENTS
             const heroStats = document.querySelectorAll('.stat-number, .counter-number, .stat-item, .hero-stats, .hero-badge, .stat-value, .hero-stats span, .hero-stats div');
             heroStats.forEach(el => {
                 el.style.animation = 'none';
                 el.style.transition = 'none';
                 el.style.transform = 'none';
                 el.style.animationIterationCount = '0';
                 el.style.animationDuration = '0s';
                 // Force counters to final value immediately
                 if (el.hasAttribute('data-count')) {
                     el.textContent = el.getAttribute('data-count');
                 }
                 // Also check for text content that looks like numbers
                 if (el.textContent && /^\d+/.test(el.textContent)) {
                     const number = el.textContent.match(/\d+/)[0];
                     el.textContent = el.textContent.replace(/\d+/, number);
                 }
             });
             
             // KILL ALL COUNTER-RELATED JAVASCRIPT
             if (window.counterObserver) {
                 window.counterObserver.disconnect();
             }
            
            // 3. KILL HERO BADGES ANIMATIONS
            const heroBadges = document.querySelectorAll('.hero-badges, .hero-badge, .emergency-badge');
            heroBadges.forEach(el => {
                el.style.animation = 'none';
                el.style.transition = 'none';
                el.style.transform = 'none';
            });
            
            // 4. ELIMINATE SERVICE CARD SHIMMER EFFECTS
            const serviceCards = document.querySelectorAll('.service-card');
            serviceCards.forEach(el => {
                el.style.animation = 'none';
                el.style.transition = 'none';
                el.style.transform = 'none';
                // Remove pseudo-element animations
                const style = document.createElement('style');
                style.innerHTML = '.service-card::before, .service-card::after { display: none !important; }';
                document.head.appendChild(style);
            });
            
            // 5. FORCE PRELOADER TO BE GONE
            const preloader = document.querySelector('.premium-preloader');
            if (preloader) preloader.style.display = 'none';
            
            // 6. FORCE EMERGENCY BANNER TO FINAL POSITION
            const banner = document.querySelector('.emergency-banner');
            if (banner) {
                banner.style.transform = 'translateY(0)';
                banner.style.position = 'static';
                banner.style.animation = 'none';
            }
            
                         // 7. DISABLE ALL INTERSECTION OBSERVERS AND COUNTER ANIMATIONS
             if (window.IntersectionObserver) {
                 const originalObserver = window.IntersectionObserver;
                 window.IntersectionObserver = function() { return { observe: () => {}, disconnect: () => {} }; };
             }
             
             // 8. KILL ANY RUNNING COUNTER ANIMATION INTERVALS
             for (let i = 1; i < 99999; i++) {
                 window.clearInterval(i);
                 window.clearTimeout(i);
             }
             
             // 9. FORCE ALL COUNTERS TO STATIC VALUES
             const allCounters = document.querySelectorAll('[data-count]');
             allCounters.forEach(counter => {
                 const targetValue = counter.getAttribute('data-count');
                 counter.textContent = targetValue;
                 counter.style.animation = 'none';
                 counter.style.transition = 'none';
             });
            
            console.log('✅ ULTRA-AGGRESSIVE FIXES APPLIED - HERO SECTION SHOULD BE STABLE!');
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ HVAC site completely stabilized - NO MORE GLITCHING!');
        
        // **FIX BLACK SCREEN**: Take initial screenshot to ensure content is ready
        console.log('📸 Capturing initial stable frame to prevent black screen...');
        const initialFrame = await page.screenshot({ 
            type: 'png',
            clip: { x: 0, y: 0, width: 1920, height: 1080 }
        });
        console.log('✅ Initial frame captured - content is ready!');
        
        // Get page dimensions for professional tour
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        const viewportHeight = 1080;
        const maxScroll = Math.max(0, pageHeight - viewportHeight);
        
        console.log(`📏 HVAC Page height: ${pageHeight}px`);
        console.log(`📏 Professional tour scroll: ${maxScroll}px`);
        
        // Create frames directory
        const framesDir = path.join(__dirname, 'frames');
        if (!fs.existsSync(framesDir)) {
            fs.mkdirSync(framesDir);
        }
        
        // **HVAC PROFESSIONAL TIMING SYSTEM** - Updated for 30s duration with initial static period
        const staticFrames = 60; // 1 second of static content to prevent black screen
        const adjustedTotalFrames = totalFrames - staticFrames;
        
        const clickFrame = staticFrames + Math.floor(adjustedTotalFrames * 0.147);         // Click at 5.4s (was 4.4s)
        const inputFocusFrame = staticFrames + Math.floor(adjustedTotalFrames * 0.208);    // Focus input at 7.25s (was 6.25s)
        const typingStartFrame = staticFrames + Math.floor(adjustedTotalFrames * 0.208);   // Start typing at 7.25s (was 6.25s)
        const typingEndFrame = staticFrames + Math.floor(adjustedTotalFrames * 0.333);     // End typing at 11s (was 10s)
        const sendClickFrame = staticFrames + Math.floor(adjustedTotalFrames * 0.397);     // Send at 12.9s (was 11.9s)
        const minimizeClickFrame = staticFrames + Math.floor(adjustedTotalFrames * 0.467); // Minimize at 15s (was 14s)
        const scrollStartFrame = staticFrames + Math.floor(adjustedTotalFrames * 0.5);     // Professional tour at 16s (was 15s)
        
        // HVAC Emergency Message - proper sentence that will display fully
        const emergencyMessage = "I need HVAC repair service";
        let chatbotOpened = false;
        let chatbotMinimized = false;
        let typingProgress = 0;
        let fullPageBuffer = null;
        
        // Generate professional HVAC demo frames
        for (let i = 0; i < totalFrames; i++) {
            let frameBuffer;
            
            if (i < staticFrames) {
                // **STATIC INTRO PERIOD**: Show stable initial content for 1 second
                frameBuffer = initialFrame;
                
            } else if (i < scrollStartFrame) {
                // **EMERGENCY INTERACTION PHASE**: Professional chatbot demo
                
                // Handle emergency chatbot interaction
                if (i === clickFrame && !chatbotOpened) {
                    await page.evaluate(() => clickHVACChatButton());
                    console.log(`🚨 CLICKED HVAC emergency chat at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    chatbotOpened = true;
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Give chatbot time to fully open and settle
                    console.log('✅ Chatbot opened - proceeding with original design intact');
                }
                
                if (i === inputFocusFrame) {
                    await page.evaluate(() => clickHVACInputField());
                    console.log(`🖱️ FOCUSED HVAC emergency input at frame ${i} (${(i/fps).toFixed(1)}s)`);
                }
                
                // Handle emergency message typing with visual fix - FIXED: Show all characters
                if (i >= typingStartFrame && i < typingEndFrame) {
                    const typingFrames = typingEndFrame - typingStartFrame;
                    const currentProgress = (i - typingStartFrame) / typingFrames;
                    // FIXED: Use Math.ceil to ensure all characters are shown, especially the last one
                    const charactersToShow = Math.min(Math.ceil(currentProgress * emergencyMessage.length), emergencyMessage.length);
                    
                    if (charactersToShow > typingProgress) {
                        const textToShow = emergencyMessage.substring(0, charactersToShow);
                        await page.evaluate((text) => {
                            // Use a more reliable typing method
                            const input = document.querySelector('#hvacMessageInput');
                            if (input) {
                                // Clear and set value directly
                                input.value = text;
                                // Trigger all necessary events
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                                // Ensure cursor is at the end
                                input.setSelectionRange(text.length, text.length);
                                // Force the input to show the end of the text
                                input.scrollLeft = input.scrollWidth;
                            }
                        }, textToShow);
                        
                        typingProgress = charactersToShow;
                    }
                }
                
                if (i === sendClickFrame) {
                    await page.evaluate(() => clickHVACSendButton());
                    console.log(`🚨 SENT emergency message at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
                // Professional minimize
                if (i === minimizeClickFrame && !chatbotMinimized) {
                    await page.evaluate(() => clickHVACMinimizeButton());
                    console.log(`🖱️ MINIMIZED HVAC chat at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    chatbotMinimized = true;
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                frameBuffer = await page.screenshot({ 
                    type: 'png',
                    clip: { x: 0, y: 0, width: 1920, height: 1080 }
                });
                
            } else {
                // **PROFESSIONAL SITE TOUR PHASE**: Complete HVAC showcase
                
                if (!fullPageBuffer) {
                    console.log('📸 Taking professional HVAC site screenshot...');
                    
                    // **ENSURE ALL PROFESSIONAL CONTENT IS LOADED**
                    await page.evaluate(() => {
                        // Force reveal all professional elements
                        const revealElements = document.querySelectorAll('.reveal-element, .reveal-left, .reveal-right');
                        revealElements.forEach(element => {
                            element.classList.add('revealed');
                            element.style.opacity = '1';
                            element.style.transform = 'none';
                            element.style.visibility = 'visible';
                        });
                        
                        // Force professional sections to be visible
                        const sections = document.querySelectorAll('section');
                        sections.forEach(section => {
                            section.style.opacity = '1';
                            section.style.visibility = 'visible';
                        });
                        
                        // Professional positioning
                        window.scrollTo(0, 0);
                    });
                    
                    // Professional content rendering time
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Professional full page screenshot
                    fullPageBuffer = await page.screenshot({ 
                        fullPage: true,
                        type: 'png'
                    });
                    console.log('📸 Professional HVAC site tour captured');
                }
                
                const scrollProgress = (i - scrollStartFrame) / (totalFrames - scrollStartFrame);
                // TRULY GRADUAL SPEED: Slow and readable throughout, reaches 100%
                const slowProgress = Math.min(scrollProgress * 1.18, 1.0); // Slow pace but reaches 100%
                const scrollY = Math.round(slowProgress * maxScroll); // Full 100% scroll guaranteed
                
                // Professional site tour cropping
                frameBuffer = await sharp(fullPageBuffer)
                    .extract({ left: 0, top: scrollY, width: 1920, height: 1080 })
                    .png()
                    .toBuffer();
            }
            
            // Add professional cursor overlay
            const cursorPos = getHVACCursorPositionForFrame(i, totalFrames);
            const frameWithCursor = await sharp(frameBuffer)
                .composite([{
                    input: cursorBuffer,
                    left: Math.round(cursorPos.x),
                    top: Math.round(cursorPos.y),
                    blend: 'over'
                }])
                .png()
                .toBuffer();
            
            // Save professional frame
            const framePath = path.join(framesDir, `frame_${i.toString().padStart(6, '0')}.png`);
            fs.writeFileSync(framePath, frameWithCursor);
            
            // Professional progress logging
            if ((i + 1) % Math.floor(totalFrames / 4) === 0) {
                const percentage = ((i + 1) / totalFrames * 100).toFixed(1);
                const timeSeconds = ((i + 1) / fps).toFixed(1);
                console.log(`  🎬 HVAC Frame ${i + 1}/${totalFrames} (${percentage}%) - ${timeSeconds}s`);
            }
        }
        
        console.log('✅ All HVAC professional frames captured!');
        
        // Create professional HVAC video - FIXED FFmpeg parameters with robust error handling
        console.log('🎬 Creating professional HVAC video...');
        const videoPath = path.join(__dirname, 'videos', `hvac_professional_${businessName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.mp4`);
        
        // **ROBUST ERROR HANDLING**: Ensure videos directory exists and is writable
        const videosDir = path.join(__dirname, 'videos');
        if (!fs.existsSync(videosDir)) {
            fs.mkdirSync(videosDir, { recursive: true });
        }
        
        // **RESOURCE MANAGEMENT**: Check available frames before FFmpeg
        const frameFiles = fs.readdirSync(framesDir).filter(f => f.startsWith('frame_'));
        console.log(`🔍 DEBUG: Found ${frameFiles.length} frames for encoding`);
        
        if (frameFiles.length !== totalFrames) {
            throw new Error(`Frame count mismatch: expected ${totalFrames}, found ${frameFiles.length}`);
        }
        
        // **PREVENT RACE CONDITIONS**: Use stricter FFmpeg parameters
        const ffmpegArgs = [
            '-y',                                    // Overwrite output
            '-framerate', fps.toString(),            // Input framerate
            '-i', path.join(framesDir, 'frame_%06d.png'), // Input pattern
            '-c:v', 'libx264',                      // Video codec
            '-pix_fmt', 'yuv420p',                  // Pixel format
            '-crf', '23',                           // Higher CRF for better compatibility (was 18)
            '-preset', 'fast',                      // Faster preset for GitHub Actions
            '-profile:v', 'baseline',               // Baseline profile for max compatibility
            '-level', '3.0',                        // Specific level for compatibility
            '-movflags', '+faststart',              // Fast start for web
            '-threads', '1',                        // Single thread to prevent resource conflicts
            videoPath
        ];
        
        console.log(`🔧 FFmpeg args: ${ffmpegArgs.join(' ')}`);
        
        const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env },
            cwd: __dirname
        });

        // **ENHANCED ERROR LOGGING**
        let stderrOutput = '';
        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();
            stderrOutput += output;
            
            const match = output.match(/frame=\s*(\d+)/);
            if (match) {
                const currentFrame = parseInt(match[1]);
                const percentage = (currentFrame / totalFrames * 100).toFixed(1);
                console.log(`  🎬 Professional encoding: ${percentage}%`);
            }
            
            // Log warnings and errors immediately
            if (output.includes('Error') || output.includes('failed')) {
                console.warn(`⚠️ FFmpeg warning: ${output.trim()}`);
            }
        });

        ffmpeg.stdout.on('data', (data) => {
            console.log(`FFmpeg stdout: ${data.toString()}`);
        });

        await new Promise((resolve, reject) => {
            // **TIMEOUT PROTECTION**: Prevent hanging
            const timeout = setTimeout(() => {
                console.error('❌ FFmpeg timeout - killing process');
                ffmpeg.kill('SIGKILL');
                reject(new Error('FFmpeg process timed out after 10 minutes'));
            }, 600000); // 10 minutes timeout
            
            ffmpeg.on('close', (code, signal) => {
                clearTimeout(timeout);
                
                console.log(`🔍 FFmpeg process closed with code: ${code}, signal: ${signal}`);
                
                if (code === 0) {
                    console.log('  ✅ Professional HVAC video encoding complete!');
                    resolve();
                } else {
                    console.error(`❌ FFmpeg failed with code ${code}`);
                    console.error(`🔍 Full stderr output: ${stderrOutput}`);
                    console.error(`🔍 Signal: ${signal}`);
                    
                    // **ENHANCED ERROR REPORTING**
                    const error = new Error(`FFmpeg exited with code ${code}`);
                    error.code = code;
                    error.signal = signal;
                    error.stderr = stderrOutput;
                    reject(error);
                }
            });
            
            ffmpeg.on('error', (err) => {
                clearTimeout(timeout);
                console.error(`❌ FFmpeg spawn error: ${err.message}`);
                reject(err);
            });
        });

        // Professional cleanup
        console.log('🧹 Cleaning up professional frames...');
        frameFiles.forEach(file => {
            fs.unlinkSync(path.join(framesDir, file));
        });

        const stats = fs.statSync(videoPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ HVAC SUCCESS! Video: ${path.basename(videoPath)} (${fileSizeInMB} MB)`);
        
        return {
            success: true,
            videoPath: path.basename(videoPath),
            fileSizeInMB: parseFloat(fileSizeInMB),
            duration: duration,
            fps: fps,
            frames: totalFrames,
            message: `HVAC emergency service demo: "${emergencyMessage}" (30s with slower scrolling, no black screen, no FFmpeg errors)`
        };

    } catch (error) {
        console.error('❌ HVAC video generation failed:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'HVAC Professional Demo', timestamp: new Date().toISOString() });
});

// HVAC video generation endpoint
app.post('/generate-video', async (req, res) => {
    try {
        const { businessName, niche, htmlContent } = req.body;
        
        console.log(`🚨 HVAC EMERGENCY SERVICE DEMO - CUSTOMIZED FOR YOUR BUSINESS`);
        console.log(`📋 Business: ${businessName}`);
        console.log(`🏢 Niche: HVAC Emergency Services`);
        console.log(`🔧 Features: 24/7 Service, Emergency Response, Licensed Technicians`);
        console.log(`🎬 Demo Flow: Emergency Chat → "I need HVAC repair service" → Slower Site Tour (30s total)`);
        console.log(`📄 HTML Content: ${htmlContent ? 'Custom business template loaded' : 'Using default template'}`);
        
        const result = await generateHVACVideo(businessName, niche, htmlContent);
        res.json(result);
        
    } catch (error) {
        console.error('❌ HVAC ERROR:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

const PORT = 3025;
app.listen(PORT, () => {
    console.log('✅ HVAC Cursor loaded:', path.join(__dirname, 'cursor.png'));
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║         HVAC PROFESSIONAL EMERGENCY SERVICE          ║');
    console.log(`║                Running on port ${PORT}                   ║`);
    console.log('║                                                      ║');
    console.log('║  🚨 HTML: hvac1.html (Professional HVAC)             ║');
    console.log('║  🔧 Emergency: "My AC isn\'t working"                 ║');
    console.log('║  📝 POST /generate-video - Generate professional demo ║');
    console.log('║  ❤️  GET  /health - Service health check              ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Professional HVAC","niche":"hvac"}'`);
}); 
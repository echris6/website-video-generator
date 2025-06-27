const express = require('express');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Universal delay function compatible with all Puppeteer versions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const PORT = 3005; // Different port for Step 2

app.use(express.json({ limit: '50mb' }));
app.use(express.static('videos'));

// Load the testttt.html file for our website template
const websiteTemplate = fs.readFileSync(path.join(__dirname, 'testttt.html'), 'utf8');

// 🖱️ CURSOR: Load cursor.png and convert to base64
const cursorPath = path.join(__dirname, 'cursor.png');
let cursorBase64 = '';
if (fs.existsSync(cursorPath)) {
    const cursorBuffer = fs.readFileSync(cursorPath);
    cursorBase64 = cursorBuffer.toString('base64');
    console.log(`✅ Cursor loaded: ${cursorPath}`);
} else {
    console.log(`⚠️ Cursor not found: ${cursorPath}`);
}

console.log(`
╔════════════════════════════════════════════════════╗
║           CHATBOT STEP 2 - CLICK & OPEN           ║
║              Running on port ${PORT}                    ║
║                                                    ║
║  🖱️ Step 2: Move cursor + Click + Open widget     ║
║  📝 POST /generate-video - Generate video          ║
║  ❤️  GET  /health - Health check                   ║
╚════════════════════════════════════════════════════╝
`);

// Simple business customization
const businessCustomizations = {
    real_estate: {
        businessName: "Luxury Properties Group",
        heroTitle: "Luxury Property Excellence",
        primaryColor: "#0a1929",
        secondaryColor: "#d4af37",
        backgroundColor: "#fdfdfd", 
        textColor: "#0a1929",
        accentColor: "#c9a96e"
    },
    medical: {
        businessName: "Elite Medical Spa",
        heroTitle: "Premium Wellness & Beauty",
        primaryColor: "#1a365d",
        secondaryColor: "#38b2ac",
        backgroundColor: "#f7fafc",
        textColor: "#2d3748", 
        accentColor: "#4fd1c7"
    },
    restaurant: {
        businessName: "Gourmet Bistro",
        heroTitle: "Culinary Excellence",
        primaryColor: "#744210",
        secondaryColor: "#d69e2e",
        backgroundColor: "#fffbf0",
        textColor: "#744210",
        accentColor: "#f6ad55"
    }
};

function customizeWebsite(niche, businessName) {
    const customization = businessCustomizations[niche] || businessCustomizations.real_estate;
    
    // Override business name if provided
    if (businessName) {
        customization.businessName = businessName;
    }
    
    let customizedHtml = websiteTemplate;
    
    // Apply customizations
    Object.entries(customization).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        customizedHtml = customizedHtml.replace(new RegExp(placeholder, 'g'), value);
    });
    
    // 🖱️ CURSOR: Add cursor overlay with chatbot targeting capability
    if (cursorBase64) {
        const cursorHtml = `
        <img id="animated-cursor" src="data:image/png;base64,${cursorBase64}" 
             style="position: fixed; top: 400px; left: 800px; z-index: 99999; height: 32px; pointer-events: none; transition: all 0.3s ease; image-rendering: crisp-edges;">
        <script>
        // Simple cursor movement functions
        window.moveCursorTo = function(x, y) {
            const cursor = document.getElementById('animated-cursor');
            if (cursor) {
                cursor.style.left = x + 'px';
                cursor.style.top = y + 'px';
            }
        };
        
        // Find chatbot button and record its position
        window.findChatbotButton = function() {
            const chatToggle = document.getElementById('chatToggle');
            if (chatToggle) {
                const rect = chatToggle.getBoundingClientRect();
                const scrollY = window.pageYOffset || document.documentElement.scrollTop;
                const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
                
                return {
                    found: true,
                    x: rect.left + scrollX + rect.width / 2,
                    y: rect.top + scrollY + rect.height / 2,
                    width: rect.width,
                    height: rect.height
                };
            }
            return { found: false };
        };
        
        // STEP 2: Click the chatbot button to open widget
        window.clickChatbotButton = function() {
            const chatToggle = document.getElementById('chatToggle');
            if (chatToggle) {
                chatToggle.click();
                return true;
            }
            return false;
        };
        
        // Check if chat widget is open
        window.isChatWidgetOpen = function() {
            const chatWidget = document.getElementById('chatWidget');
            return chatWidget && chatWidget.classList.contains('active');
        };
        
        // STEP 2: Enhanced cursor movement with clicking action
        window.updateCursorForFrame = function(frameIndex, totalFrames) {
            const progress = frameIndex / totalFrames;
            const chatbotInfo = window.findChatbotButton();
            
            if (chatbotInfo.found) {
                // Phase 1 (0-3 seconds): Brief pause at hero position
                if (progress < 0.1) { // 3/30 = 0.1
                    window.moveCursorTo(800, 400);
                }
                // Phase 2 (3-6 seconds): Quick movement to chatbot
                else if (progress < 0.2) { // 6/30 = 0.2
                    const moveProgress = (progress - 0.1) / 0.1; // 0 to 1 over 3 seconds
                    const startX = 800;
                    const startY = 400;
                    const endX = chatbotInfo.x;
                    const endY = chatbotInfo.y;
                    
                    // Add slight easing for more natural movement
                    const easedProgress = moveProgress < 0.5 
                        ? 2 * moveProgress * moveProgress 
                        : -1 + (4 - 2 * moveProgress) * moveProgress;
                    
                    const currentX = startX + (endX - startX) * easedProgress;
                    const currentY = startY + (endY - startY) * easedProgress;
                    
                    window.moveCursorTo(currentX, currentY);
                }
                // Phase 3 (6-8 seconds): Click at chatbot button
                else if (progress < 0.267) { // 8/30 = 0.267
                    window.moveCursorTo(chatbotInfo.x, chatbotInfo.y);
                    
                    // Click the button once when we reach this phase
                    const clickProgress = (progress - 0.2) / 0.067; // 0 to 1 over 2 seconds
                    if (clickProgress > 0.3 && clickProgress < 0.4 && !window.hasClicked) {
                        window.clickChatbotButton();
                        window.hasClicked = true;
                    }
                }
                // Phase 4 (8-30 seconds): Stay at chatbot with widget open
                else {
                    window.moveCursorTo(chatbotInfo.x, chatbotInfo.y);
                }
            } else {
                // Fallback: keep static cursor
                window.moveCursorTo(800, 400);
            }
        };
        
        // Reset click state for each video generation
        window.hasClicked = false;
        </script>
        `;
        customizedHtml = customizedHtml.replace('</body>', cursorHtml + '</body>');
    }
    
    return customizedHtml;
}

async function generateVideo(businessName, niche = 'real_estate') {
    const timestamp = Date.now();
    const videoFilename = `chatbot_step2_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
    const framesDir = path.join(__dirname, 'frames', `temp_${timestamp}`);
    
    console.log(`🎥 CHATBOT STEP 2 - CURSOR MOVEMENT + CLICKING`);
    console.log(`📋 Business: ${businessName}`);
    console.log(`🏢 Niche: ${niche}`);
    console.log(`🖱️ Cursor: Hero → Move to chatbot → Click → Widget opens`);
    
    let browser;
    
    try {
        // Create frames directory
        if (!fs.existsSync(framesDir)) {
            fs.mkdirSync(framesDir, { recursive: true });
        }
        
        console.log(`🚀 Launching browser...`);
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--max-old-space-size=4096',
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-component-extensions-with-background-pages',
                '--memory-pressure-off'
            ]
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log(`📄 Loading website content...`);
        let customizedHtml = customizeWebsite(niche, businessName);
        
        // 🔧 ENHANCED FIX: Disable ALL animations and stabilize hero section
        customizedHtml = customizedHtml.replace(
            '.reveal-element {',
            '.reveal-element { opacity: 1 !important; transform: translateY(0) !important; /* FIXED FOR PUPPETEER */'
        );
        
        // 🎯 HERO SECTION STABILIZATION: Disable floating animations and transitions
        const stabilizationCSS = `
        <style>
        /* DISABLE ALL ANIMATIONS FOR STABLE RECORDING */
        *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
        }
        
        /* STABILIZE FLOATING ELEMENTS */
        .floating-elements, .floating-square {
            display: none !important;
        }
        
        /* STABILIZE HERO SECTION */
        .hero::before, .hero::after {
            animation: none !important;
            transform: none !important;
        }
        
        /* STABILIZE PARALLAX EFFECTS */
        @keyframes parallaxFloat { 
            0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); } 
        }
        @keyframes architecturalFloat { 
            0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); } 
        }
        
        /* FORCE STABLE STATES */
        .hero, .hero-content, .property-showcase, .services, .contact {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        
        /* DISABLE CURSOR TRANSITION BUT ALLOW CHAT WIDGET TRANSITIONS */
        #animated-cursor {
            transition: none !important;
        }
        
        /* STABILIZE CHAT WIDGET UI - Disable ALL chat widget animations */
        .chat-widget, .chat-widget * {
            transition: none !important;
            animation: none !important;
            animation-duration: 0s !important;
            animation-delay: 0s !important;
        }
        
        /* FORCE STABLE CHAT WIDGET STATES */
        .chat-widget.active {
            transform: translateY(0) scale(1) !important;
            opacity: 1 !important;
            visibility: visible !important;
        }
        
        /* STABILIZE CHAT MESSAGES AND ELEMENTS */
        .message, .message-content, .chat-input, .chat-header {
            transition: none !important;
            animation: none !important;
        }
        
        /* DISABLE TYPING ANIMATIONS */
        .typing-indicator, .typing-dots, .dot {
            animation: none !important;
        }
        </style>
        `;
        customizedHtml = customizedHtml.replace('</head>', stabilizationCSS + '</head>');
        
        await page.setContent(customizedHtml, { waitUntil: 'networkidle0' });
        
        // ✅ ULTRA-STABLE LOADING - Ensure perfect hero section stability
        console.log(`⏳ Waiting for fonts and CSS to fully load...`);
        
        // Wait for fonts and images
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => {
            return Promise.all(
                Array.from(document.images)
                    .filter(img => !img.complete)
                    .map(img => new Promise(resolve => {
                        img.onload = img.onerror = resolve;
                    }))
            );
        });
        
        // Initial wait for basic loading
        await delay(2000);
        
        // Wait for content sections
        await page.waitForSelector('.hero', { visible: true, timeout: 5000 });
        await page.waitForSelector('.chat-container', { visible: true, timeout: 5000 });
        
        // 🎯 COMPREHENSIVE STABILIZATION
        await page.evaluate(() => {
            // Force reveal all elements
            const revealElements = document.querySelectorAll('.reveal-element');
            revealElements.forEach(element => {
                element.classList.add('revealed');
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
                element.style.transition = 'none';
            });
            
            // Force stable states on all major elements
            const heroElements = document.querySelectorAll('.hero, .hero-content, h1, p, .cta-button');
            heroElements.forEach(element => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
                element.style.transition = 'none';
                element.style.animation = 'none';
            });
            
            // Remove any floating animations
            const floatingElements = document.querySelectorAll('.floating-elements, .floating-square');
            floatingElements.forEach(element => {
                element.style.display = 'none';
            });
            
            // Ensure cursor is stable
            const cursor = document.getElementById('animated-cursor');
            if (cursor) {
                cursor.style.transition = 'none';
                cursor.style.left = '800px';
                cursor.style.top = '400px';
            }
            
            // Reset click state
            window.hasClicked = false;
            
            // STABILIZE CHAT WIDGET AFTER OPENING
            window.stabilizeChatWidget = function() {
                const chatWidget = document.getElementById('chatWidget');
                const chatToggle = document.getElementById('chatToggle');
                
                if (chatWidget) {
                    // Force stable visual state
                    chatWidget.style.transform = 'translateY(0) scale(1)';
                    chatWidget.style.opacity = '1';
                    chatWidget.style.visibility = 'visible';
                    chatWidget.style.transition = 'none';
                    chatWidget.style.animation = 'none';
                    
                    // Stabilize all child elements
                    const allElements = chatWidget.querySelectorAll('*');
                    allElements.forEach(element => {
                        element.style.transition = 'none';
                        element.style.animation = 'none';
                        element.style.animationDuration = '0s';
                        element.style.animationDelay = '0s';
                    });
                    
                    // Disable any blinking cursors or indicators
                    const typingIndicators = chatWidget.querySelectorAll('.typing-indicator, .typing-dots, .dot');
                    typingIndicators.forEach(indicator => {
                        indicator.style.animation = 'none';
                        indicator.style.display = 'none';
                    });
                }
                
                if (chatToggle) {
                    chatToggle.style.transition = 'none';
                    chatToggle.style.animation = 'none';
                }
            };
        });
        
        // Extended wait for complete stabilization
        await delay(4000);
        
        console.log(`🎯 Hero section stabilized and ready!`);
        
        // 🔍 STEP 1: Find the chatbot button and log its position
        const chatbotInfo = await page.evaluate(() => {
            return window.findChatbotButton();
        });
        
        if (chatbotInfo.found) {
            console.log(`✅ Chatbot button found at (${Math.round(chatbotInfo.x)}, ${Math.round(chatbotInfo.y)})`);
        } else {
            console.log(`⚠️ Chatbot button not found - using fallback`);
        }
        
        console.log(`✅ All content fully loaded and chatbot detected!`);
        
        // Get page dimensions
        const dimensions = await page.evaluate(() => {
            return {
                scrollHeight: Math.max(
                    document.body.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.clientHeight,
                    document.documentElement.scrollHeight,
                    document.documentElement.offsetHeight
                ),
                viewportHeight: window.innerHeight
            };
        });
        
        console.log(`📏 Page height: ${dimensions.scrollHeight}px`);
        console.log(`📏 Scrollable: ${dimensions.scrollHeight - dimensions.viewportHeight}px`);
        
        const totalFrames = 1800; // 30 seconds at 60fps
        const scrollableHeight = dimensions.scrollHeight - dimensions.viewportHeight;
        
        console.log(`🎬 Generating ${totalFrames} frames...`);
        console.log(`📐 Step 2: Cursor movement + clicking + widget opening`);
        
        // Generate frames with enhanced cursor interaction
        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            try {
                // Only update cursor position every 5 frames to reduce browser load
                if (frameIndex % 5 === 0) {
                    await page.evaluate((frameIdx, totalFrames) => {
                        window.updateCursorForFrame(frameIdx, totalFrames);
                    }, frameIndex, totalFrames);
                }
                
                // Only check/stabilize chat widget every 30 frames (0.5 seconds) to reduce load
                const progress = (frameIndex + 1) / totalFrames;
                if (progress > 0.267 && frameIndex % 30 === 0) {
                    const widgetOpen = await page.evaluate(() => {
                        if (window.isChatWidgetOpen && window.isChatWidgetOpen()) {
                            window.stabilizeChatWidget();
                            return true;
                        }
                        return false;
                    });
                }
                
                // Reduce delay to speed up processing
                await delay(5);
                
                // Take screenshot with timeout protection
                const framePath = path.join(framesDir, `frame_${String(frameIndex + 1).padStart(6, '0')}.png`);
                await Promise.race([
                    page.screenshot({
                        path: framePath,
                        type: 'png'
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Screenshot timeout')), 5000))
                ]);
                
                // Progress logging with phase information
                if ((frameIndex + 1) % 300 === 0 || frameIndex + 1 === totalFrames) {
                    const percentage = ((frameIndex + 1) / totalFrames * 100).toFixed(1);
                    const seconds = ((frameIndex + 1) / 60).toFixed(1);
                    
                    let phase = "Hero Position";
                    if (progress >= 0.1 && progress < 0.2) phase = "Moving to Chatbot";
                    else if (progress >= 0.2 && progress < 0.267) phase = "Clicking Chatbot";
                    else if (progress >= 0.267) phase = "Widget Open";
                    
                    console.log(`  📸 Frame ${frameIndex + 1}/${totalFrames} (${percentage}%) - ${seconds}s - ${phase}`);
                }
                
                // One-time widget opening check and stabilization
                if (progress > 0.25 && progress < 0.3 && frameIndex % 60 === 0) {
                    try {
                        const widgetOpen = await page.evaluate(() => {
                            return window.isChatWidgetOpen();
                        });
                        if (widgetOpen && !window.widgetStabilized) {
                            console.log(`🎉 Chat widget successfully opened!`);
                            await page.evaluate(() => {
                                window.stabilizeChatWidget();
                                window.widgetStabilized = true;
                            });
                            console.log(`🎯 Chat widget UI stabilized!`);
                        }
                    } catch (error) {
                        console.log(`⚠️ Widget check failed: ${error.message}`);
                    }
                }
                
                // Memory management every 300 frames
                if (frameIndex % 300 === 0 && frameIndex > 0) {
                    await page.evaluate(() => {
                        if (window.gc) {
                            window.gc();
                        }
                    });
                }
                
            } catch (error) {
                console.log(`⚠️ Error capturing frame ${frameIndex + 1}: ${error.message}`);
                // Continue with next frame instead of crashing
                continue;
            }
        }
        
        console.log(`✅ All frames captured with Step 2 interaction!`);
        
        // Create video
        console.log(`🎬 Creating video...`);
        const videoPath = path.join(__dirname, 'videos', videoFilename);
        
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(path.join(framesDir, 'frame_%06d.png'))
                .inputFPS(60)
                .videoCodec('libx264')
                .outputFPS(60)
                .videoBitrate('3000k')
                .outputOptions(['-crf 18', '-preset fast', '-pix_fmt yuv420p'])
                .output(videoPath)
                .on('progress', (progress) => {
                    if (progress.percent) {
                        console.log(`  🎬 Encoding: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', () => {
                    console.log(`  ✅ Video encoding complete!`);
                    resolve();
                })
                .on('error', reject)
                .run();
        });
        
        // Clean up frames
        console.log(`🧹 Cleaning up frames...`);
        fs.rmSync(framesDir, { recursive: true, force: true });
        
        // Get file size
        const stats = fs.statSync(videoPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ SUCCESS! Video: ${videoFilename} (${fileSizeMB} MB)`);
        
        return {
            success: true,
            filename: videoFilename,
            path: videoPath,
            size: fileSizeMB + ' MB',
            chatbotInfo,
            step: 2,
            description: "Cursor movement + chatbot clicking + widget opening"
        };
        
    } catch (error) {
        console.error(`❌ ERROR: ${error.message}`);
        
        // Clean up on error
        if (fs.existsSync(framesDir)) {
            fs.rmSync(framesDir, { recursive: true, force: true });
        }
        
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Routes
app.post('/generate-video', async (req, res) => {
    try {
        const { businessName = 'Step 2 Test', niche = 'real_estate' } = req.body;
        const result = await generateVideo(businessName, niche);
        res.json(result);
    } catch (error) {
        console.error('Video generation failed:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Route to preview the website
app.get('/', (req, res) => {
    const niche = req.query.niche || 'real_estate';
    const businessName = req.query.business || 'Luxury Properties Group';
    const customizedHtml = customizeWebsite(niche, businessName);
    res.send(customizedHtml);
});

app.get('/preview', (req, res) => {
    const niche = req.query.niche || 'real_estate';
    const businessName = req.query.business || 'Luxury Properties Group';
    const customizedHtml = customizeWebsite(niche, businessName);
    res.send(customizedHtml);
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/videos/:filename', (req, res) => {
    const filename = req.params.filename;
    const videoPath = path.join(__dirname, 'videos', filename);
    
    if (fs.existsSync(videoPath)) {
        res.download(videoPath);
    } else {
        res.status(404).json({ error: 'Video not found' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Step 2 Test","niche":"real_estate"}'`);
}); 
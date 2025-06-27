const express = require('express');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Universal delay function compatible with all Puppeteer versions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const PORT = 3008; // Different port for Step 4

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
║       CHATBOT STEP 4 - COMPLETE INTERACTION       ║
║              Running on port ${PORT}                    ║
║                                                    ║
║  🖱️ Step 4: Cursor → Click → Type → Send Message  ║
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
        
        // STEP 1: Find chatbot button and record its position
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
        
        // STEP 2: Click chatbot button and open widget
        window.clickChatbotButton = function() {
            const chatToggle = document.getElementById('chatToggle');
            const chatWidget = document.getElementById('chatWidget');
            
            if (chatToggle && chatWidget) {
                // Simulate click
                chatToggle.click();
                
                // Force widget to open (backup method)
                chatWidget.classList.add('active');
                chatToggle.classList.add('active');
                
                console.log('✅ Chatbot clicked and widget opened');
                return true;
            }
            console.log('⚠️ Chatbot elements not found');
            return false;
        };
        
        // Check if chat widget is open
        window.isChatWidgetOpen = function() {
            const chatWidget = document.getElementById('chatWidget');
            return chatWidget && chatWidget.classList.contains('active');
        };
        
        // Find chat input field position
        window.findChatInput = function() {
            const chatInput = document.getElementById('messageInput');
            if (chatInput) {
                const rect = chatInput.getBoundingClientRect();
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
        
        // STEP 3: Fast cursor movement + clicking + typing interaction
        window.updateCursorForFrame = function(frameIndex, totalFrames) {
            const progress = frameIndex / totalFrames;
            const chatbotInfo = window.findChatbotButton();
            const chatInputInfo = window.findChatInput();
            
            if (chatbotInfo.found) {
                // Phase 1 (0-2 seconds): FASTER movement to chatbot
                if (progress < 0.133) { // 0-2 seconds: Move faster to chatbot (2/15 = 0.133)
                    const moveProgress = progress / 0.133; // 0 to 1 over 2 seconds
                    const startX = 800;
                    const startY = 400;
                    const endX = chatbotInfo.x;
                    const endY = chatbotInfo.y;
                    
                    // Add slight easing for natural movement
                    const easedProgress = moveProgress < 0.5 
                        ? 2 * moveProgress * moveProgress 
                        : -1 + (4 - 2 * moveProgress) * moveProgress;
                    
                    const currentX = startX + (endX - startX) * easedProgress;
                    const currentY = startY + (endY - startY) * easedProgress;
                    
                    window.moveCursorTo(currentX, currentY);
                }
                // Phase 2 (2-3 seconds): Quick click chatbot button
                else if (progress < 0.2) { // 3/15 = 0.2
                    window.moveCursorTo(chatbotInfo.x, chatbotInfo.y);
                    
                    // Trigger click once at 2.5 seconds
                    if (progress >= 0.167 && progress < 0.187 && !window.hasClicked) {
                        window.clickChatbotButton();
                        window.hasClicked = true;
                    }
                }
                // Phase 3 (3-4 seconds): MUCH FASTER move to chat input field
                else if (progress < 0.267 && chatInputInfo.found) { // 4/15 = 0.267
                    const moveProgress = (progress - 0.2) / 0.067; // 0 to 1 over 1 second
                    const startX = chatbotInfo.x;
                    const startY = chatbotInfo.y;
                    const endX = chatInputInfo.x;
                    const endY = chatInputInfo.y;
                    
                    // Fast movement to input field
                    const easedProgress = moveProgress < 0.5 
                        ? 2 * moveProgress * moveProgress 
                        : -1 + (4 - 2 * moveProgress) * moveProgress;
                    
                    const currentX = startX + (endX - startX) * easedProgress;
                    const currentY = startY + (endY - startY) * easedProgress;
                    
                    window.moveCursorTo(currentX, currentY);
                }
                // Phase 4 (4-15 seconds): FASTER typing with line break
                else if (progress < 1.0 && chatInputInfo.found) { // 15/15 = 1.0
                    window.moveCursorTo(chatInputInfo.x, chatInputInfo.y);
                    
                    // Type message with line break - FIXED text wrapping
                    const message = "Hello! I'm interested in luxury\nproperties in Beverly Hills.";
                    const typingProgress = (progress - 0.267) / 0.733; // 0 to 1 over 11 seconds
                    const targetLength = Math.floor(typingProgress * message.length);
                    
                    if (targetLength > 0 && targetLength <= message.length) {
                        const currentText = message.substring(0, targetLength);
                        if (!window.lastTypedText || window.lastTypedText !== currentText) {
                            const chatInput = document.getElementById('messageInput');
                            if (chatInput) {
                                // Use actual line breaks for proper text wrapping
                                chatInput.value = currentText;
                                window.lastTypedText = currentText;
                            }
                        }
                    }
                }
                // Fallback: stay at chatbot
                else {
                    window.moveCursorTo(chatbotInfo.x, chatbotInfo.y);
                }
            } else {
                // Fallback: keep static cursor
                window.moveCursorTo(800, 400);
            }
        };
        
        // Initialize interaction states
        window.hasClicked = false;
        window.lastTypedText = '';
        </script>
        `;
        customizedHtml = customizedHtml.replace('</body>', cursorHtml + '</body>');
    }
    
    return customizedHtml;
}

async function generateVideo(businessName, niche = 'real_estate') {
    const timestamp = Date.now();
    const videoFilename = `chatbot_step4_complete_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
    const framesDir = path.join(__dirname, 'frames', `temp_${timestamp}`);
    
    console.log(`🎥 CHATBOT STEP 4 - COMPLETE INTERACTION`);
    console.log(`📋 Business: ${businessName}`);
    console.log(`🏢 Niche: ${niche}`);
    console.log(`🖱️ Cursor: Move (2s) → Click (2.5s) → Input (1s) → FAST Type "I want to buy a house" (2.5s) → Send (1.5s) - 9sec total`);
    
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
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-background-networking',
                '--memory-pressure-off',
                '--max_old_space_size=4096'
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
        
        /* DISABLE CURSOR TRANSITION */
        #animated-cursor {
            transition: none !important;
        }
        
        /* STABILIZE CHAT WIDGET - Key fix for smooth performance */
        .chat-widget, .chat-widget * {
            transition: none !important;
            animation: none !important;
        }
        
        .chat-widget.active {
            transform: translateY(0) scale(1) !important;
            opacity: 1 !important;
            visibility: visible !important;
        }
        
        /* Disable typing animations that cause glitches */
        .typing-indicator, .typing-dots, .dot {
            animation: none !important;
            display: none !important;
        }
        
        /* Stabilize message animations */
        .message, .message-content {
            animation: none !important;
            transition: none !important;
        }
        
        /* ✅ COMPLETE CURSOR & INPUT GLITCH FIX */
        /* Disable ALL text cursor blinking */
        input, textarea, [contenteditable] {
            caret-color: transparent !important;
            cursor: default !important;
            animation: none !important;
            transition: none !important;
        }
        
        /* Disable input focus animations and borders */
        input:focus, textarea:focus, [contenteditable]:focus {
            outline: none !important;
            border-color: rgba(26, 54, 93, 0.2) !important;
            box-shadow: none !important;
            transform: none !important;
            transition: none !important;
            animation: none !important;
        }
        
        /* Disable any remaining cursor animations */
        @keyframes blink, typing, cursor-blink {
            from, to { opacity: 1 !important; }
        }
        
        /* Force stable input states */
        .chat-input input, .form-group input, .form-group textarea {
            caret-color: transparent !important;
            animation: none !important;
            transition: none !important;
        }
        
        /* Remove any text selection animations */
        ::selection {
            background: rgba(212, 175, 55, 0.3) !important;
            animation: none !important;
        }
        
        /* Disable pseudo-element animations */
        *::before, *::after {
            animation: none !important;
            transition: none !important;
        }
        
        /* ✅ COMPLETE CHATBOT UI FIX - MAXIMUM SPECIFICITY */
        
        /* DRASTICALLY WIDEN CHAT WIDGET for "I want to buy a house" */
        .chat-widget#chatWidget,
        #chatWidget,
        .chat-widget {
            min-width: 450px !important;
            width: 450px !important;
            max-width: 450px !important;
        }
        
        /* COMPLETELY FIX INPUT FIELD - No more "hous" cutoff! */
        #messageInput,
        input#messageInput,
        .chat-input input {
            min-width: 360px !important;
            width: 360px !important;
            max-width: 360px !important;
            padding: 0.8rem 1rem !important;
            font-size: 0.95rem !important;
            text-overflow: clip !important;
            overflow: visible !important;
            white-space: nowrap !important;
            box-sizing: border-box !important;
            flex: none !important;
            background: rgba(255, 255, 255, 0.95) !important;
            border: 2px solid rgba(26, 54, 93, 0.2) !important;
            border-radius: 12px !important;
        }
        
        /* COMPLETELY FIX SEND BUTTON - No more icon cutoff! */
        #sendButton,
        button#sendButton,
        .chat-input button {
            width: 56px !important;
            height: 56px !important;
            min-width: 56px !important;
            min-height: 56px !important;
            max-width: 56px !important;
            max-height: 56px !important;
            padding: 10px !important;
            background: linear-gradient(135deg, var(--navy-blue) 0%, var(--navy-blue-light) 100%) !important;
            border: none !important;
            border-radius: 12px !important;
            color: white !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
            transition: none !important;
            overflow: visible !important;
        }
        
        /* FIX SVG ICON INSIDE SEND BUTTON - No more cutoff! */
        #sendButton svg,
        button#sendButton svg,
        .chat-input button svg {
            width: 26px !important;
            height: 26px !important;
            display: block !important;
            flex-shrink: 0 !important;
            overflow: visible !important;
        }
        
        /* PERFECT INPUT CONTAINER LAYOUT */
        .chat-input-container {
            padding: 1rem !important;
            border-top: 1px solid var(--glass-medium) !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }
        
        /* PERFECT CHAT INPUT FLEXBOX */
        .chat-input {
            display: flex !important;
            gap: 1rem !important;
            align-items: center !important;
            justify-content: flex-start !important;
            width: 100% !important;
            max-width: none !important;
            flex-wrap: nowrap !important;
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
        });
        
        // Extended wait for complete stabilization
        await delay(4000);
        
        console.log(`🎯 Hero section stabilized and ready!`);
        
        // 🔧 DIRECT FUNCTION INJECTION: Since HTML injection isn't working, inject functions directly
        await page.evaluate(() => {
            // Simple cursor movement functions
            window.moveCursorTo = function(x, y) {
                const cursor = document.getElementById('animated-cursor');
                if (cursor) {
                    cursor.style.left = x + 'px';
                    cursor.style.top = y + 'px';
                }
            };
            
            // STEP 1: Find chatbot button and record its position
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
            
            // STEP 2: Click chatbot button and open widget
            window.clickChatbotButton = function() {
                const chatToggle = document.getElementById('chatToggle');
                const chatWidget = document.getElementById('chatWidget');
                
                if (chatToggle && chatWidget) {
                    // Simulate click
                    chatToggle.click();
                    
                    // Force widget to open (backup method)
                    chatWidget.classList.add('active');
                    chatToggle.classList.add('active');
                    
                    console.log('✅ Chatbot clicked and widget opened');
                    return true;
                }
                console.log('⚠️ Chatbot elements not found');
                return false;
            };
            
            // Check if chat widget is open
            window.isChatWidgetOpen = function() {
                const chatWidget = document.getElementById('chatWidget');
                return chatWidget && chatWidget.classList.contains('active');
            };
            
            // Find chat input field position
            window.findChatInput = function() {
                const chatInput = document.getElementById('messageInput');
                if (chatInput) {
                    const rect = chatInput.getBoundingClientRect();
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
            
            // STEP 4: Find send button position  
            window.findSendButton = function() {
                const sendButton = document.getElementById('sendButton');
                if (sendButton) {
                    const rect = sendButton.getBoundingClientRect();
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
            
            // STEP 4: Click send button
            window.clickSendButton = function() {
                const sendButton = document.getElementById('sendButton');
                
                if (sendButton) {
                    // Simulate click
                    sendButton.click();
                    
                    console.log('✅ Send button clicked - message sent!');
                    return true;
                }
                console.log('⚠️ Send button not found');
                return false;
            };
            
            // STEP 4: Complete cursor movement + clicking + typing + sending interaction
            window.updateCursorForFrame = function(frameIndex, totalFrames) {
                const progress = frameIndex / totalFrames;
                const chatbotInfo = window.findChatbotButton();
                const chatInputInfo = window.findChatInput();
                const sendButtonInfo = window.findSendButton();
                
                if (chatbotInfo.found) {
                    // Phase 1 (0-2 seconds): FAST movement to chatbot
                    if (progress < 0.222) { // 0-2 seconds: Move to chatbot (2/9 = 0.222)
                        const moveProgress = progress / 0.222; // 0 to 1 over 2 seconds
                        const startX = 800;
                        const startY = 400;
                        const endX = chatbotInfo.x;
                        const endY = chatbotInfo.y;
                        
                        // Add slight easing for natural movement
                        const easedProgress = moveProgress < 0.5 
                            ? 2 * moveProgress * moveProgress 
                            : -1 + (4 - 2 * moveProgress) * moveProgress;
                        
                        const currentX = startX + (endX - startX) * easedProgress;
                        const currentY = startY + (endY - startY) * easedProgress;
                        
                        window.moveCursorTo(currentX, currentY);
                    }
                    // Phase 2 (2-3 seconds): Quick click chatbot button
                    else if (progress < 0.333) { // 3/9 = 0.333
                        window.moveCursorTo(chatbotInfo.x, chatbotInfo.y);
                        
                        // Trigger click once at 2.5 seconds
                        if (progress >= 0.278 && progress < 0.3 && !window.hasClicked) {
                            window.clickChatbotButton();
                            window.hasClicked = true;
                        }
                    }
                    // Phase 3 (3-4 seconds): FAST move to chat input field
                    else if (progress < 0.444 && chatInputInfo.found) { // 4/9 = 0.444
                        const moveProgress = (progress - 0.333) / 0.111; // 0 to 1 over 1 second
                        const startX = chatbotInfo.x;
                        const startY = chatbotInfo.y;
                        const endX = chatInputInfo.x;
                        const endY = chatInputInfo.y;
                        
                        // Fast movement to input field
                        const easedProgress = moveProgress < 0.5 
                            ? 2 * moveProgress * moveProgress 
                            : -1 + (4 - 2 * moveProgress) * moveProgress;
                        
                        const currentX = startX + (endX - startX) * easedProgress;
                        const currentY = startY + (endY - startY) * easedProgress;
                        
                        window.moveCursorTo(currentX, currentY);
                    }
                    // Phase 4 (4-6.5 seconds): FAST Type "I want to buy a house"
                    else if (progress < 0.722 && chatInputInfo.found) { // 6.5/9 = 0.722
                        window.moveCursorTo(chatInputInfo.x, chatInputInfo.y);
                        
                        // Type message - "I want to buy a house" FAST!
                        const message = "I want to buy a house";
                        const typingProgress = (progress - 0.444) / 0.278; // 0 to 1 over 2.5 seconds (4-6.5s)
                        const targetLength = Math.floor(typingProgress * message.length);
                        
                        if (targetLength > 0 && targetLength <= message.length) {
                            const currentText = message.substring(0, targetLength);
                            if (!window.lastTypedText || window.lastTypedText !== currentText) {
                                const chatInput = document.getElementById('messageInput');
                                if (chatInput) {
                                    // Use actual line breaks for proper text wrapping
                                    chatInput.value = currentText;
                                    window.lastTypedText = currentText;
                                }
                            }
                        }
                    }
                    // Phase 5 (6.5-9 seconds): Move to send button and click
                    else if (progress < 1.0 && sendButtonInfo.found) { // 9/9 = 1.0
                        // Move to send button first (6.5-8 seconds)
                        if (progress < 0.889) { // 8/9 = 0.889
                            const moveProgress = (progress - 0.722) / 0.167; // 0 to 1 over 1.5 seconds
                            const startX = chatInputInfo.found ? chatInputInfo.x : chatbotInfo.x;
                            const startY = chatInputInfo.found ? chatInputInfo.y : chatbotInfo.y;
                            const endX = sendButtonInfo.x;
                            const endY = sendButtonInfo.y;
                            
                            // Smooth movement to send button
                            const easedProgress = moveProgress < 0.5 
                                ? 2 * moveProgress * moveProgress 
                                : -1 + (4 - 2 * moveProgress) * moveProgress;
                            
                            const currentX = startX + (endX - startX) * easedProgress;
                            const currentY = startY + (endY - startY) * easedProgress;
                            
                            window.moveCursorTo(currentX, currentY);
                        }
                        // Click send button (8-9 seconds)
                        else {
                            window.moveCursorTo(sendButtonInfo.x, sendButtonInfo.y);
                            
                            // Trigger click once at 8.5 seconds
                            if (progress >= 0.944 && progress < 0.967 && !window.hasSent) {
                                window.clickSendButton();
                                window.hasSent = true;
                            }
                        }
                    }
                    // Fallback: stay at current position
                    else {
                        if (sendButtonInfo.found && window.hasSent) {
                            window.moveCursorTo(sendButtonInfo.x, sendButtonInfo.y);
                        } else if (chatInputInfo.found) {
                            window.moveCursorTo(chatInputInfo.x, chatInputInfo.y);
                        } else {
                            window.moveCursorTo(chatbotInfo.x, chatbotInfo.y);
                        }
                    }
                } else {
                    // Fallback: keep static cursor
                    window.moveCursorTo(800, 400);
                }
            };
            
            // Initialize interaction states
            window.hasClicked = false;
            window.lastTypedText = '';
            window.hasSent = false;
        });
        
        // 🔍 VERIFICATION: Check if all functions are loaded
        const functionsExist = await page.evaluate(() => {
            return {
                findChatbotButton: typeof window.findChatbotButton,
                updateCursorForFrame: typeof window.updateCursorForFrame,
                moveCursorTo: typeof window.moveCursorTo,
                clickChatbotButton: typeof window.clickChatbotButton,
                findSendButton: typeof window.findSendButton,
                clickSendButton: typeof window.clickSendButton
            };
        });
        console.log(`✅ All functions injected:`, functionsExist);
        
        // 🔍 STEP 1: Find all elements and log their positions
        const elementInfo = await page.evaluate(() => {
            return {
                chatbot: window.findChatbotButton(),
                input: window.findChatInput(),
                send: window.findSendButton()
            };
        });
        
        if (elementInfo.chatbot.found) {
            console.log(`✅ Chatbot button found at (${Math.round(elementInfo.chatbot.x)}, ${Math.round(elementInfo.chatbot.y)})`);
        }
        if (elementInfo.input.found) {
            console.log(`✅ Input field found at (${Math.round(elementInfo.input.x)}, ${Math.round(elementInfo.input.y)})`);
        }
        if (elementInfo.send.found) {
            console.log(`✅ Send button found at (${Math.round(elementInfo.send.x)}, ${Math.round(elementInfo.send.y)})`);
        }
        
        console.log(`✅ All elements found and ready!`);
        
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
        
        const totalFrames = 540; // 9 seconds at 60fps
        const scrollableHeight = dimensions.scrollHeight - dimensions.viewportHeight;
        
        console.log(`🎬 Generating ${totalFrames} frames...`);
        console.log(`📐 Step 4: COMPLETE chatbot interaction "I want to buy a house" + send - FAST! (9 seconds)`);
        
        // Generate frames with safer delay between operations
        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            try {
                // Update cursor position for this frame
                await page.evaluate((frameIdx, totalFrames) => {
                    window.updateCursorForFrame(frameIdx, totalFrames);
                }, frameIndex, totalFrames);
                
                // Longer delay for browser stability
                await delay(20);
                
                // Take screenshot with error handling
                const framePath = path.join(framesDir, `frame_${String(frameIndex + 1).padStart(6, '0')}.png`);
                await page.screenshot({
                    path: framePath,
                    type: 'png',
                    clip: { x: 0, y: 0, width: 1920, height: 1080 }
                });
                
                // Progress logging
                if ((frameIndex + 1) % 180 === 0 || frameIndex + 1 === totalFrames) {
                    const percentage = ((frameIndex + 1) / totalFrames * 100).toFixed(1);
                    const seconds = ((frameIndex + 1) / 60).toFixed(1);
                    console.log(`  📸 Frame ${frameIndex + 1}/${totalFrames} (${percentage}%) - ${seconds}s`);
                }
                
                // Periodic browser health check
                if (frameIndex % 200 === 0 && frameIndex > 0) {
                    const isAlive = await page.evaluate(() => true).catch(() => false);
                    if (!isAlive) {
                        throw new Error('Browser page became unresponsive');
                    }
                }
                
            } catch (frameError) {
                console.error(`❌ Error on frame ${frameIndex + 1}: ${frameError.message}`);
                throw frameError;
            }
        }
        
        console.log(`✅ All frames captured!`);
        
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
            elementInfo,
            step: 4,
            description: "Complete 9-second FAST chatbot interaction: cursor + click + type 'I want to buy a house' + send message - FIXED UI!"
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
        const { businessName = 'Step 4 Complete Test', niche = 'real_estate' } = req.body;
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
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Step 4 Complete Test","niche":"real_estate"}'`);
}); 
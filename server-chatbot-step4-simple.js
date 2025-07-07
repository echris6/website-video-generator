#!/usr/bin/env node

// DISABLED: This server conflicts with server-hvac-step5.js and causes multiple videos
// Use server-hvac-step5.js instead for HVAC video generation
console.log('⚠️  server-chatbot-step4-simple.js is DISABLED to prevent multiple video generation');
console.log('🔧 Use server-hvac-step5.js on port 3025 instead');
process.exit(0);

const express = require('express');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Universal delay function compatible with all Puppeteer versions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const PORT = 3009; // New port for simple version

app.use(express.json({ limit: '50mb' }));
app.use(express.static('videos'));

// Load the fixed testttt.html file
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
║      CHATBOT STEP 4 - SIMPLE & CLEAN VERSION      ║
║              Running on port ${PORT}                    ║
║                                                    ║
║  🖱️ Step 4: Click → Click Input → Type → Send     ║
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
    
    // 🖱️ CURSOR: Add cursor overlay
    if (cursorBase64) {
        const cursorHtml = `
        <img id="animated-cursor" src="data:image/png;base64,${cursorBase64}" 
             style="position: fixed; top: 400px; left: 800px; z-index: 99999; height: 32px; pointer-events: none;">
        <script>
        // Simple cursor movement functions
        window.moveCursorTo = function(x, y) {
            const cursor = document.getElementById('animated-cursor');
            if (cursor) {
                cursor.style.left = x + 'px';
                cursor.style.top = y + 'px';
            }
        };
        
        // Find chatbot button
        window.findChatbotButton = function() {
            const chatToggle = document.getElementById('chatToggle');
            if (chatToggle) {
                const rect = chatToggle.getBoundingClientRect();
                return {
                    found: true,
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
            }
            return { found: false };
        };
        
        // Click chatbot button
        window.clickChatbotButton = function() {
            const chatToggle = document.getElementById('chatToggle');
            const chatWidget = document.getElementById('chatWidget');
            
            if (chatToggle && chatWidget) {
                chatToggle.click();
                chatWidget.classList.add('active');
                chatToggle.classList.add('active');
                return true;
            }
            return false;
        };
        
        // Find chat input field
        window.findChatInput = function() {
            const chatInput = document.getElementById('messageInput');
            if (chatInput) {
                const rect = chatInput.getBoundingClientRect();
                return {
                    found: true,
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
            }
            return { found: false };
        };
        
        // CLICK the input field to focus it
        window.clickChatInput = function() {
            const chatInput = document.getElementById('messageInput');
            if (chatInput) {
                chatInput.click();
                chatInput.focus();
                return true;
            }
            return false;
        };
        
        // Find send button
        window.findSendButton = function() {
            const sendButton = document.getElementById('sendButton');
            if (sendButton) {
                const rect = sendButton.getBoundingClientRect();
                return {
                    found: true,
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
            }
            return { found: false };
        };
        
        // Click send button
        window.clickSendButton = function() {
            const sendButton = document.getElementById('sendButton');
            if (sendButton) {
                sendButton.click();
                return true;
            }
            return false;
        };
        
        // Main interaction function
        window.updateCursorForFrame = function(frameIndex, totalFrames) {
            const progress = frameIndex / totalFrames;
            const chatbotInfo = window.findChatbotButton();
            const chatInputInfo = window.findChatInput();
            const sendButtonInfo = window.findSendButton();
            
            if (chatbotInfo.found) {
                // Phase 1 (0-2s): Move to chatbot button
                if (progress < 0.222) { // 2/9 = 0.222
                    const moveProgress = progress / 0.222;
                    const startX = 800;
                    const startY = 400;
                    const endX = chatbotInfo.x;
                    const endY = chatbotInfo.y;
                    
                    const eased = moveProgress < 0.5 
                        ? 2 * moveProgress * moveProgress 
                        : -1 + (4 - 2 * moveProgress) * moveProgress;
                    
                    const currentX = startX + (endX - startX) * eased;
                    const currentY = startY + (endY - startY) * eased;
                    
                    window.moveCursorTo(currentX, currentY);
                }
                // Phase 2 (2-2.5s): Click chatbot
                else if (progress < 0.278) { // 2.5/9 = 0.278
                    window.moveCursorTo(chatbotInfo.x, chatbotInfo.y);
                    
                    if (progress >= 0.222 && progress < 0.244 && !window.hasClickedBot) {
                        window.clickChatbotButton();
                        window.hasClickedBot = true;
                    }
                }
                // Phase 3 (2.5-4s): Move to input field
                else if (progress < 0.444 && chatInputInfo.found) { // 4/9 = 0.444
                    const moveProgress = (progress - 0.278) / 0.166; // Over 1.5 seconds
                    const startX = chatbotInfo.x;
                    const startY = chatbotInfo.y;
                    const endX = chatInputInfo.x;
                    const endY = chatInputInfo.y;
                    
                    const eased = moveProgress < 0.5 
                        ? 2 * moveProgress * moveProgress 
                        : -1 + (4 - 2 * moveProgress) * moveProgress;
                    
                    const currentX = startX + (endX - startX) * eased;
                    const currentY = startY + (endY - startY) * eased;
                    
                    window.moveCursorTo(currentX, currentY);
                }
                // Phase 4 (4-4.5s): CLICK the input field to focus it
                else if (progress < 0.5) { // 4.5/9 = 0.5
                    window.moveCursorTo(chatInputInfo.x, chatInputInfo.y);
                    
                    if (progress >= 0.444 && progress < 0.466 && !window.hasClickedInput) {
                        window.clickChatInput();
                        window.hasClickedInput = true;
                    }
                }
                // Phase 5 (4.5-7s): Type message
                else if (progress < 0.778 && chatInputInfo.found) { // 7/9 = 0.778
                    window.moveCursorTo(chatInputInfo.x, chatInputInfo.y);
                    
                    const message = "I want to buy a house";
                    const typingProgress = (progress - 0.5) / 0.278; // Over 2.5 seconds
                    const targetLength = Math.floor(typingProgress * message.length);
                    
                    if (targetLength > 0 && targetLength <= message.length) {
                        const currentText = message.substring(0, targetLength);
                        if (!window.lastTypedText || window.lastTypedText !== currentText) {
                            const chatInput = document.getElementById('messageInput');
                            if (chatInput) {
                                chatInput.value = currentText;
                                window.lastTypedText = currentText;
                            }
                        }
                    }
                }
                // Phase 6 (7-8.5s): Move to send button
                else if (progress < 0.944 && sendButtonInfo.found) { // 8.5/9 = 0.944
                    const moveProgress = (progress - 0.778) / 0.166; // Over 1.5 seconds
                    const startX = chatInputInfo.x;
                    const startY = chatInputInfo.y;
                    const endX = sendButtonInfo.x;
                    const endY = sendButtonInfo.y;
                    
                    const eased = moveProgress < 0.5 
                        ? 2 * moveProgress * moveProgress 
                        : -1 + (4 - 2 * moveProgress) * moveProgress;
                    
                    const currentX = startX + (endX - startX) * eased;
                    const currentY = startY + (endY - startY) * eased;
                    
                    window.moveCursorTo(currentX, currentY);
                }
                // Phase 7 (8.5-9s): Click send button
                else {
                    window.moveCursorTo(sendButtonInfo.x, sendButtonInfo.y);
                    
                    if (progress >= 0.944 && progress < 0.966 && !window.hasClickedSend) {
                        window.clickSendButton();
                        window.hasClickedSend = true;
                    }
                }
            } else {
                window.moveCursorTo(800, 400);
            }
        };
        
        // Initialize
        window.hasClickedBot = false;
        window.hasClickedInput = false;
        window.hasClickedSend = false;
        window.lastTypedText = '';
        </script>
        `;
        customizedHtml = customizedHtml.replace('</body>', cursorHtml + '</body>');
    }
    
    return customizedHtml;
}

async function generateVideo(businessName, niche = 'real_estate') {
    const timestamp = Date.now();
    const videoFilename = `chatbot_step4_simple_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
    const framesDir = path.join(__dirname, 'frames', `temp_${timestamp}`);
    
    console.log(`🎥 CHATBOT STEP 4 - SIMPLE CLEAN VERSION`);
    console.log(`📋 Business: ${businessName}`);
    console.log(`🏢 Niche: ${niche}`);
    console.log(`🖱️ Interaction: Click Chatbot → Click Input → Type "I want to buy a house" → Send`);
    
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
                '--disable-web-security'
            ]
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log(`📄 Loading website content...`);
        const customizedHtml = customizeWebsite(niche, businessName);
        
        await page.setContent(customizedHtml, { waitUntil: 'networkidle0' });
        
        // Wait for fonts and basic loading
        await page.evaluate(() => document.fonts.ready);
        await delay(3000);
        
        // Stabilize page
        await page.evaluate(() => {
            // Force reveal all elements
            const revealElements = document.querySelectorAll('.reveal-element');
            revealElements.forEach(element => {
                element.classList.add('revealed');
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            });
            
            // Hide floating elements to reduce movement
            const floatingElements = document.querySelectorAll('.floating-elements');
            floatingElements.forEach(element => {
                element.style.display = 'none';
            });
        });
        
        await delay(2000);
        console.log(`🎯 Page stabilized!`);
        
        // Test element detection
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
        
        console.log(`✅ All elements detected!`);
        
        const totalFrames = 540; // 9 seconds at 60fps
        
        console.log(`🎬 Generating ${totalFrames} frames...`);
        console.log(`📐 Simple chatbot interaction: Click → Click Input → Type → Send`);
        
        // Generate frames
        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            try {
                // Update cursor position for this frame
                await page.evaluate((frameIdx, totalFrames) => {
                    window.updateCursorForFrame(frameIdx, totalFrames);
                }, frameIndex, totalFrames);
                
                await delay(15);
                
                // Take screenshot
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
                
            } catch (frameError) {
                console.error(`❌ Error on frame ${frameIndex + 1}: ${frameError.message}`);
                throw frameError;
            }
        }
        
        console.log(`✅ All frames captured!`);
        
        // Create video
        console.log(`🎬 Creating video...`);
        
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(path.join(framesDir, 'frame_%06d.png'))
                .inputOptions([
                    '-framerate', '60',
                    '-t', '9'
                ])
                .outputOptions([
                    '-c:v', 'libx264',
                    '-preset', 'medium',
                    '-crf', '23',
                    '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart'
                ])
                .output(path.join(__dirname, 'videos', videoFilename))
                .on('progress', (progress) => {
                    if (progress.percent) {
                        const percent = Math.round(progress.percent * 10) / 10;
                        console.log(`  🎬 Encoding: ${percent}%`);
                    }
                })
                .on('end', () => {
                    console.log('  ✅ Video encoding complete!');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ Video encoding failed:', err);
                    reject(err);
                })
                .run();
        });
        
        // Cleanup frames
        console.log(`🧹 Cleaning up frames...`);
        if (fs.existsSync(framesDir)) {
            fs.rmSync(framesDir, { recursive: true, force: true });
        }
        
        // Get file size
        const videoPath = path.join(__dirname, 'videos', videoFilename);
        const stats = fs.statSync(videoPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ SUCCESS! Video: ${videoFilename} (${fileSizeMB} MB)`);
        
        return {
            success: true,
            filename: videoFilename,
            path: videoPath,
            size: `${fileSizeMB} MB`,
            elementInfo,
            step: 4,
            description: `Simple 9-second chatbot interaction: click chatbot → click input → type "${elementInfo.input.found ? 'I want to buy a house' : 'message'}" → send - CLEAN VERSION!`
        };
        
    } catch (error) {
        console.error('❌ Video generation failed:', error);
        
        // Cleanup on error
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
        const { businessName = 'Simple Test', niche = 'real_estate' } = req.body;
        
        const result = await generateVideo(businessName, niche);
        res.json(result);
        
    } catch (error) {
        console.error('Error generating video:', error);
        res.status(500).json({ 
            error: 'Failed to generate video', 
            details: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Chatbot Step 4 Simple', port: PORT });
});

app.listen(PORT, () => {
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Simple Clean Test","niche":"real_estate"}'`);
});

module.exports = app; 
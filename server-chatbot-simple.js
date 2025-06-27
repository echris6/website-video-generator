const express = require('express');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Universal delay function compatible with all Puppeteer versions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const PORT = 3009;

app.use(express.json({ limit: '50mb' }));
app.use(express.static('videos'));

// Load testttt.html
const websiteTemplate = fs.readFileSync(path.join(__dirname, 'testttt.html'), 'utf8');

// Load cursor
const cursorPath = path.join(__dirname, 'cursor.png');
let cursorBase64 = '';
if (fs.existsSync(cursorPath)) {
    const cursorBuffer = fs.readFileSync(cursorPath);
    cursorBase64 = cursorBuffer.toString('base64');
    console.log(`✅ Cursor loaded: ${cursorPath}`);
}

console.log(`
╔════════════════════════════════════════════════════╗
║         SIMPLE CHATBOT - CLEAN VERSION            ║
║              Running on port ${PORT}                    ║
║                                                    ║
║  🖱️ Click Chatbot → Click Input → Type → Send     ║
║  📝 POST /generate-video - Generate video          ║
╚════════════════════════════════════════════════════╝
`);

function customizeWebsite(businessName) {
    let customizedHtml = websiteTemplate;
    
    // Replace placeholders
    customizedHtml = customizedHtml.replace(/{{businessName}}/g, "Luxury Properties Group");
    customizedHtml = customizedHtml.replace(/{{heroTitle}}/g, "Luxury Property Excellence");
    customizedHtml = customizedHtml.replace(/{{primaryColor}}/g, "#0a1929");
    customizedHtml = customizedHtml.replace(/{{secondaryColor}}/g, "#d4af37");
    customizedHtml = customizedHtml.replace(/{{backgroundColor}}/g, "#fdfdfd");
    customizedHtml = customizedHtml.replace(/{{textColor}}/g, "#0a1929");
    customizedHtml = customizedHtml.replace(/{{accentColor}}/g, "#c9a96e");
    
    // Add cursor
    if (cursorBase64) {
        const cursorHtml = `
        <img id="animated-cursor" src="data:image/png;base64,${cursorBase64}" 
             style="position: fixed; top: 400px; left: 800px; z-index: 99999; height: 32px; pointer-events: none;">
        
        <script>
        window.moveCursorTo = function(x, y) {
            const cursor = document.getElementById('animated-cursor');
            if (cursor) {
                cursor.style.left = x + 'px';
                cursor.style.top = y + 'px';
            }
        };
        
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
        
        window.clickChatInput = function() {
            const chatInput = document.getElementById('messageInput');
            if (chatInput) {
                chatInput.click();
                chatInput.focus();
                return true;
            }
            return false;
        };
        
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
        
        window.clickSendButton = function() {
            const sendButton = document.getElementById('sendButton');
            if (sendButton) {
                sendButton.click();
                return true;
            }
            return false;
        };
        
        window.updateCursorForFrame = function(frameIndex, totalFrames) {
            const progress = frameIndex / totalFrames;
            const chatbotInfo = window.findChatbotButton();
            const chatInputInfo = window.findChatInput();
            const sendButtonInfo = window.findSendButton();
            
            if (chatbotInfo.found) {
                // 0-2s: Move to chatbot
                if (progress < 0.222) {
                    const moveProgress = progress / 0.222;
                    const startX = 800;
                    const startY = 400;
                    const endX = chatbotInfo.x;
                    const endY = chatbotInfo.y;
                    
                    const currentX = startX + (endX - startX) * moveProgress;
                    const currentY = startY + (endY - startY) * moveProgress;
                    
                    window.moveCursorTo(currentX, currentY);
                }
                // 2-2.5s: Click chatbot
                else if (progress < 0.278) {
                    window.moveCursorTo(chatbotInfo.x, chatbotInfo.y);
                    
                    if (progress >= 0.222 && progress < 0.244 && !window.hasClickedBot) {
                        window.clickChatbotButton();
                        window.hasClickedBot = true;
                    }
                }
                // 2.5-4s: Move to input
                else if (progress < 0.444 && chatInputInfo.found) {
                    const moveProgress = (progress - 0.278) / 0.166;
                    const startX = chatbotInfo.x;
                    const startY = chatbotInfo.y;
                    const endX = chatInputInfo.x;
                    const endY = chatInputInfo.y;
                    
                    const currentX = startX + (endX - startX) * moveProgress;
                    const currentY = startY + (endY - startY) * moveProgress;
                    
                    window.moveCursorTo(currentX, currentY);
                }
                // 4-4.5s: Click input
                else if (progress < 0.5) {
                    window.moveCursorTo(chatInputInfo.x, chatInputInfo.y);
                    
                    if (progress >= 0.444 && progress < 0.466 && !window.hasClickedInput) {
                        window.clickChatInput();
                        window.hasClickedInput = true;
                    }
                }
                // 4.5-7s: Type message
                else if (progress < 0.778 && chatInputInfo.found) {
                    window.moveCursorTo(chatInputInfo.x, chatInputInfo.y);
                    
                    const message = "I want to buy a house";
                    const typingProgress = (progress - 0.5) / 0.278;
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
                // 7-8.5s: Move to send button
                else if (progress < 0.944 && sendButtonInfo.found) {
                    const moveProgress = (progress - 0.778) / 0.166;
                    const startX = chatInputInfo.x;
                    const startY = chatInputInfo.y;
                    const endX = sendButtonInfo.x;
                    const endY = sendButtonInfo.y;
                    
                    const currentX = startX + (endX - startX) * moveProgress;
                    const currentY = startY + (endY - startY) * moveProgress;
                    
                    window.moveCursorTo(currentX, currentY);
                }
                // 8.5-9s: Click send
                else {
                    window.moveCursorTo(sendButtonInfo.x, sendButtonInfo.y);
                    
                    if (progress >= 0.944 && progress < 0.966 && !window.hasClickedSend) {
                        window.clickSendButton();
                        window.hasClickedSend = true;
                    }
                }
            }
        };
        
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

async function generateVideo(businessName) {
    const timestamp = Date.now();
    const videoFilename = `chatbot_simple_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
    const framesDir = path.join(__dirname, 'frames', `temp_${timestamp}`);
    
    console.log(`🎥 SIMPLE CHATBOT VIDEO`);
    console.log(`📋 Business: ${businessName}`);
    console.log(`🖱️ Actions: Click Chatbot → Click Input → Type "I want to buy a house" → Send`);
    
    let browser;
    
    try {
        if (!fs.existsSync(framesDir)) {
            fs.mkdirSync(framesDir, { recursive: true });
        }
        
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        const customizedHtml = customizeWebsite(businessName);
        await page.setContent(customizedHtml, { waitUntil: 'networkidle0' });
        
        // Wait and stabilize
        await page.evaluate(() => document.fonts.ready);
        await delay(3000);
        
        await page.evaluate(() => {
            document.querySelectorAll('.reveal-element').forEach(element => {
                element.classList.add('revealed');
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            });
            
            document.querySelectorAll('.floating-elements').forEach(element => {
                element.style.display = 'none';
            });
        });
        
        await delay(2000);
        
        // Test elements
        const elementInfo = await page.evaluate(() => {
            return {
                chatbot: window.findChatbotButton(),
                input: window.findChatInput(),
                send: window.findSendButton()
            };
        });
        
        console.log(`✅ Chatbot: (${Math.round(elementInfo.chatbot.x)}, ${Math.round(elementInfo.chatbot.y)})`);
        console.log(`✅ Input: (${Math.round(elementInfo.input.x)}, ${Math.round(elementInfo.input.y)})`);
        console.log(`✅ Send: (${Math.round(elementInfo.send.x)}, ${Math.round(elementInfo.send.y)})`);
        
        const totalFrames = 540; // 9 seconds
        
        console.log(`🎬 Generating ${totalFrames} frames...`);
        
        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            await page.evaluate((frameIdx, totalFrames) => {
                window.updateCursorForFrame(frameIdx, totalFrames);
            }, frameIndex, totalFrames);
            
            await delay(10);
            
            const framePath = path.join(framesDir, `frame_${String(frameIndex + 1).padStart(6, '0')}.png`);
            await page.screenshot({
                path: framePath,
                type: 'png',
                clip: { x: 0, y: 0, width: 1920, height: 1080 }
            });
            
            if ((frameIndex + 1) % 180 === 0 || frameIndex + 1 === totalFrames) {
                const seconds = ((frameIndex + 1) / 60).toFixed(1);
                console.log(`  📸 Frame ${frameIndex + 1}/${totalFrames} - ${seconds}s`);
            }
        }
        
        console.log(`🎬 Creating video...`);
        
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(path.join(framesDir, 'frame_%06d.png'))
                .inputOptions(['-framerate', '60', '-t', '9'])
                .outputOptions([
                    '-c:v', 'libx264',
                    '-preset', 'medium',
                    '-crf', '23',
                    '-pix_fmt', 'yuv420p'
                ])
                .output(path.join(__dirname, 'videos', videoFilename))
                .on('progress', (progress) => {
                    if (progress.percent) {
                        console.log(`  🎬 Encoding: ${Math.round(progress.percent * 10) / 10}%`);
                    }
                })
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
        
        // Cleanup
        if (fs.existsSync(framesDir)) {
            fs.rmSync(framesDir, { recursive: true, force: true });
        }
        
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
            description: `Clean chatbot interaction with proper clicks and typing "I want to buy a house"`
        };
        
    } catch (error) {
        console.error('❌ Error:', error);
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

app.post('/generate-video', async (req, res) => {
    try {
        const { businessName = 'Clean Test' } = req.body;
        const result = await generateVideo(businessName);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate video', details: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Simple Chatbot', port: PORT });
});

app.listen(PORT, () => {
    console.log(`👉 Ready! Test: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"CLEAN TEST"}'`);
});

module.exports = app; 
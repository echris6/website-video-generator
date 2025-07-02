const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { spawn } = require('child_process');

const app = express();
app.use(express.json({ limit: '50mb' }));

// Load cursor image
const cursorBuffer = fs.readFileSync(path.join(__dirname, 'cursor.png'));

// HVAC Chatbot Functions
const hvacChatbotFunctions = `
    function clickHVACChatButton() {
        const chatButton = document.querySelector('#hvacChatToggle');
        if (chatButton) {
            chatButton.click();
            return true;
        }
        
        const fallbackSelectors = [
            '.hvac-chat-toggle',
            '.chat-toggle',
            '[data-hvac-chat]',
            '.floating-chat-button'
        ];
        
        for (const selector of fallbackSelectors) {
            const button = document.querySelector(selector);
            if (button) {
                button.click();
                return true;
            }
        }
        
        console.log('❌ Could not find HVAC chat button');
        return false;
    }

    function clickHVACInputField() {
        const input = document.querySelector('#hvacMessageInput');
        if (input) {
            input.focus();
            input.click();
            return true;
        }
        
        const fallbackSelectors = [
            '.hvac-message-input input',
            '.chat-input input',
            'input[placeholder*="HVAC"]',
            'input[placeholder*="issue"]'
        ];
        
        for (const selector of fallbackSelectors) {
            const inputField = document.querySelector(selector);
            if (inputField) {
                inputField.focus();
                inputField.click();
                return true;
            }
        }
        
        console.log('❌ Could not find HVAC input field');
        return false;
    }

    function clickHVACSendButton() {
        const sendButton = document.querySelector('#hvacSendButton');
        if (sendButton) {
            sendButton.click();
            return true;
        }
        
        const fallbackSelectors = [
            '.hvac-send-button',
            '.send-button',
            'button[type="submit"]',
            '.chat-send'
        ];
        
        for (const selector of fallbackSelectors) {
            const button = document.querySelector(selector);
            if (button) {
                button.click();
                return true;
            }
        }
        
        console.log('❌ Could not find HVAC send button');
        return false;
    }

    function clickHVACMinimizeButton() {
        const minimizeButton = document.querySelector('#hvacChatMinimize');
        if (minimizeButton) {
            minimizeButton.click();
            return true;
        }
        
        const fallbackSelectors = [
            '.hvac-chat-minimize',
            '.chat-minimize',
            '.minimize-button',
            '.close-chat'
        ];
        
        for (const selector of fallbackSelectors) {
            const button = document.querySelector(selector);
            if (button) {
                button.click();
                return true;
            }
        }
        
        console.log('❌ Could not minimize HVAC chatbot');
        return false;
    }
`;

// HVAC Professional Fixes
const applyHVACFixesFunction = `
    function applyHVACFixes() {
        const style = document.createElement('style');
        style.innerHTML = \`
            *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
                scroll-behavior: auto !important;
            }
            
            .hvac-chat-widget {
                width: 420px !important;
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                z-index: 9999 !important;
            }
            
            .hvac-chat-input input {
                width: 320px !important;
                min-width: 320px !important;
                padding: 8px 12px !important;
                font-size: 14px !important;
            }
            
            .hvac-send-button {
                width: 50px !important;
                height: 50px !important;
                min-width: 50px !important;
                min-height: 50px !important;
            }
        \`;
        document.head.appendChild(style);
        
        const counters = document.querySelectorAll('[data-count]');
        counters.forEach(counter => {
            const targetValue = counter.getAttribute('data-count');
            counter.textContent = targetValue;
        });
        
        console.log('✅ HVAC professional fixes applied');
    }
`;

// HVAC Cursor positioning function
function getHVACCursorPositionForFrame(frameIndex, totalFrames) {
    const startPosition = { x: 200, y: 200 };
    const chatbotPosition = { x: 1858, y: 1018 };
    const inputPosition = { x: 1636, y: 934 };
    const sendPosition = { x: 1835, y: 934 };
    const minimizePosition = { x: 1854, y: 562 };
    
    const moveToButtonEnd = 0.125;
    const clickPause = 0.147;
    const moveToInputEnd = 0.208;
    const typingEnd = 0.333;
    const moveToSendEnd = 0.397;
    const sendPause = 0.417;
    const moveToMinimizeEnd = 0.467;
    const minimizePause = 0.483;
    
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

// Main video generation function
async function generateHVACVideo(businessName, niche, htmlContent, businessData = {}) {
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

        // Load the HVAC website
        const websiteContent = htmlContent || fs.readFileSync(path.join(__dirname, 'hvac1.html'), 'utf8');
        await page.setContent(websiteContent);

        const fps = 60;
        const duration = 30; // 30 seconds for complete showcase
        const totalFrames = fps * duration;
        
        console.log(`🎬 Generating ${totalFrames} frames for 30-second HVAC demo...`);
        console.log(`🚨 Business: ${businessName || 'Professional HVAC Service'}`);
        if (businessData.businessPhone) console.log(`📞 Phone: ${businessData.businessPhone}`);
        if (businessData.businessAddress) console.log(`📍 Address: ${businessData.businessAddress}`);
        if (businessData.heroTitle) console.log(`🎯 Hero Title: ${businessData.heroTitle}`);
        
        await page.waitForTimeout(5000);
        console.log('⏳ HVAC site loaded with stabilization wait...');
        
        await page.evaluate(hvacChatbotFunctions);
        await page.evaluate(applyHVACFixesFunction);
        await page.evaluate(() => {
            if (typeof applyHVACFixes === 'function') {
                applyHVACFixes();
            }
        });
        console.log('🔧 HVAC professional fixes applied');
        
        await page.evaluate(() => {
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                el.style.animation = 'none';
                el.style.transition = 'none';
                el.style.transform = 'none';
            });
            
            const revealElements = document.querySelectorAll('.reveal-element, .reveal-left, .reveal-right');
            revealElements.forEach(element => {
                element.classList.add('revealed');
                element.style.opacity = '1';
                element.style.transform = 'none';
                element.style.visibility = 'visible';
            });
            
            for (let i = 1; i < 99999; i++) {
                window.clearInterval(i);
                window.clearTimeout(i);
            }
            
            const counters = document.querySelectorAll('[data-count]');
            counters.forEach(counter => {
                const targetValue = counter.getAttribute('data-count');
                counter.textContent = targetValue;
                counter.style.animation = 'none';
                counter.style.transition = 'none';
            });
        });
        
        await page.waitForTimeout(2000);
        console.log('✅ HVAC site completely stabilized');
        
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        const viewportHeight = 1080;
        const maxScroll = Math.max(0, pageHeight - viewportHeight);
        
        console.log(`📏 Page height: ${pageHeight}px, Max scroll: ${maxScroll}px`);
        
        const framesDir = path.join(__dirname, 'frames');
        if (!fs.existsSync(framesDir)) {
            fs.mkdirSync(framesDir);
        }
        
        const clickFrame = Math.floor(totalFrames * 0.147);
        const inputFocusFrame = Math.floor(totalFrames * 0.208);
        const typingStartFrame = Math.floor(totalFrames * 0.208);
        const typingEndFrame = Math.floor(totalFrames * 0.333);
        const sendClickFrame = Math.floor(totalFrames * 0.397);
        const minimizeClickFrame = Math.floor(totalFrames * 0.467);
        const scrollStartFrame = Math.floor(totalFrames * 0.5);
        
        const emergencyMessage = "I need HVAC repair service";
        let chatbotOpened = false;
        let chatbotMinimized = false;
        let typingProgress = 0;
        let fullPageBuffer = null;
        
        for (let i = 0; i < totalFrames; i++) {
            let frameBuffer;
            
            if (i < scrollStartFrame) {
                // Interaction phase (0-15 seconds)
                
                if (i === clickFrame && !chatbotOpened) {
                    await page.evaluate(() => clickHVACChatButton());
                    console.log(`🚨 CLICKED HVAC chat at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    chatbotOpened = true;
                    await page.waitForTimeout(1000);
                }
                
                if (i === inputFocusFrame) {
                    await page.evaluate(() => clickHVACInputField());
                    console.log(`🖱️ FOCUSED input at frame ${i} (${(i/fps).toFixed(1)}s)`);
                }
                
                if (i >= typingStartFrame && i < typingEndFrame) {
                    const typingFrames = typingEndFrame - typingStartFrame;
                    const currentProgress = (i - typingStartFrame) / typingFrames;
                    const charactersToShow = Math.min(Math.ceil(currentProgress * emergencyMessage.length), emergencyMessage.length);
                    
                    if (charactersToShow > typingProgress) {
                        const textToShow = emergencyMessage.substring(0, charactersToShow);
                        await page.evaluate((text) => {
                            const input = document.querySelector('#hvacMessageInput');
                            if (input) {
                                input.value = text;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.setSelectionRange(text.length, text.length);
                                input.scrollLeft = input.scrollWidth;
                            }
                        }, textToShow);
                        typingProgress = charactersToShow;
                    }
                }
                
                if (i === sendClickFrame) {
                    await page.evaluate(() => clickHVACSendButton());
                    console.log(`🚨 SENT message at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    await page.waitForTimeout(300);
                }
                
                if (i === minimizeClickFrame && !chatbotMinimized) {
                    await page.evaluate(() => clickHVACMinimizeButton());
                    console.log(`🖱️ MINIMIZED chat at frame ${i} (${(i/fps).toFixed(1)}s)`);
                    chatbotMinimized = true;
                    await page.waitForTimeout(500);
                }
                
                frameBuffer = await page.screenshot({ 
                    type: 'png',
                    clip: { x: 0, y: 0, width: 1920, height: 1080 }
                });
                
            } else {
                // Scrolling phase (15-30 seconds)
                
                if (!fullPageBuffer) {
                    console.log('📸 Taking full page screenshot...');
                    await page.evaluate(() => {
                        window.scrollTo(0, 0);
                        const sections = document.querySelectorAll('section');
                        sections.forEach(section => {
                            section.style.opacity = '1';
                            section.style.visibility = 'visible';
                        });
                    });
                    await page.waitForTimeout(1000);
                    fullPageBuffer = await page.screenshot({ 
                        fullPage: true,
                        type: 'png'
                    });
                    console.log('📸 Full page screenshot captured');
                }
                
                const scrollProgress = (i - scrollStartFrame) / (totalFrames - scrollStartFrame);
                const slowProgress = Math.min(scrollProgress * 1.05, 1.0);
                const scrollY = Math.round(slowProgress * maxScroll);
                
                frameBuffer = await sharp(fullPageBuffer)
                    .extract({ left: 0, top: scrollY, width: 1920, height: 1080 })
                    .png()
                    .toBuffer();
            }
            
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
            
            const framePath = path.join(framesDir, `frame_${i.toString().padStart(6, '0')}.png`);
            fs.writeFileSync(framePath, frameWithCursor);
            
            if ((i + 1) % Math.floor(totalFrames / 4) === 0) {
                const percentage = ((i + 1) / totalFrames * 100).toFixed(1);
                const timeSeconds = ((i + 1) / fps).toFixed(1);
                console.log(`  🎬 Frame ${i + 1}/${totalFrames} (${percentage}%) - ${timeSeconds}s`);
            }
        }
        
        console.log('✅ All frames captured!');
        
        console.log('🎬 Creating professional HVAC video...');
        const videoFileName = `hvac_professional_${businessName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.mp4`;
        const videoPath = path.join(__dirname, 'videos', videoFileName);
        
        const videosDir = path.join(__dirname, 'videos');
        if (!fs.existsSync(videosDir)) {
            fs.mkdirSync(videosDir);
        }
        
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-framerate', fps.toString(),
            '-i', path.join(framesDir, 'frame_%06d.png'),
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-crf', '18',
            '-preset', 'medium',
            '-movflags', '+faststart',
            '-avoid_negative_ts', 'make_zero',
            '-fflags', '+genpts',
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

        console.log('🧹 Cleaning up frames...');
        const frameFiles = fs.readdirSync(framesDir).filter(f => f.startsWith('frame_'));
        frameFiles.forEach(file => {
            fs.unlinkSync(path.join(framesDir, file));
        });

        const stats = fs.statSync(videoPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ SUCCESS! Video: ${videoFileName} (${fileSizeInMB} MB)`);
        
        return {
            success: true,
            videoPath: videoFileName,
            fileSizeInMB: parseFloat(fileSizeInMB),
            duration: duration,
            fps: fps,
            frames: totalFrames,
            message: `30-second HVAC emergency service demo for ${businessName}: "${emergencyMessage}"`
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
    res.json({ 
        status: 'healthy', 
        service: 'HVAC Professional Video Generator', 
        timestamp: new Date().toISOString(),
        duration: '30 seconds',
        version: '2.0.0'
    });
});

// Video generation endpoint
app.post('/generate-video', async (req, res) => {
    try {
        const { 
            businessName, 
            niche, 
            htmlContent,
            businessPhone,
            businessAddress,
            heroTitle,
            tagline,
            ctaText,
            workflowId
        } = req.body;
        
        console.log(`🚨 HVAC VIDEO GENERATION REQUEST`);
        console.log(`📋 Business: ${businessName || 'Professional HVAC Service'}`);
        console.log(`📞 Phone: ${businessPhone || 'No phone provided'}`);
        console.log(`📍 Address: ${businessAddress || 'No address provided'}`);
        console.log(`🎯 Hero Title: ${heroTitle || 'Professional HVAC Solutions'}`);
        console.log(`💬 Tagline: ${tagline || 'Expert HVAC services'}`);
        console.log(`📢 CTA: ${ctaText || 'Get Free Estimate'}`);
        console.log(`🆔 Workflow ID: ${workflowId || 'No workflow ID'}`);
        console.log(`📄 HTML Content: ${htmlContent ? 'Custom template provided' : 'Using default template'}`);
        
        const businessData = {
            businessPhone,
            businessAddress,
            heroTitle,
            tagline,
            ctaText
        };
        
        const result = await generateHVACVideo(businessName, niche, htmlContent, businessData);
        res.json(result);
        
    } catch (error) {
        console.error('❌ HVAC Generation Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            service: 'HVAC Professional Video Generator'
        });
    }
});

const PORT = process.env.PORT || 3020;
app.listen(PORT, () => {
    console.log('✅ Cursor loaded successfully');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║           HVAC PROFESSIONAL VIDEO GENERATOR          ║');
    console.log(`║                Running on port ${PORT}                  ║`);
    console.log('║                                                      ║');
    console.log('║  🚨 Duration: 30 seconds (15s interaction + 15s tour)║');
    console.log('║  🔧 Emergency: "I need HVAC repair service"          ║');
    console.log('║  📝 POST /generate-video - Generate professional demo ║');
    console.log('║  ❤️  GET  /health - Service health check              ║');
    console.log('║  🎯 Supports unique business data per video          ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Professional HVAC","niche":"hvac"}'`);
}); 
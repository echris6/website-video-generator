const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

const app = express();
const PORT = 3008;

// Create videos and frames directories
const VIDEOS_DIR = path.join(__dirname, 'videos');
const FRAMES_DIR = path.join(__dirname, 'frames');

async function ensureDirectories() {
    try {
        if (!existsSync(VIDEOS_DIR)) {
            await fs.mkdir(VIDEOS_DIR, { recursive: true });
        }
        if (!existsSync(FRAMES_DIR)) {
            await fs.mkdir(FRAMES_DIR, { recursive: true });
        }
    } catch (error) {
        console.error('Error creating directories:', error);
    }
}

ensureDirectories();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use('/videos', express.static(VIDEOS_DIR));

// Default video settings
const DEFAULT_VIDEO_SETTINGS = {
    width: 1920,
    height: 1080,
    fps: 60,
    videoCRF: 18,
    videoCodec: 'libx264',
    videoPreset: 'fast',
    videoBitrate: 3000,
    duration: 9
};

/**
 * Generate video with complete chatbot interaction
 */
app.post('/generate-video', async (req, res) => {
    let browser = null;
    let page = null;
    let frameDir = null;

    try {
        const { html_content, business_name, settings = {} } = req.body;
        
        if (!html_content || !business_name) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: html_content and business_name'
            });
        }

        console.log(`🎥 Step 4 Complete Server - Starting video generation for: ${business_name}`);

        const timestamp = Date.now();
        const safeBusinessName = business_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `chatbot_step4_complete_${safeBusinessName}_test_${timestamp}.mp4`;
        const filePath = path.join(VIDEOS_DIR, filename);
        frameDir = path.join(FRAMES_DIR, `${safeBusinessName}_${timestamp}`);
        
        await fs.mkdir(frameDir, { recursive: true });

        const videoSettings = { ...DEFAULT_VIDEO_SETTINGS, ...settings };

        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-gpu'
            ]
        });

        page = await browser.newPage();
        await page.setViewport({
            width: videoSettings.width,
            height: videoSettings.height,
            deviceScaleFactor: 1
        });

        // Set HTML content
        await page.setContent(html_content, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 45000
        });

        // Apply comprehensive CSS fixes for chatbot Step 4
        await page.addStyleTag({
            content: `
                /* Step 4 Complete: Enhanced Chat widget fixes */
                .chat-widget, .chatbot-widget, [id*="chat"] {
                    width: 450px !important;
                    min-width: 450px !important;
                    max-width: 450px !important;
                }
                
                /* Step 4 Complete: Input field with proper selectors */
                #messageInput, 
                .chat-input, 
                input[type="text"],
                [class*="input"] {
                    width: 342px !important;
                    min-width: 342px !important;
                    flex: none !important;
                    padding: 1rem 1.2rem !important;
                    font-size: 14px !important;
                    box-sizing: border-box !important;
                }
                
                /* Step 4 Complete: Send button proper sizing */
                .send-button, 
                .chat-send, 
                [class*="send"],
                button[aria-label*="send"] {
                    width: 53.2px !important;
                    height: 53.2px !important;
                    min-width: 53.2px !important;
                    min-height: 53.2px !important;
                    flex-shrink: 0 !important;
                }
                
                /* Step 4 Complete: Input container fixes */
                .chat-input-container,
                .input-container,
                [class*="input-container"] {
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    padding: 8px !important;
                }
                
                /* Step 4 Complete: Disable all animations for stability */
                *, *::before, *::after {
                    animation-duration: 0s !important;
                    animation-delay: 0s !important;
                    transition-duration: 0s !important;
                    transition-delay: 0s !important;
                    caret-color: transparent !important;
                }
                
                /* Step 4 Complete: Text selection and focus fixes */
                input:focus,
                textarea:focus {
                    outline: none !important;
                    box-shadow: none !important;
                }
                
                /* Step 4 Complete: Cursor blinking disable */
                input,
                textarea {
                    caret-color: transparent !important;
                }
            `
        });

        console.log('✅ Applied Step 4 comprehensive CSS fixes');
        await page.waitForTimeout(3000);

        // Perfect timing sequence: Move(2s) → Click(2.5s) → Input(1s) → Type(2.5s) → Send(1.5s)
        await generateStep4Interaction(page, frameDir, videoSettings);

        // Create video from frames
        await createVideoFromFrames(frameDir, filePath, videoSettings);

        // Clean up
        await fs.rm(frameDir, { recursive: true });

        const stats = await fs.stat(filePath);
        console.log(`✅ Step 4 Video generated: ${filename} (${formatFileSize(stats.size)})`);

        res.json({
            success: true,
            video_url: `/videos/${filename}`,
            file_name: filename,
            file_size: stats.size,
            file_size_readable: formatFileSize(stats.size),
            features: ['Complete chatbot interaction', 'Proper CSS selectors', 'No text cutoff', 'Perfect timing']
        });

    } catch (error) {
        console.error('Error generating video:', error);
        
        if (frameDir && existsSync(frameDir)) {
            try {
                await fs.rm(frameDir, { recursive: true });
            } catch (cleanupError) {
                console.error('Error cleaning up:', cleanupError);
            }
        }

        res.status(500).json({
            success: false,
            error: 'Failed to generate video',
            message: error.message
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

async function generateStep4Interaction(page, frameDir, videoSettings) {
    const totalFrames = videoSettings.fps * videoSettings.duration; // 540 frames for 9 seconds
    
    // Perfect timing from memory: Move(2s) → Click(2.5s) → Input(1s) → Type(2.5s) → Send(1.5s)
    const phases = {
        move: 2 * videoSettings.fps,           // 0-120 frames: move to chatbot
        click: 2.5 * videoSettings.fps,       // 120-150 frames: click chatbot
        input_move: 3.5 * videoSettings.fps,  // 150-210 frames: move to input
        typing: 6 * videoSettings.fps,        // 210-360 frames: type message
        send: totalFrames                     // 360-540 frames: move to send button
    };

    console.log(`🎬 Step 4 Complete: Generating ${totalFrames} frames with perfect timing`);
    console.log(`📊 Phases: Move(${phases.move}) → Click(${phases.click}) → Input(${phases.input_move}) → Type(${phases.typing}) → Send(${phases.send})`);

    const chatbotPos = { x: 1858, y: 1018 };
    const inputPos = { x: 1400, y: 850 };
    const sendPos = { x: 1500, y: 850 };

    for (let frame = 0; frame < totalFrames; frame++) {
        let cursorX = 100, cursorY = 100;
        const currentTime = frame / videoSettings.fps;
        
        if (frame < phases.move) {
            // Phase 1: Move cursor to chatbot button (2 seconds)
            const progress = frame / phases.move;
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            cursorX = 100 + (chatbotPos.x - 100) * easeProgress;
            cursorY = 100 + (chatbotPos.y - 100) * easeProgress;
            
        } else if (frame < phases.click) {
            // Phase 2: Click chatbot button (0.5 seconds)
            cursorX = chatbotPos.x;
            cursorY = chatbotPos.y;
            
            if (frame === phases.move) {
                // Click the chatbot button
                await page.evaluate((x, y) => {
                    const element = document.elementFromPoint(x, y);
                    if (element) {
                        element.click();
                        console.log('Clicked chatbot at:', x, y);
                    }
                }, chatbotPos.x, chatbotPos.y);
                console.log('🖱️ Clicked chatbot button at 2.0s');
            }
            
        } else if (frame < phases.input_move) {
            // Phase 3: Move to input field (1 second)
            const progress = (frame - phases.click) / (phases.input_move - phases.click);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            cursorX = chatbotPos.x + (inputPos.x - chatbotPos.x) * easeProgress;
            cursorY = chatbotPos.y + (inputPos.y - chatbotPos.y) * easeProgress;
            
            if (frame === Math.floor(phases.input_move - 10)) {
                // Click input field near end of movement
                await page.evaluate(() => {
                    const input = document.querySelector('#messageInput') || 
                                 document.querySelector('.chat-input') || 
                                 document.querySelector('input[type="text"]');
                    if (input) {
                        input.focus();
                        input.click();
                        console.log('Clicked input field');
                    }
                });
                console.log('🖱️ Clicked input field at 3.3s');
            }
            
        } else if (frame < phases.typing) {
            // Phase 4: Type message (2.5 seconds)
            cursorX = inputPos.x;
            cursorY = inputPos.y;
            
            const typeProgress = (frame - phases.input_move) / (phases.typing - phases.input_move);
            const message = "I want to buy a house";
            const charCount = Math.floor(typeProgress * message.length);
            
            if (charCount > 0 && charCount <= message.length) {
                await page.evaluate((text) => {
                    const input = document.querySelector('#messageInput') || 
                                 document.querySelector('.chat-input') || 
                                 document.querySelector('input[type="text"]');
                    if (input) {
                        input.value = text;
                        input.setAttribute('value', text);
                    }
                }, message.substring(0, charCount));
            }
            
        } else {
            // Phase 5: Move to send button (1.5 seconds)
            const progress = (frame - phases.typing) / (phases.send - phases.typing);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            cursorX = inputPos.x + (sendPos.x - inputPos.x) * easeProgress;
            cursorY = inputPos.y + (sendPos.y - inputPos.y) * easeProgress;
            
            // Ensure complete message is shown
            await page.evaluate(() => {
                const input = document.querySelector('#messageInput') || 
                             document.querySelector('.chat-input') || 
                             document.querySelector('input[type="text"]');
                if (input) {
                    input.value = "I want to buy a house";
                    input.setAttribute('value', "I want to buy a house");
                }
            });
        }

        // Add cursor to page
        await page.evaluate((x, y) => {
            let cursor = document.getElementById('step4-cursor');
            if (!cursor) {
                cursor = document.createElement('div');
                cursor.id = 'step4-cursor';
                cursor.style.cssText = `
                    position: fixed;
                    width: 20px;
                    height: 20px;
                    background: #007bff;
                    border: 2px solid white;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 10000;
                    transform: translate(-50%, -50%);
                    box-shadow: 0 2px 8px rgba(0,123,255,0.3);
                `;
                document.body.appendChild(cursor);
            }
            cursor.style.left = x + 'px';
            cursor.style.top = y + 'px';
        }, cursorX, cursorY);

        // Take screenshot
        const frameNumber = String(frame + 1).padStart(6, '0');
        await page.screenshot({
            path: path.join(frameDir, `frame_${frameNumber}.png`),
            fullPage: false
        });

        // Log progress every second
        if (frame % 60 === 0) {
            const phase = frame < phases.move ? 'Moving' : 
                         frame < phases.click ? 'Clicking' : 
                         frame < phases.input_move ? 'To Input' : 
                         frame < phases.typing ? 'Typing' : 'To Send';
            console.log(`📸 Frame ${frame + 1}/${totalFrames} | ${currentTime.toFixed(1)}s | Phase: ${phase} | Progress: ${((frame + 1) / totalFrames * 100).toFixed(1)}%`);
        }
    }
    
    console.log('✅ Step 4 Complete interaction generated successfully');
}

function createVideoFromFrames(frameDir, outputPath, videoSettings) {
    return new Promise((resolve, reject) => {
        console.log('🎬 Creating video with FFmpeg...');
        ffmpeg()
            .input(path.join(frameDir, 'frame_%06d.png'))
            .inputFPS(videoSettings.fps)
            .videoCodec(videoSettings.videoCodec)
            .outputOptions([
                `-crf ${videoSettings.videoCRF}`,
                `-preset ${videoSettings.videoPreset}`,
                `-b:v ${videoSettings.videoBitrate}k`,
                '-pix_fmt yuv420p'
            ])
            .fps(videoSettings.fps)
            .output(outputPath)
            .on('start', (commandLine) => {
                console.log('FFmpeg started:', commandLine);
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                    console.log(`FFmpeg progress: ${progress.percent.toFixed(1)}%`);
                }
            })
            .on('end', () => {
                console.log('✅ FFmpeg processing completed');
                resolve();
            })
            .on('error', (err) => {
                console.error('❌ FFmpeg error:', err);
                reject(err);
            })
            .run();
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        server: 'Step 4 Complete Chatbot Server', 
        port: PORT,
        features: ['Complete interaction', 'Proper CSS selectors', 'Perfect timing']
    });
});

app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   Step 4 Complete Chatbot Interaction Server      ║');
    console.log(`║   Server running on port ${PORT}                      ║`);
    console.log(`║   http://localhost:${PORT}                           ║`);
    console.log('║   Features:                                        ║');
    console.log('║   • Complete chatbot interaction                  ║');
    console.log('║   • Proper CSS selectors (#messageInput)          ║');
    console.log('║   • No text cutoff (342px input width)            ║');
    console.log('║   • Perfect timing sequence                       ║');
    console.log('║   • 53.2x53.2px send button                       ║');
    console.log('╚════════════════════════════════════════════════════╝');
});
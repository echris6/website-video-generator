const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

const app = express();
const PORT = 3007;

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
    duration: 10
};

/**
 * Generate video with Step 3 fixed text display (no cutoff)
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

        console.log(`🎥 Step 3 Fixed Server - Starting video generation for: ${business_name}`);

        const timestamp = Date.now();
        const safeBusinessName = business_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `chatbot_step3_fixed_${safeBusinessName}_test_${timestamp}.mp4`;
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

        // Apply Step 3 CSS fixes specifically for text display
        await page.addStyleTag({
            content: `
                /* Step 3 Fixed: Chat input field text cutoff fixes */
                .chat-input, 
                #messageInput, 
                input[type="text"],
                [class*="input"] {
                    min-width: 300px !important;
                    width: 300px !important;
                    padding: 1rem 1.2rem !important;
                    font-size: 14px !important;
                    box-sizing: border-box !important;
                    white-space: nowrap !important;
                    overflow: visible !important;
                    text-overflow: clip !important;
                }
                
                /* Step 3 Fixed: Input container for full width */
                .chat-input-container,
                .input-container,
                [class*="input-container"] {
                    width: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                }
                
                /* Step 3 Fixed: Chat widget width adjustments */
                .chat-widget, 
                .chatbot-widget, 
                [id*="chat"] {
                    min-width: 380px !important;
                }
                
                /* Step 3 Fixed: Disable all animations for stable recording */
                *, *::before, *::after {
                    animation-duration: 0s !important;
                    animation-delay: 0s !important;
                    transition-duration: 0s !important;
                    transition-delay: 0s !important;
                }
                
                /* Step 3 Fixed: Hide cursor blinking */
                input, textarea {
                    caret-color: transparent !important;
                }
                
                /* Step 3 Fixed: Focus state fixes */
                input:focus, textarea:focus {
                    outline: none !important;
                    box-shadow: none !important;
                }
            `
        });

        console.log('✅ Applied Step 3 text cutoff fixes');
        await page.waitForTimeout(2000);

        // Generate Step 3 interaction with focus on text display
        await generateStep3FixedInteraction(page, frameDir, videoSettings);

        // Create video from frames
        await createVideoFromFrames(frameDir, filePath, videoSettings);

        // Clean up
        await fs.rm(frameDir, { recursive: true });

        const stats = await fs.stat(filePath);
        console.log(`✅ Step 3 Fixed Video generated: ${filename} (${formatFileSize(stats.size)})`);

        res.json({
            success: true,
            video_url: `/videos/${filename}`,
            file_name: filename,
            file_size: stats.size,
            file_size_readable: formatFileSize(stats.size),
            features: ['Text cutoff fixed', 'Complete message display', 'Enhanced input field']
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

async function generateStep3FixedInteraction(page, frameDir, videoSettings) {
    const totalFrames = videoSettings.fps * videoSettings.duration; // 600 frames for 10 seconds
    
    // Step 3 timing: FAST cursor movement (2s) → Click (2.5s) → FAST movement to input (1s) → Type complete message (6s)
    const phases = {
        fast_move: 2 * videoSettings.fps,      // 0-120 frames: fast move to chatbot
        click: 2.5 * videoSettings.fps,       // 120-150 frames: click chatbot
        input_move: 3.5 * videoSettings.fps,  // 150-210 frames: fast move to input
        typing: totalFrames                   // 210-600 frames: type complete message
    };

    console.log(`🎬 Step 3 Fixed: Generating ${totalFrames} frames with text cutoff fixes`);
    console.log(`📊 Phases: Fast Move(${phases.fast_move}) → Click(${phases.click}) → Fast Input(${phases.input_move}) → Type(${phases.typing})`);

    const chatbotPos = { x: 1858, y: 1018 };
    const inputPos = { x: 1400, y: 850 };

    for (let frame = 0; frame < totalFrames; frame++) {
        let cursorX = 100, cursorY = 100;
        const currentTime = frame / videoSettings.fps;
        
        if (frame < phases.fast_move) {
            // Phase 1: FAST cursor movement to chatbot (2 seconds)
            const progress = frame / phases.fast_move;
            const easeProgress = 1 - Math.pow(1 - progress, 2); // Faster easing
            cursorX = 100 + (chatbotPos.x - 100) * easeProgress;
            cursorY = 100 + (chatbotPos.y - 100) * easeProgress;
            
        } else if (frame < phases.click) {
            // Phase 2: Click chatbot button (0.5 seconds)
            cursorX = chatbotPos.x;
            cursorY = chatbotPos.y;
            
            if (frame === phases.fast_move) {
                // Click the chatbot button
                await page.evaluate((x, y) => {
                    const element = document.elementFromPoint(x, y);
                    if (element) {
                        element.click();
                    }
                }, chatbotPos.x, chatbotPos.y);
                console.log('🖱️ Clicked chatbot button at 2.0s');
            }
            
        } else if (frame < phases.input_move) {
            // Phase 3: FAST movement to input field (1 second)
            const progress = (frame - phases.click) / (phases.input_move - phases.click);
            const easeProgress = 1 - Math.pow(1 - progress, 2); // Fast easing
            cursorX = chatbotPos.x + (inputPos.x - chatbotPos.x) * easeProgress;
            cursorY = chatbotPos.y + (inputPos.y - chatbotPos.y) * easeProgress;
            
            if (frame === Math.floor(phases.input_move - 10)) {
                // Click input field
                await page.evaluate(() => {
                    const input = document.querySelector('#messageInput') || 
                                 document.querySelector('.chat-input') || 
                                 document.querySelector('input[type="text"]');
                    if (input) {
                        input.focus();
                        input.click();
                    }
                });
                console.log('🖱️ Clicked input field at 3.3s');
            }
            
        } else {
            // Phase 4: Type complete message without cutoff (6 seconds)
            cursorX = inputPos.x;
            cursorY = inputPos.y;
            
            const typeProgress = (frame - phases.input_move) / (phases.typing - phases.input_move);
            const message = "I want to buy a house";
            const charCount = Math.floor(typeProgress * message.length);
            
            if (charCount > 0 && charCount <= message.length) {
                const currentText = message.substring(0, charCount);
                await page.evaluate((text) => {
                    const input = document.querySelector('#messageInput') || 
                                 document.querySelector('.chat-input') || 
                                 document.querySelector('input[type="text"]');
                    if (input) {
                        input.value = text;
                        input.setAttribute('value', text);
                        
                        // Ensure text is visible and not cut off
                        input.style.width = 'auto';
                        input.style.minWidth = '300px';
                        input.style.textOverflow = 'clip';
                        input.style.overflow = 'visible';
                        input.style.whiteSpace = 'nowrap';
                    }
                }, currentText);
                
                // Log progress for the message "I want to buy a house"
                if (charCount === 7) console.log('📝 Typed: "I want " (no cutoff)');
                if (charCount === 14) console.log('📝 Typed: "I want to buy " (no cutoff)');
                if (charCount === 21) console.log('📝 Typed: "I want to buy a house" (complete, no cutoff)');
            }
        }

        // Add cursor to page
        await page.evaluate((x, y) => {
            let cursor = document.getElementById('step3-cursor');
            if (!cursor) {
                cursor = document.createElement('div');
                cursor.id = 'step3-cursor';
                cursor.style.cssText = `
                    position: fixed;
                    width: 18px;
                    height: 18px;
                    background: #28a745;
                    border: 2px solid white;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 10000;
                    transform: translate(-50%, -50%);
                    box-shadow: 0 2px 6px rgba(40,167,69,0.3);
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
            const phase = frame < phases.fast_move ? 'Fast Moving' : 
                         frame < phases.click ? 'Clicking' : 
                         frame < phases.input_move ? 'Fast To Input' : 'Typing (No Cutoff)';
            console.log(`📸 Frame ${frame + 1}/${totalFrames} | ${currentTime.toFixed(1)}s | Phase: ${phase} | Progress: ${((frame + 1) / totalFrames * 100).toFixed(1)}%`);
        }
    }
    
    console.log('✅ Step 3 Fixed interaction completed - no text cutoff!');
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
        server: 'Step 3 Fixed Text Display Server', 
        port: PORT,
        features: ['Text cutoff fixed', 'Complete message display', 'Fast cursor movement']
    });
});

app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   Step 3 Fixed Text Display Server                ║');
    console.log(`║   Server running on port ${PORT}                      ║`);
    console.log(`║   http://localhost:${PORT}                           ║`);
    console.log('║   Features:                                        ║');
    console.log('║   • Fixed text cutoff issues                      ║');
    console.log('║   • Complete "I want to buy a house" display      ║');
    console.log('║   • Enhanced input field (300px min-width)        ║');
    console.log('║   • Fast cursor movement timing                   ║');
    console.log('║   • 10-second video duration                      ║');
    console.log('╚════════════════════════════════════════════════════╝');
});
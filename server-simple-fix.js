const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

const app = express();
const PORT = 3011;

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
 * Generate video with simple chatbot UI fixes
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

        console.log(`🎥 Simple Fix Server - Starting video generation for: ${business_name}`);

        const timestamp = Date.now();
        const safeBusinessName = business_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `simple_fix_${safeBusinessName}_test_${timestamp}.mp4`;
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

        // Set HTML content and apply runtime fixes for chatbot UI
        await page.setContent(html_content, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 45000
        });

        // Apply runtime CSS fixes for chatbot UI issues
        await page.addStyleTag({
            content: `
                /* Simple Fix: Chat widget width fix */
                .chat-widget, .chatbot-widget, [id*="chat"] {
                    width: 420px !important;
                    min-width: 420px !important;
                }
                
                /* Simple Fix: Input field width fix */
                .chat-input, #messageInput, [class*="input"] {
                    width: 320px !important;
                    flex: none !important;
                    min-width: 320px !important;
                }
                
                /* Simple Fix: Send button size fix */
                .send-button, .chat-send, [class*="send"] {
                    width: 50px !important;
                    height: 50px !important;
                    min-width: 50px !important;
                    min-height: 50px !important;
                }
                
                /* Disable all animations for stable recording */
                *, *::before, *::after {
                    animation-duration: 0s !important;
                    animation-delay: 0s !important;
                    transition-duration: 0s !important;
                    transition-delay: 0s !important;
                }
            `
        });

        console.log('✅ Applied runtime UI fixes');
        await page.waitForTimeout(2000);

        // Find chatbot button
        const chatbotButton = await page.evaluate(() => {
            const selectors = [
                '[class*="chat"]',
                '[id*="chat"]',
                '.chatbot-button',
                'button[aria-label*="chat"]'
            ];
            
            for (let selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    return {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    };
                }
            }
            
            // Default position if not found
            return { x: 1858, y: 1018 };
        });

        console.log(`📍 Chatbot button found at: (${chatbotButton.x}, ${chatbotButton.y})`);

        // Generate frames with cursor movement and interaction
        await generateFramesWithInteraction(page, frameDir, videoSettings, chatbotButton);

        // Create video from frames
        await createVideoFromFrames(frameDir, filePath, videoSettings);

        // Clean up
        await fs.rm(frameDir, { recursive: true });

        const stats = await fs.stat(filePath);
        console.log(`✅ Video generated: ${filename} (${formatFileSize(stats.size)})`);

        res.json({
            success: true,
            video_url: `/videos/${filename}`,
            file_name: filename,
            file_size: stats.size,
            file_size_readable: formatFileSize(stats.size)
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

async function generateFramesWithInteraction(page, frameDir, videoSettings, chatbotPos) {
    const totalFrames = videoSettings.fps * videoSettings.duration; // 9 seconds
    const phases = {
        cursor_move: Math.floor(totalFrames * 0.3), // 30% - cursor movement
        click_and_open: Math.floor(totalFrames * 0.2), // 20% - click and open
        typing: Math.floor(totalFrames * 0.4), // 40% - typing
        final: totalFrames // remaining - final state
    };

    console.log(`🎬 Generating ${totalFrames} frames with interaction`);

    for (let frame = 0; frame < totalFrames; frame++) {
        let cursorX = 100, cursorY = 100;
        
        if (frame < phases.cursor_move) {
            // Move cursor to chatbot button
            const progress = frame / phases.cursor_move;
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            cursorX = 100 + (chatbotPos.x - 100) * easeProgress;
            cursorY = 100 + (chatbotPos.y - 100) * easeProgress;
        } else if (frame < phases.click_and_open) {
            // At chatbot button, simulate click
            cursorX = chatbotPos.x;
            cursorY = chatbotPos.y;
            
            if (frame === phases.cursor_move) {
                // Click the chatbot button
                await page.click(`body`, { button: 'left' });
                await page.evaluate((x, y) => {
                    const element = document.elementFromPoint(x, y);
                    if (element) element.click();
                }, chatbotPos.x, chatbotPos.y);
                console.log('🖱️ Clicked chatbot button');
            }
        } else if (frame < phases.typing) {
            // Move to input field and type
            const inputProgress = (frame - phases.click_and_open) / (phases.typing - phases.click_and_open);
            
            if (inputProgress < 0.2) {
                // Move to input field
                const inputX = 1400; // Approximate input field position
                const inputY = 800;
                const moveProgress = inputProgress / 0.2;
                cursorX = chatbotPos.x + (inputX - chatbotPos.x) * moveProgress;
                cursorY = chatbotPos.y + (inputY - chatbotPos.y) * moveProgress;
                
                if (Math.abs(moveProgress - 1) < 0.1) {
                    // Click input field
                    await page.evaluate(() => {
                        const input = document.querySelector('#messageInput, .chat-input, input[type="text"]');
                        if (input) {
                            input.focus();
                            input.click();
                        }
                    });
                }
            } else {
                // At input field, simulate typing
                cursorX = 1400;
                cursorY = 800;
                
                const typeProgress = (inputProgress - 0.2) / 0.8;
                const message = "I want to buy a house";
                const charCount = Math.floor(typeProgress * message.length);
                
                if (charCount > 0 && charCount <= message.length) {
                    await page.evaluate((text) => {
                        const input = document.querySelector('#messageInput, .chat-input, input[type="text"]');
                        if (input) {
                            input.value = text;
                        }
                    }, message.substring(0, charCount));
                }
            }
        } else {
            // Final state - show complete message
            cursorX = 1500; // Near send button
            cursorY = 800;
            
            await page.evaluate(() => {
                const input = document.querySelector('#messageInput, .chat-input, input[type="text"]');
                if (input) {
                    input.value = "I want to buy a house";
                }
            });
        }

        // Add cursor to page
        await page.evaluate((x, y) => {
            let cursor = document.getElementById('custom-cursor');
            if (!cursor) {
                cursor = document.createElement('div');
                cursor.id = 'custom-cursor';
                cursor.style.cssText = `
                    position: fixed;
                    width: 20px;
                    height: 20px;
                    background: black;
                    border: 2px solid white;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9999;
                    transform: translate(-50%, -50%);
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

        if (frame % 60 === 0) {
            console.log(`📸 Frame ${frame + 1}/${totalFrames} (${((frame + 1) / totalFrames * 100).toFixed(1)}%)`);
        }
    }
}

function createVideoFromFrames(frameDir, outputPath, videoSettings) {
    return new Promise((resolve, reject) => {
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
            .on('end', resolve)
            .on('error', reject)
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
    res.json({ status: 'OK', server: 'Simple Fix Server', port: PORT });
});

app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   Simple Fix Chatbot Server                       ║');
    console.log(`║   Server running on port ${PORT}                      ║`);
    console.log(`║   http://localhost:${PORT}                           ║`);
    console.log('║   Features: Runtime UI fixes, cursor interaction  ║');
    console.log('╚════════════════════════════════════════════════════╝');
});
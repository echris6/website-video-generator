#!/usr/bin/env node

// DISABLED: This server conflicts with server-hvac-step5.js and causes multiple videos
// Use server-hvac-step5.js instead for HVAC video generation
console.log('⚠️  server-final-demo.js is DISABLED to prevent multiple video generation');
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
const PORT = 3012;

app.use(express.json({ limit: '50mb' }));
app.use(express.static('videos'));

// Load testttt.html (no changes)
const websiteTemplate = fs.readFileSync(path.join(__dirname, 'testttt.html'), 'utf8');

// Niche-specific questions
const nicheQuestions = {
    real_estate: "What properties do you have available?",
    medical: "What services do you offer?",
    restaurant: "What's on your menu today?",
    ecommerce: "What are your best products?",
    fitness: "What training programs do you have?",
    default: "How can you help me?"
};

console.log(`
╔════════════════════════════════════════════════════╗
║           FINAL DEMO - CHATBOT + SCROLL           ║
║              Running on port ${PORT}                    ║
║                                                    ║
║  🎯 Working screenshot method + chatbot            ║
║  📝 POST /generate-video - Generate video          ║
║  ❤️  GET  /health - Health check                   ║
╚════════════════════════════════════════════════════╝
`);

async function generateVideo(businessName = 'Demo Site', niche = 'real_estate') {
    console.log(`\n🎥 FINAL DEMO - CHATBOT + SCROLL`);
    console.log(`📋 Business: ${businessName}`);
    console.log(`🏢 Niche: ${niche}`);
    
    const question = nicheQuestions[niche] || nicheQuestions.default;
    console.log(`💬 Will ask: "${question}"`);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        console.log(`🚀 Loading website...`);
        await page.setContent(websiteTemplate, { waitUntil: 'networkidle0' });
        await delay(3000); // Let it stabilize

        // Get page dimensions for scrolling
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        const viewportHeight = 1080;
        const totalScrollable = Math.max(0, pageHeight - viewportHeight);
        
        console.log(`📏 Page height: ${pageHeight}px, Scrollable: ${totalScrollable}px`);

        const frames = [];
        const fps = 30; // Keep it smooth but reasonable
        
        // Phase 1: Chatbot interaction (0-8 seconds)
        console.log(`💬 Phase 1: Chatbot interaction (0-8s)`);
        
        for (let second = 0; second < 8; second++) {
            for (let frame = 0; frame < fps; frame++) {
                const totalFrame = second * fps + frame;
                const timeInSeconds = totalFrame / fps;
                
                // At 1 second: Click chatbot
                if (timeInSeconds >= 1 && timeInSeconds < 1.1) {
                    await page.evaluate(() => {
                        const chatToggle = document.querySelector('#chatToggle');
                        if (chatToggle) {
                            chatToggle.click();
                            console.log('✅ Chatbot opened');
                        }
                    });
                }
                
                // At 3 seconds: Type question
                if (timeInSeconds >= 3 && timeInSeconds < 3.1) {
                    await page.evaluate((q) => {
                        const input = document.querySelector('#messageInput');
                        if (input) {
                            input.value = q;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            console.log('✅ Question typed:', q);
                        }
                    }, question);
                }
                
                // At 4 seconds: Send message
                if (timeInSeconds >= 4 && timeInSeconds < 4.1) {
                    await page.evaluate(() => {
                        const sendButton = document.querySelector('#sendButton');
                        if (sendButton) {
                            sendButton.click();
                            console.log('✅ Message sent');
                        }
                    });
                }
                
                // At 6 seconds: Close chatbot
                if (timeInSeconds >= 6 && timeInSeconds < 6.1) {
                    await page.evaluate(() => {
                        const chatToggle = document.querySelector('#chatToggle');
                        if (chatToggle) {
                            chatToggle.click();
                            console.log('✅ Chatbot closed');
                        }
                    });
                }
                
                // Take screenshot
                await page.evaluate(() => window.scrollTo(0, 0)); // Stay at top during chatbot
                const screenshot = await page.screenshot({ 
                    type: 'png',
                    clip: { x: 0, y: 0, width: 1920, height: 1080 }
                });
                frames.push(screenshot);
            }
            
            if (second % 2 === 0) {
                console.log(`  📸 Chatbot phase: ${second + 1}/8 seconds`);
            }
        }

        // Phase 2: Scroll through sections (8-20 seconds)
        console.log(`📜 Phase 2: Scrolling through sections (8-20s)`);
        const scrollDuration = 12; // 12 seconds of scrolling
        const scrollFrames = scrollDuration * fps;
        
        for (let frame = 0; frame < scrollFrames; frame++) {
            const progress = frame / (scrollFrames - 1);
            const scrollPosition = Math.floor(totalScrollable * progress);
            
            await page.evaluate((pos) => window.scrollTo(0, pos), scrollPosition);
            
            const screenshot = await page.screenshot({ 
                type: 'png',
                clip: { x: 0, y: 0, width: 1920, height: 1080 }
            });
            frames.push(screenshot);
            
            if (frame % (fps * 2) === 0) {
                const second = Math.floor(frame / fps) + 8;
                console.log(`  📸 Scrolling: ${second}/20 seconds (${Math.floor(progress * 100)}%)`);
            }
        }

        console.log(`✅ Captured ${frames.length} frames total`);

        // Create video
        const timestamp = Date.now();
        const filename = `final_demo_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
        const outputPath = path.join(__dirname, 'videos', filename);

        console.log(`🎬 Creating video...`);
        
        // Save frames temporarily
        const frameDir = path.join(__dirname, 'temp_frames');
        if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir);
        
        for (let i = 0; i < frames.length; i++) {
            fs.writeFileSync(path.join(frameDir, `frame_${i.toString().padStart(6, '0')}.png`), frames[i]);
        }

        // Create video with ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(path.join(frameDir, 'frame_%06d.png'))
                .inputFPS(fps)
                .outputOptions([
                    '-c:v libx264',
                    '-preset medium',
                    '-crf 23',
                    '-pix_fmt yuv420p',
                    '-movflags +faststart'
                ])
                .output(outputPath)
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

        // Clean up temp frames
        console.log(`🧹 Cleaning up frames...`);
        fs.readdirSync(frameDir).forEach(file => {
            fs.unlinkSync(path.join(frameDir, file));
        });
        fs.rmdirSync(frameDir);

        const stats = fs.statSync(outputPath);
        const fileSize = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`✅ SUCCESS! Video: ${filename} (${fileSize} MB)`);
        
        return { 
            success: true, 
            filename, 
            fileSize,
            duration: '20 seconds',
            phases: 'Chatbot interaction (8s) + Page scroll (12s)'
        };

    } catch (error) {
        console.error(`❌ ERROR: ${error.message}`);
        throw error;
    } finally {
        await browser.close();
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', server: 'final-demo', port: PORT });
});

// Video generation endpoint
app.post('/generate-video', async (req, res) => {
    try {
        const { businessName = 'Real Estate Demo', niche = 'real_estate' } = req.body;
        const result = await generateVideo(businessName, niche);
        res.json(result);
    } catch (error) {
        console.error('Video generation failed:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Final Demo","niche":"real_estate"}'`);
}); 
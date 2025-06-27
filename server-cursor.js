const express = require('express');
const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Universal delay function compatible with all Puppeteer versions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const PORT = 3003; // Different port to avoid conflicts

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
║              CURSOR VIDEO GENERATOR               ║
║              Running on port ${PORT}                    ║
║                                                    ║
║  🖱️ Static cursor.png overlay                      ║
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
    
    // 🖱️ CURSOR: Add cursor overlay with movement capability
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
        
        // Simple static cursor - ULTRA SAFE VERSION
        window.updateCursorForFrame = function(frameIndex, totalFrames) {
            // Phase 1 ONLY: Static cursor at hero position throughout entire video
            window.moveCursorTo(800, 400);
        };
        </script>
        `;
        customizedHtml = customizedHtml.replace('</body>', cursorHtml + '</body>');
    }
    
    return customizedHtml;
}

async function generateVideo(businessName, niche = 'real_estate') {
    const timestamp = Date.now();
    const videoFilename = `cursor_${businessName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`;
    const framesDir = path.join(__dirname, 'frames', `temp_${timestamp}`);
    
    console.log(`🎥 CURSOR VIDEO GENERATION`);
    console.log(`📋 Business: ${businessName}`);
    console.log(`🏢 Niche: ${niche}`);
    console.log(`🖱️ Cursor: Static overlay at (800, 400)`);
    
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
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log(`📄 Loading website content...`);
        let customizedHtml = customizeWebsite(niche, businessName);
        
        // 🔧 FIX: Disable reveal animations for Puppeteer
        customizedHtml = customizedHtml.replace(
            '.reveal-element {',
            '.reveal-element { opacity: 1 !important; transform: translateY(0) !important; /* FIXED FOR PUPPETEER */'
        );
        
        await page.setContent(customizedHtml, { waitUntil: 'networkidle0' });
        
        // ✅ ENHANCED WAITING - Ensure everything is fully loaded
        console.log(`⏳ Waiting for fonts and CSS to fully load...`);
        
        // Wait for Google Fonts to load
        await page.evaluateOnNewDocument(() => {
            document.fonts.ready.then(() => {
                console.log('Fonts loaded!');
            });
        });
        
        // Wait for fonts to load
        await page.evaluate(() => {
            return document.fonts.ready;
        });
        
        // Wait for all images to load
        await page.evaluate(() => {
            return Promise.all(
                Array.from(document.images)
                    .filter(img => !img.complete)
                    .map(img => new Promise(resolve => {
                        img.onload = img.onerror = resolve;
                    }))
            );
        });
        
        // Additional wait for CSS animations and layout to settle
        await delay(3000);
        
        // Wait for specific content sections to be visible
        await page.waitForSelector('.hero', { visible: true, timeout: 5000 });
        await page.waitForSelector('.property-showcase', { visible: true, timeout: 5000 });
        await page.waitForSelector('.services', { visible: true, timeout: 5000 });
        await page.waitForSelector('.contact', { visible: true, timeout: 5000 });
        
        // 🔧 FIX: Force reveal all elements immediately
        await page.evaluate(() => {
            const revealElements = document.querySelectorAll('.reveal-element');
            revealElements.forEach(element => {
                element.classList.add('revealed');
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            });
        });
        
        // Final wait to ensure everything is settled
        await delay(2000);
        
        console.log(`✅ All content fully loaded and revealed!`);
        
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
        console.log(`📐 Using screenshot cropping method`);
        
        // Take one full page screenshot with cursor
        console.log(`📸 Taking full page screenshot...`);
        const fullScreenshot = await page.screenshot({
            fullPage: true,
            type: 'png'
        });
        
        console.log(`✅ Full page screenshot captured`);
        
        // Generate frames by cropping the full screenshot
        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            const progress = frameIndex / (totalFrames - 1);
            const cropY = Math.floor(progress * scrollableHeight);
            
            const framePath = path.join(framesDir, `frame_${String(frameIndex + 1).padStart(6, '0')}.png`);
            
            // Crop the screenshot
            await sharp(fullScreenshot)
                .extract({
                    left: 0,
                    top: cropY,
                    width: 1920,
                    height: 1080
                })
                .png()
                .toFile(framePath);
            
            // Progress logging
            if ((frameIndex + 1) % 300 === 0 || frameIndex + 1 === totalFrames) {
                const percentage = ((frameIndex + 1) / totalFrames * 100).toFixed(1);
                const seconds = ((frameIndex + 1) / 60).toFixed(1);
                console.log(`  📸 Frame ${frameIndex + 1}/${totalFrames} (${percentage}%) - ${seconds}s`);
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
            size: fileSizeMB + ' MB'
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
        const { businessName = 'Cursor Test', niche = 'real_estate' } = req.body;
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
    console.log(`👉 Ready! Test with: curl -X POST http://localhost:${PORT}/generate-video -H "Content-Type: application/json" -d '{"businessName":"Static Cursor Test","niche":"real_estate"}'`);
});

// Ready for requests - no auto-generation 
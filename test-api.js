const fs = require('fs').promises;
const path = require('path');

// API endpoint (change this if your server is running on a different port)
const API_URL = 'http://localhost:3000';

async function testVideoGeneration() {
    try {
        console.log('🚀 Testing Website Scrolling Video Generator API...\n');

        // Step 1: Check health endpoint
        console.log('1️⃣  Checking API health...');
        const healthResponse = await fetch(`${API_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check response:', healthData);
        console.log('');

        // Step 2: Read the test HTML file
        console.log('2️⃣  Reading test HTML file...');
        const htmlContent = await fs.readFile(path.join(__dirname, 'test-website.html'), 'utf-8');
        console.log('✅ HTML content loaded (', htmlContent.length, 'characters)');
        console.log('');

        // Step 3: Generate video
        console.log('3️⃣  Generating video (this may take 45-60 seconds)...');
        const startTime = Date.now();
        
        const videoResponse = await fetch(`${API_URL}/generate-video`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                html_content: htmlContent,
                business_name: 'Test Business Demo',
                settings: {
                    fps: 60,
                    width: 1920,
                    height: 1080
                }
            })
        });

        const videoData = await videoResponse.json();
        const duration = (Date.now() - startTime) / 1000;

        if (videoData.success) {
            console.log('✅ Video generated successfully!');
            console.log('   - File:', videoData.file_name);
            console.log('   - Size:', videoData.file_size_readable);
            console.log('   - URL:', videoData.video_url);
            console.log('   - Generation time:', duration.toFixed(2), 'seconds');
            console.log('');

            // Step 4: List all videos
            console.log('4️⃣  Listing all generated videos...');
            const listResponse = await fetch(`${API_URL}/videos-list`);
            const listData = await listResponse.json();
            console.log('✅ Found', listData.count, 'video(s):');
            listData.videos.forEach((video, index) => {
                console.log(`   ${index + 1}. ${video.name} (${video.sizeReadable})`);
            });
            console.log('');

            console.log('🎉 All tests completed successfully!');
            console.log(`\n📹 View your video at: ${API_URL}${videoData.video_url}`);
            
        } else {
            console.error('❌ Video generation failed:', videoData);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.cause) {
            console.error('   Cause:', error.cause);
        }
        console.error('\n💡 Make sure the server is running with: npm start');
    }
}

// Alternative test using a simple HTML string
async function testWithSimpleHTML() {
    try {
        console.log('\n🧪 Testing with simple HTML...\n');

        const simpleHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; }
                    section { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                    .hero { background: #4CAF50; color: white; }
                    .services { background: #f0f0f0; }
                    .about { background: white; }
                    .contact { background: #333; color: white; }
                </style>
            </head>
            <body>
                <section class="hero"><h1>Welcome!</h1></section>
                <section class="services"><h2>Our Services</h2></section>
                <section class="about"><h2>About Us</h2></section>
                <section class="contact"><h2>Contact Us</h2></section>
            </body>
            </html>
        `;

        const response = await fetch(`${API_URL}/generate-video`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                html_content: simpleHTML,
                business_name: 'Simple Test',
            })
        });

        const data = await response.json();
        console.log('Result:', data);

    } catch (error) {
        console.error('Simple test failed:', error.message);
    }
}

// Run the tests
console.log(`
╔════════════════════════════════════════════════════╗
║   Website Scrolling Video Generator API Test       ║
╚════════════════════════════════════════════════════╝
`);

// Check if we should run the simple test
const args = process.argv.slice(2);
if (args.includes('--simple')) {
    testWithSimpleHTML();
} else {
    testVideoGeneration();
    console.log('\n💡 Tip: Run with --simple flag for a quick test with minimal HTML');
} 
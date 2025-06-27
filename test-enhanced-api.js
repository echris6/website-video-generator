const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// API endpoint
const API_URL = 'http://localhost:3000';

/**
 * Test the enhanced video generation with chatbot demo
 */
async function testEnhancedVideoGeneration(niche = 'real_estate') {
    try {
        console.log(`\n🚀 Testing enhanced video generation for ${niche} niche...`);
        
        // Read the test HTML file
        const htmlContent = await fs.readFile('testttt.html', 'utf8');
        
        // Prepare the request data
        const requestData = {
            html_content: htmlContent,
            business_name: `${niche.replace('_', ' ')} Demo`,
            niche: niche,
            settings: {
                width: 1920,
                height: 1080,
                fps: 60,
                duration: 30,
                enableChatbotDemo: true,
                videoCRF: 18,
                videoPreset: 'fast',
                videoBitrate: 3000
            }
        };
        
        console.log('📤 Sending request to generate video...');
        console.log(`   - Business: ${requestData.business_name}`);
        console.log(`   - Niche: ${niche}`);
        console.log(`   - Chatbot Demo: ${requestData.settings.enableChatbotDemo ? 'Enabled' : 'Disabled'}`);
        console.log(`   - Duration: ${requestData.settings.duration} seconds`);
        
        // Make the API request
        const response = await axios.post(`${API_URL}/generate-video`, requestData, {
            headers: {
                'Content-Type': 'application/json'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        if (response.data.success) {
            console.log('\n✅ Video generated successfully!');
            console.log(`📹 Video URL: ${API_URL}${response.data.video_url}`);
            console.log(`📄 File name: ${response.data.file_name}`);
            console.log(`📊 File size: ${response.data.file_size_readable}`);
            console.log(`⏱️ Duration: ${response.data.duration}`);
            
            if (response.data.features) {
                console.log('\n🎯 Features used:');
                console.log(`   - Chatbot demo: ${response.data.features.chatbot_demo ? '✅' : '❌'}`);
                console.log(`   - Cursor simulation: ${response.data.features.cursor_simulation ? '✅' : '❌'}`);
                console.log(`   - Smooth scrolling: ${response.data.features.smooth_scrolling ? '✅' : '❌'}`);
                console.log(`   - Niche: ${response.data.features.niche}`);
            }
            
            return response.data;
        } else {
            console.error('❌ Video generation failed:', response.data.error);
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

/**
 * Test all available niches
 */
async function testAllNiches() {
    const niches = ['medical_spa', 'real_estate', 'hvac', 'cosmetic_dental'];
    
    console.log('🧪 Testing all available niches...\n');
    
    for (const niche of niches) {
        await testEnhancedVideoGeneration(niche);
        
        // Wait 2 seconds between tests
        if (niche !== niches[niches.length - 1]) {
            console.log('\n⏳ Waiting 2 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

/**
 * Test video generation without chatbot demo
 */
async function testWithoutChatbot() {
    try {
        console.log('\n🚀 Testing video generation WITHOUT chatbot demo...');
        
        const htmlContent = await fs.readFile('testttt.html', 'utf8');
        
        const requestData = {
            html_content: htmlContent,
            business_name: 'Simple Scroll Demo',
            niche: 'real_estate',
            settings: {
                width: 1920,
                height: 1080,
                fps: 60,
                duration: 20,
                enableChatbotDemo: false,  // Disable chatbot demo
                videoCRF: 18,
                videoPreset: 'fast',
                videoBitrate: 3000
            }
        };
        
        console.log('📤 Sending request for simple scroll video...');
        
        const response = await axios.post(`${API_URL}/generate-video`, requestData, {
            headers: {
                'Content-Type': 'application/json'
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        if (response.data.success) {
            console.log('\n✅ Simple scroll video generated successfully!');
            console.log(`📹 Video URL: ${API_URL}${response.data.video_url}`);
            return response.data;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

/**
 * Check server health
 */
async function checkHealth() {
    try {
        const response = await axios.get(`${API_URL}/health`);
        console.log('🏥 Server Health Check:');
        console.log(`   - Status: ${response.data.status}`);
        console.log(`   - Message: ${response.data.message}`);
        console.log(`   - Features: ${response.data.features.join(', ')}`);
        return true;
    } catch (error) {
        console.error('❌ Server is not responding:', error.message);
        return false;
    }
}

/**
 * Main test function
 */
async function main() {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   Enhanced Video Generation API Test               ║');
    console.log('║   Testing Chatbot Demo & Cursor Simulation         ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    
    // Check server health first
    const isHealthy = await checkHealth();
    if (!isHealthy) {
        console.error('\n❌ Server is not running. Please start the server first.');
        process.exit(1);
    }
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'all':
            // Test all niches
            await testAllNiches();
            break;
            
        case 'simple':
            // Test without chatbot
            await testWithoutChatbot();
            break;
            
        case 'medical':
            await testEnhancedVideoGeneration('medical_spa');
            break;
            
        case 'real-estate':
            await testEnhancedVideoGeneration('real_estate');
            break;
            
        case 'hvac':
            await testEnhancedVideoGeneration('hvac');
            break;
            
        case 'dental':
            await testEnhancedVideoGeneration('cosmetic_dental');
            break;
            
        default:
            console.log('Usage: node test-enhanced-api.js [command]');
            console.log('\nCommands:');
            console.log('  all         - Test all niches');
            console.log('  simple      - Test without chatbot demo');
            console.log('  medical     - Test medical spa niche');
            console.log('  real-estate - Test real estate niche');
            console.log('  hvac        - Test HVAC niche');
            console.log('  dental      - Test cosmetic dental niche');
            console.log('\nExample: node test-enhanced-api.js real-estate');
            
            // Default to real estate test
            console.log('\n🎯 Running default test (real estate with chatbot)...');
            await testEnhancedVideoGeneration('real_estate');
    }
    
    console.log('\n✨ Test completed!');
}

// Run the tests
main().catch(console.error); 
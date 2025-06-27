const axios = require('axios');

const SERVER_URL = 'http://localhost:3004';

async function testStep1() {
    console.log('🧪 Testing Chatbot Step 1 - Cursor Movement to Chatbot Button');
    console.log('⏳ Starting video generation...');
    
    try {
        const response = await axios.post(`${SERVER_URL}/generate-video`, {
            businessName: 'Step 1 Test',
            niche: 'real_estate'
        });
        
        if (response.data.success) {
            console.log('✅ SUCCESS!');
            console.log(`📁 Video: ${response.data.filename}`);
            console.log(`📊 Size: ${response.data.size}`);
            
            if (response.data.chatbotInfo) {
                console.log(`🎯 Chatbot button position: (${Math.round(response.data.chatbotInfo.x)}, ${Math.round(response.data.chatbotInfo.y)})`);
            }
            
            console.log(`\n🎥 Your video is ready in the videos/ folder!`);
            console.log(`👀 Expected behavior:`);
            console.log(`   • 0-10s: Cursor at hero position (800, 400)`);
            console.log(`   • 10-20s: Cursor moves smoothly toward chatbot button`);
            console.log(`   • 20-30s: Cursor stays at chatbot button`);
        } else {
            console.error('❌ Failed:', response.data.error);
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Server not running! Start it with: node server-chatbot-step1.js');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// Run test
testStep1(); 
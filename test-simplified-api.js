const axios = require('axios');

console.log('╔════════════════════════════════════════════════════╗');
console.log('║   Testing Simplified Enhanced Video Generator      ║');
console.log('╚════════════════════════════════════════════════════╝\n');

const BASE_URL = 'http://localhost:3000';

// Test configurations
const testCases = [
    { businessName: 'Real Estate Demo', niche: 'real_estate' },
    { businessName: 'Medical Spa Demo', niche: 'medical' },
    { businessName: 'HVAC Services Demo', niche: 'hvac' },
    { businessName: 'Dental Clinic Demo', niche: 'dental' }
];

// Command line argument handling
const args = process.argv.slice(2);
const command = args[0];

// Determine which test to run
let testsToRun = [];
if (command === 'all') {
    testsToRun = testCases;
} else if (command === 'real-estate') {
    testsToRun = [testCases[0]];
} else if (command === 'medical') {
    testsToRun = [testCases[1]];
} else if (command === 'hvac') {
    testsToRun = [testCases[2]];
} else if (command === 'dental') {
    testsToRun = [testCases[3]];
} else {
    console.log('Usage: node test-simplified-api.js [command]');
    console.log('\nCommands:');
    console.log('  all         - Test all niches');
    console.log('  real-estate - Test real estate niche');
    console.log('  medical     - Test medical spa niche');
    console.log('  hvac        - Test HVAC niche');
    console.log('  dental      - Test dental niche');
    process.exit(0);
}

async function testVideoGeneration(config) {
    console.log(`\n🚀 Testing ${config.niche} niche...`);
    console.log(`📤 Sending request to generate video...`);
    console.log(`   - Business: ${config.businessName}`);
    console.log(`   - Niche: ${config.niche}`);
    
    try {
        const startTime = Date.now();
        
        const response = await axios.post(`${BASE_URL}/generate-video`, config);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);
        
        console.log('\n✅ Video generated successfully!');
        console.log(`   - File: ${response.data.file_name}`);
        console.log(`   - Size: ${response.data.file_size_mb} MB`);
        console.log(`   - Duration: ${response.data.duration}`);
        console.log(`   - Generation time: ${duration} seconds`);
        console.log(`   - URL: ${response.data.video_url}`);
        
        return response.data;
    } catch (error) {
        console.error('\n❌ Error generating video:', error.response?.data || error.message);
        return null;
    }
}

async function runTests() {
    // Check server health first
    try {
        const health = await axios.get(`${BASE_URL}/health`);
        console.log('🏥 Server Health Check:');
        console.log(`   - Status: ${health.data.status}`);
        console.log(`   - Message: ${health.data.message}`);
    } catch (error) {
        console.error('❌ Server is not running! Start it with: node server-enhanced-simple.js');
        process.exit(1);
    }
    
    // Run selected tests
    console.log(`\n📹 Running ${testsToRun.length} test(s)...\n`);
    
    for (const testCase of testsToRun) {
        await testVideoGeneration(testCase);
        
        // Wait between tests
        if (testsToRun.length > 1) {
            console.log('\n⏳ Waiting 5 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    console.log('\n✅ All tests completed!');
}

// Run the tests
runTests(); 
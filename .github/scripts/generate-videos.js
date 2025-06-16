#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const RESULTS_FILE = path.join('.github', 'scripts', 'processing-results.json');

async function waitForServer(maxAttempts = 30) {
  console.log('🔍 Waiting for server to be ready...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      if (response.status === 200) {
        console.log('✅ Server is ready!');
        return true;
      }
    } catch (error) {
      console.log(`Attempt ${attempt}/${maxAttempts}: Server not ready yet...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
  }
  
  throw new Error('❌ Server failed to start within the expected time');
}

async function generateVideo(website) {
  const { name, htmlFilePath } = website;
  
  console.log(`\n🎬 Generating video for: ${name}`);
  console.log(`📄 HTML file: ${htmlFilePath}`);
  
  try {
    // Read the HTML content
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    // Prepare the request payload
    const payload = {
      name: name,
      html: htmlContent
    };
    
    console.log(`📤 Sending request to video generation API...`);
    
    // Make the API request
    const response = await axios.post(`${API_BASE_URL}/generate-video`, payload, {
      timeout: 300000, // 5 minutes timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      const { filename, size, message } = response.data;
      console.log(`✅ Video generated successfully:`);
      console.log(`   📹 Filename: ${filename}`);
      console.log(`   📊 Size: ${size}`);
      console.log(`   💬 Message: ${message}`);
      
      return {
        success: true,
        filename,
        size,
        message
      };
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
    
  } catch (error) {
    console.error(`❌ Error generating video for ${name}:`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error(`   Request error: ${error.message}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

async function generateAllVideos() {
  console.log('🚀 Starting video generation process...\n');
  
  // Check if processing results exist
  if (!fs.existsSync(RESULTS_FILE)) {
    throw new Error(`❌ Processing results file not found: ${RESULTS_FILE}`);
  }
  
  // Read the processed website data
  const websites = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
  console.log(`📋 Found ${websites.length} websites to process`);
  
  if (websites.length === 0) {
    console.log('ℹ️  No websites to process');
    return;
  }
  
  // Wait for server to be ready
  await waitForServer();
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  
  // Process each website
  for (const website of websites) {
    const result = await generateVideo(website);
    results.push({
      website: website.name,
      category: website.category,
      ...result
    });
    
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // Small delay between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save generation results
  const summaryPath = path.join('.github', 'scripts', 'generation-results.json');
  const summary = {
    timestamp: new Date().toISOString(),
    totalWebsites: websites.length,
    successful: successCount,
    failed: failureCount,
    results
  };
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`\n📊 Generation summary saved to: ${summaryPath}`);
  
  // Print final summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 VIDEO GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`📋 Total websites processed: ${websites.length}`);
  console.log(`✅ Successful generations: ${successCount}`);
  console.log(`❌ Failed generations: ${failureCount}`);
  console.log('='.repeat(60));
  
  if (successCount > 0) {
    console.log('\n🎉 Successfully generated videos:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   📹 ${r.website} (${r.category}) → ${r.filename}`);
    });
  }
  
  if (failureCount > 0) {
    console.log('\n💥 Failed video generations:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ❌ ${r.website} (${r.category}) → ${r.error}`);
    });
  }
  
  if (failureCount > 0) {
    console.warn(`\n⚠️  ${failureCount} video(s) failed to generate`);
    // Don't exit with error code to allow partial success
  }
}

// Check server health endpoint
async function checkServerHealth() {
  try {
    console.log('🏥 Checking server health...');
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Server health check passed');
    return response.data;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    throw error;
  }
}

// List available videos
async function listVideos() {
  try {
    console.log('📹 Fetching available videos...');
    const response = await axios.get(`${API_BASE_URL}/videos-list`, { timeout: 10000 });
    console.log(`✅ Found ${response.data.videos.length} videos`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch video list:', error.message);
    return { videos: [] };
  }
}

// Main execution
if (require.main === module) {
  (async () => {
    try {
      await generateAllVideos();
      
      // Final check - list all videos
      const videoList = await listVideos();
      if (videoList.videos.length > 0) {
        console.log('\n📂 Final video inventory:');
        videoList.videos.forEach(video => {
          console.log(`   📹 ${video.name} (${video.size})`);
        });
      }
      
      console.log('\n🎉 Video generation workflow completed successfully!');
      
    } catch (error) {
      console.error('\n💥 Video generation workflow failed:', error.message);
      process.exit(1);
    }
  })();
} 
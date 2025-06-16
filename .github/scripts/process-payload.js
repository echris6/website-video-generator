#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Business category mapping
const BUSINESS_CATEGORIES = {
  'medical-spa': ['medical spa', 'medspa', 'aesthetic', 'dermatology', 'cosmetic', 'wellness center'],
  'restaurant': ['restaurant', 'cafe', 'bistro', 'diner', 'eatery', 'food', 'cuisine'],
  'e-commerce': ['shop', 'store', 'retail', 'ecommerce', 'marketplace', 'boutique'],
  'real-estate': ['real estate', 'realty', 'property', 'homes', 'realtor'],
  'professional-services': ['law', 'accounting', 'consulting', 'finance', 'legal', 'attorney'],
  'technology': ['tech', 'software', 'app', 'digital', 'startup', 'saas'],
  'automotive': ['auto', 'car', 'vehicle', 'automotive', 'dealership'],
  'health-fitness': ['gym', 'fitness', 'health', 'training', 'yoga', 'pilates'],
  'education': ['school', 'education', 'learning', 'academy', 'university'],
  'entertainment': ['entertainment', 'events', 'music', 'gaming', 'media']
};

function categorizeWebsite(businessName, description = '') {
  const text = `${businessName} ${description}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(BUSINESS_CATEGORIES)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return 'professional-services'; // default category
}

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

function createProjectStructure(category, projectName) {
  const categoryPath = path.join('websites', category);
  const projectPath = path.join(categoryPath, projectName);
  
  ensureDirectoryExists(categoryPath);
  ensureDirectoryExists(projectPath);
  
  return projectPath;
}

function processWebsiteData() {
  const payload = JSON.parse(process.env.PAYLOAD || '{}');
  console.log('🔍 Processing n8n payload...');
  
  // Handle both single website object and websites array (to support both formats)
  let websiteData = null;
  
  if (payload.business_name && payload.html_content) {
    // Direct website data (preferred format)
    websiteData = payload;
  } else if (payload.websites && Array.isArray(payload.websites) && payload.websites.length > 0) {
    // Array format - take the first one only
    websiteData = payload.websites[0];
    console.log(`📋 Found ${payload.websites.length} websites, processing the first one only`);
  } else {
    console.error('❌ No valid website data found in payload');
    console.error('Expected format: { business_name: "...", html_content: "..." }');
    return [];
  }
  
  const { business_name: businessName, html_content: htmlContent } = websiteData;
  
  if (!businessName || !htmlContent) {
    console.error('❌ Missing required fields:');
    console.error(`  business_name: ${businessName ? '✅' : '❌'}`);
    console.error(`  html_content: ${htmlContent ? '✅' : '❌'}`);
    return [];
  }
  
  console.log(`✅ Processing website: ${businessName}`);
  
  // Create simple structure - just save the HTML for video generation
  ensureDirectoryExists('websites');
  
  const safeFileName = businessName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const htmlFilePath = path.join('websites', `${safeFileName}.html`);
  
  // Write HTML file
  fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
  console.log(`📄 Created HTML file: ${htmlFilePath}`);
  
  const processedWebsite = {
    name: businessName,
    htmlFilePath
  };
  
  // Save processing results for video generation script
  const resultsPath = path.join('.github', 'scripts', 'processing-results.json');
  ensureDirectoryExists(path.dirname(resultsPath));
  fs.writeFileSync(resultsPath, JSON.stringify([processedWebsite], null, 2), 'utf8');
  console.log(`💾 Saved processing results to: ${resultsPath}`);
  
  console.log(`\n🎯 Ready to generate video for: ${businessName}`);
  return [processedWebsite];
}

// Run the processing
if (require.main === module) {
  try {
    const result = processWebsiteData();
    if (result.length === 0) {
      console.error('❌ No websites processed successfully');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error processing payload:', error);
    process.exit(1);
  }
} 
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
  console.log('Processing payload:', JSON.stringify(payload, null, 2));
  
  if (!payload.websites || !Array.isArray(payload.websites)) {
    console.log('No websites array found in payload');
    return [];
  }
  
  const processedWebsites = [];
  
  payload.websites.forEach((website, index) => {
    try {
      const {
        name: businessName,
        html: htmlContent,
        description = '',
        category: providedCategory
      } = website;
      
      if (!businessName || !htmlContent) {
        console.error(`Skipping website ${index}: Missing name or HTML content`);
        return;
      }
      
      // Determine category
      const category = providedCategory || categorizeWebsite(businessName, description);
      const sanitizedName = sanitizeFilename(businessName);
      
      // Create project structure
      const projectPath = createProjectStructure(category, sanitizedName);
      const htmlFilePath = path.join(projectPath, 'index.html');
      
      // Write HTML file
      fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
      console.log(`Created HTML file: ${htmlFilePath}`);
      
      // Create project metadata
      const metadata = {
        name: businessName,
        category,
        description,
        created: new Date().toISOString(),
        htmlFile: 'index.html'
      };
      
      const metadataPath = path.join(projectPath, 'project.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      console.log(`Created metadata: ${metadataPath}`);
      
      processedWebsites.push({
        name: businessName,
        category,
        sanitizedName,
        htmlFilePath,
        projectPath
      });
      
    } catch (error) {
      console.error(`Error processing website ${index}:`, error);
    }
  });
  
  // Save processing results for next script
  const resultsPath = path.join('.github', 'scripts', 'processing-results.json');
  ensureDirectoryExists(path.dirname(resultsPath));
  fs.writeFileSync(resultsPath, JSON.stringify(processedWebsites, null, 2), 'utf8');
  console.log(`Saved processing results to: ${resultsPath}`);
  
  console.log(`\n✅ Successfully processed ${processedWebsites.length} websites:`);
  processedWebsites.forEach(site => {
    console.log(`  - ${site.name} (${site.category}): ${site.htmlFilePath}`);
  });
  
  return processedWebsites;
}

// Run the processing
if (require.main === module) {
  try {
    processWebsiteData();
  } catch (error) {
    console.error('❌ Error processing payload:', error);
    process.exit(1);
  }
} 
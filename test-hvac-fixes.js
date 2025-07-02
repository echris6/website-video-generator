#!/usr/bin/env node

// Test script to verify HVAC video generation fixes
const fs = require('fs');
const path = require('path');

console.log('🧪 HVAC Video Generation Fixes - Verification Script');
console.log('=====================================================');

// Test 1: Verify server files exist and have correct duration
console.log('\n📁 TEST 1: Checking Server Files...');

const serverFiles = [
    'server-hvac.js',
    'server-hvac-step5.js',
    'server-step5-clean.js',
    'server-step5-tour-fixed.js',
    'server-step5-final-clean.js',
    'server-step5-complete-fix.js',
    'server-step5-minimal.js'
];

const results = {
    filesExist: 0,
    duration30s: 0,
    errors: []
};

serverFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        results.filesExist++;
        console.log(`✅ ${file} - EXISTS`);
        
        // Check for 30-second duration
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('duration = 30') || content.includes('duration: 30') || content.includes("duration: '30s'")) {
            results.duration30s++;
            console.log(`   ✅ 30-second duration confirmed`);
        } else if (content.includes('duration = 25') || content.includes('duration: 25') || content.includes("duration: '25s'")) {
            results.errors.push(`${file}: Still has 25-second duration`);
            console.log(`   ❌ Still has 25-second duration`);
        } else {
            console.log(`   ⚠️  Duration setting not found or unclear`);
        }
    } else {
        results.errors.push(`${file}: File does not exist`);
        console.log(`❌ ${file} - MISSING`);
    }
});

// Test 2: Verify GitHub workflow exists and has proper structure
console.log('\n📁 TEST 2: Checking GitHub Workflow...');

const workflowPath = path.join(__dirname, '.github/workflows/generate-hvac-videos.yml');
if (fs.existsSync(workflowPath)) {
    console.log('✅ GitHub workflow file exists');
    
    const workflowContent = fs.readFileSync(workflowPath, 'utf8');
    
    // Check for proper input parameters
    const requiredInputs = ['business_name', 'business_phone', 'business_address', 'business_website'];
    const inputsFound = requiredInputs.filter(input => workflowContent.includes(input));
    
    if (inputsFound.length === requiredInputs.length) {
        console.log('✅ All required input parameters found');
    } else {
        results.errors.push('GitHub workflow missing required input parameters');
        console.log(`❌ Missing input parameters: ${requiredInputs.filter(i => !inputsFound.includes(i)).join(', ')}`);
    }
    
    // Check for server-hvac-step5.js reference
    if (workflowContent.includes('server-hvac-step5.js')) {
        console.log('✅ Workflow references correct server file');
    } else {
        results.errors.push('GitHub workflow not using server-hvac-step5.js');
        console.log('❌ Workflow not using correct server file');
    }
    
} else {
    results.errors.push('GitHub workflow file does not exist');
    console.log('❌ GitHub workflow file missing');
}

// Test 3: Verify template files exist
console.log('\n📁 TEST 3: Checking Template Files...');

const templatePath = path.join(__dirname, 'templates/hvac-template.html');
if (fs.existsSync(templatePath)) {
    console.log('✅ HVAC template file exists');
    
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const placeholders = ['{{businessName}}', '{{businessPhone}}', '{{businessAddress}}', '{{heroTitle}}'];
    const placeholdersFound = placeholders.filter(p => templateContent.includes(p));
    
    if (placeholdersFound.length === placeholders.length) {
        console.log('✅ All required placeholders found in template');
    } else {
        results.errors.push('Template missing required placeholders');
        console.log(`❌ Missing placeholders: ${placeholders.filter(p => !placeholdersFound.includes(p)).join(', ')}`);
    }
} else {
    results.errors.push('HVAC template file does not exist');
    console.log('❌ HVAC template file missing');
}

// Test 4: Check for required dependencies
console.log('\n📦 TEST 4: Checking Dependencies...');

const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
    console.log('✅ package.json exists');
    
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredDeps = ['express', 'sharp'];
    const acceptablePuppeteer = ['puppeteer', 'puppeteer-core'];
    const acceptableFFmpeg = ['ffmpeg', 'fluent-ffmpeg'];
    
    const dependencies = { ...packageContent.dependencies, ...packageContent.devDependencies };
    const depsFound = requiredDeps.filter(dep => dependencies[dep]);
    
    // Check for puppeteer variants
    const hasPuppeteer = acceptablePuppeteer.some(dep => dependencies[dep]);
    const hasFFmpeg = acceptableFFmpeg.some(dep => dependencies[dep]);
    
    const allDepsPresent = depsFound.length === requiredDeps.length && hasPuppeteer && hasFFmpeg;
    
    if (allDepsPresent) {
        console.log('✅ All required dependencies found');
        console.log(`   - Puppeteer: ${acceptablePuppeteer.find(dep => dependencies[dep]) || 'missing'}`);
        console.log(`   - FFmpeg: ${acceptableFFmpeg.find(dep => dependencies[dep]) || 'missing'}`);
    } else {
        const missing = [];
        if (depsFound.length < requiredDeps.length) {
            missing.push(...requiredDeps.filter(d => !depsFound.includes(d)));
        }
        if (!hasPuppeteer) missing.push('puppeteer or puppeteer-core');
        if (!hasFFmpeg) missing.push('ffmpeg or fluent-ffmpeg');
        
        results.errors.push('Missing required dependencies');
        console.log(`❌ Missing dependencies: ${missing.join(', ')}`);
    }
} else {
    results.errors.push('package.json does not exist');
    console.log('❌ package.json missing');
}

// Test 5: Check for cursor image
console.log('\n🖱️  TEST 5: Checking Cursor Image...');

const cursorPath = path.join(__dirname, 'cursor.png');
if (fs.existsSync(cursorPath)) {
    console.log('✅ Cursor image exists');
} else {
    results.errors.push('Cursor image missing');
    console.log('❌ Cursor image missing');
}

// Final Results
console.log('\n📊 TEST RESULTS SUMMARY');
console.log('======================');
console.log(`✅ Server files found: ${results.filesExist}/${serverFiles.length}`);
console.log(`✅ Files with 30s duration: ${results.duration30s}`);
console.log(`❌ Total errors: ${results.errors.length}`);

if (results.errors.length > 0) {
    console.log('\n🚨 ERRORS FOUND:');
    results.errors.forEach(error => console.log(`   ❌ ${error}`));
    console.log('\n⚠️  Please fix these issues before deploying to production.');
} else {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ HVAC video generation system is ready for production deployment.');
}

// Generate test report
const reportPath = path.join(__dirname, 'test-report.json');
const report = {
    timestamp: new Date().toISOString(),
    results: {
        serverFilesFound: results.filesExist,
        totalServerFiles: serverFiles.length,
        duration30sFiles: results.duration30s,
        errorsCount: results.errors.length,
        errors: results.errors
    },
    status: results.errors.length === 0 ? 'PASSED' : 'FAILED'
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Test report saved to: ${reportPath}`);

// Exit with appropriate code
process.exit(results.errors.length === 0 ? 0 : 1); 
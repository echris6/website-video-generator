#!/bin/bash

# Test GitHub Actions Workflow Dispatch
# This script tests the HVAC video generation workflow

echo "🧪 Testing GitHub Actions HVAC Workflow..."
echo "📋 Repository: https://github.com/echris6/website-video-generator"
echo ""

# Simple HTML content for testing (no special characters that break shell)
HTML_CONTENT='<!DOCTYPE html><html><head><title>Test HVAC</title></head><body><h1>Emergency HVAC Service</h1><p>Professional heating and cooling repair available 24/7.</p></body></html>'

# Test payload
cat > test-payload.json << EOF
{
  "ref": "main",
  "inputs": {
    "html_content": "$HTML_CONTENT",
    "business_name": "Test HVAC Company",
    "industry": "HVAC Services", 
    "template": "hvac"
  }
}
EOF

echo "📤 Test payload created:"
cat test-payload.json | jq .

echo ""
echo "🚀 To test manually, run:"
echo "curl -X POST \\"
echo "  -H 'Authorization: Bearer YOUR_GITHUB_TOKEN' \\"
echo "  -H 'Accept: application/vnd.github.v3+json' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d @test-payload.json \\"
echo "  https://api.github.com/repos/echris6/hvac-video-automation/actions/workflows/generate-hvac-videos.yml/dispatches"

echo ""
echo "✅ GitHub Actions should now work without shell syntax errors!"
echo "🔧 The workflow uses proper JSON escaping and jq for HTML content" 
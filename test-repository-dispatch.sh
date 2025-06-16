#!/bin/bash

# Test script for triggering the GitHub Actions workflow via repository dispatch
# Replace YOUR_GITHUB_TOKEN with your actual token

GITHUB_TOKEN="${GITHUB_TOKEN:-YOUR_GITHUB_TOKEN}"
REPO_OWNER="echris6"
REPO_NAME="website-video-generator"

echo "🧪 Testing GitHub Actions Repository Dispatch Workflow"
echo "=================================================="

# Test payload with sample websites
PAYLOAD='{
  "event_type": "generate_websites",
  "client_payload": {
    "websites": [
      {
        "name": "Test Medical Spa",
        "html": "<!DOCTYPE html><html><head><title>Test Medical Spa</title><style>body{font-family:Arial,sans-serif;margin:0;padding:20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;min-height:100vh}.hero{text-align:center;padding:100px 20px}.services{padding:80px 20px;background:rgba(255,255,255,0.1);margin:20px 0;border-radius:10px}.about{padding:80px 20px;background:rgba(255,255,255,0.1);margin:20px 0;border-radius:10px}.contact{padding:80px 20px;text-align:center}</style></head><body><div class=\"hero\"><h1>Test Medical Spa</h1><p>Premium Aesthetic Treatments</p></div><div class=\"services\"><h2>Our Services</h2><p>Botox, Fillers, Laser Treatments, Skin Rejuvenation</p></div><div class=\"about\"><h2>About Us</h2><p>Leading medical spa with experienced professionals</p></div><div class=\"contact\"><h2>Contact</h2><p>Call us: (555) 123-4567</p></div></body></html>",
        "description": "Premium medical spa offering aesthetic treatments",
        "category": "medical-spa"
      },
      {
        "name": "Test Restaurant",
        "html": "<!DOCTYPE html><html><head><title>Test Restaurant</title><style>body{font-family:Arial,sans-serif;margin:0;padding:20px;background:linear-gradient(135deg,#ff6b6b 0%,#ee5a24 100%);color:white;min-height:100vh}.hero{text-align:center;padding:100px 20px}.services{padding:80px 20px;background:rgba(255,255,255,0.1);margin:20px 0;border-radius:10px}.about{padding:80px 20px;background:rgba(255,255,255,0.1);margin:20px 0;border-radius:10px}.contact{padding:80px 20px;text-align:center}</style></head><body><div class=\"hero\"><h1>Test Restaurant</h1><p>Fine Dining Experience</p></div><div class=\"services\"><h2>Our Menu</h2><p>French cuisine, Fresh ingredients, Seasonal specials</p></div><div class=\"about\"><h2>About Us</h2><p>Award-winning restaurant with 20 years of excellence</p></div><div class=\"contact\"><h2>Reservations</h2><p>Call us: (555) 987-6543</p></div></body></html>",
        "description": "Fine dining restaurant with French cuisine"
      }
    ]
  }
}'

echo "📤 Sending repository dispatch event..."
echo "Event type: generate_websites"
echo "Target: ${REPO_OWNER}/${REPO_NAME}"

# Make the API call
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches" \
  -d "${PAYLOAD}")

# Extract response body and status code
HTTP_BODY=$(echo "${RESPONSE}" | sed -E 's/HTTP_STATUS\:[0-9]{3}$//')
HTTP_STATUS=$(echo "${RESPONSE}" | tail -n1 | sed -E 's/.*HTTP_STATUS:([0-9]{3})$/\1/')

echo ""
echo "📋 Response:"
echo "Status: ${HTTP_STATUS}"

if [ "${HTTP_STATUS}" = "204" ]; then
  echo "✅ Repository dispatch sent successfully!"
  echo ""
  echo "🔍 Check the workflow status at:"
  echo "https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
  echo ""
  echo "⏱️  The workflow should start within a few seconds and:"
  echo "  1. Create HTML files in websites/ folder"
  echo "  2. Generate videos for each website"
  echo "  3. Commit the results back to the repository"
  echo ""
  echo "🎬 Expected videos:"
  echo "  - test_medical_spa_[timestamp].mp4"
  echo "  - test_restaurant_[timestamp].mp4"
else
  echo "❌ Error sending repository dispatch"
  echo "Response body: ${HTTP_BODY}"
fi

echo ""
echo "💡 To use with your own token:"
echo "export GITHUB_TOKEN='your_token_here'"
echo "./test-repository-dispatch.sh" 
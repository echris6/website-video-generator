# GitHub Actions Video Generation Workflow

This workflow automatically generates website videos using GitHub Actions and the repository dispatch feature. It's designed to be triggered by external systems like n8n.

## Overview

The workflow listens for `repository_dispatch` events with the event type `generate_websites`, processes website data from the payload, creates organized HTML files, and generates videos using the existing video generation system.

## Workflow Trigger

**Event Type:** `generate_websites`

**Trigger URL:** 
```
POST https://api.github.com/repos/{owner}/{repo}/dispatches
```

**Headers:**
```
Authorization: Bearer {GITHUB_TOKEN}
Accept: application/vnd.github.v3+json
Content-Type: application/json
```

## Payload Structure

The workflow expects a JSON payload with the following structure:

### Basic Structure
```json
{
  "event_type": "generate_websites",
  "client_payload": {
    "websites": [
      {
        "name": "Business Name",
        "html": "<!DOCTYPE html>...",
        "description": "Optional business description",
        "category": "optional-category"
      }
    ]
  }
}
```

### Complete Example
```json
{
  "event_type": "generate_websites",
  "client_payload": {
    "websites": [
      {
        "name": "NakedMD Med Spa",
        "html": "<!DOCTYPE html><html><head><title>NakedMD Med Spa</title></head><body><h1>Welcome to NakedMD</h1><p>Premium aesthetic treatments...</p></body></html>",
        "description": "Premier medical spa offering aesthetic treatments",
        "category": "medical-spa"
      },
      {
        "name": "Gourmet Bistro",
        "html": "<!DOCTYPE html><html><head><title>Gourmet Bistro</title></head><body><h1>Gourmet Bistro</h1><p>Fine dining experience...</p></body></html>",
        "description": "Fine dining restaurant with French cuisine",
        "category": "restaurant"
      }
    ]
  }
}
```

## Supported Business Categories

The workflow automatically categorizes websites into these folders:

- `medical-spa/` - Medical spas, aesthetic clinics, wellness centers
- `restaurant/` - Restaurants, cafes, bistros, food services  
- `e-commerce/` - Online stores, retail, marketplaces
- `real-estate/` - Real estate agencies, property services
- `professional-services/` - Law firms, consulting, finance
- `technology/` - Tech companies, software, apps
- `automotive/` - Auto dealers, car services
- `health-fitness/` - Gyms, fitness centers, health services
- `education/` - Schools, universities, educational services
- `entertainment/` - Entertainment, events, media

If no category is specified, the workflow will auto-categorize based on business name and description.

## Workflow Steps

1. **Checkout Repository** - Gets the latest code
2. **Setup Environment** - Installs Node.js, FFmpeg, and dependencies
3. **Process Payload** - Creates HTML files in organized folders
4. **Start Server** - Launches the video generation API
5. **Generate Videos** - Creates videos for each website
6. **Commit Results** - Pushes generated files back to repository
7. **Upload Artifacts** - Backup of generated content

## Generated Files

The workflow creates the following structure:

```
websites/
├── medical-spa/
│   └── nakedmd-med-spa/
│       ├── index.html
│       └── project.json
└── restaurant/
    └── gourmet-bistro/
        ├── index.html
        └── project.json

videos/
├── nakedmd_med_spa_[timestamp].mp4
└── gourmet_bistro_[timestamp].mp4
```

## n8n Integration Example

### HTTP Request Node Configuration

**Method:** POST  
**URL:** `https://api.github.com/repos/echris6/website-video-generator/dispatches`

**Headers:**
```json
{
  "Authorization": "Bearer {{ $env.GITHUB_TOKEN }}",
  "Accept": "application/vnd.github.v3+json",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "event_type": "generate_websites",
  "client_payload": {
    "websites": {{ $json.websites }}
  }
}
```

### Environment Variables

Set these in your n8n environment or GitHub repository secrets:

- `GITHUB_TOKEN` - Personal access token with `repo` scope

## Monitoring the Workflow

1. **GitHub Actions Tab** - View workflow runs and logs
2. **Artifacts** - Download generated videos and HTML files
3. **Repository** - See committed files in the `websites/` and `videos/` folders

## Example Curl Command

```bash
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  https://api.github.com/repos/echris6/website-video-generator/dispatches \
  -d '{
    "event_type": "generate_websites",
    "client_payload": {
      "websites": [
        {
          "name": "Test Business",
          "html": "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Business</h1></body></html>",
          "description": "A test business for demonstration"
        }
      ]
    }
  }'
```

## Troubleshooting

### Common Issues

1. **Invalid HTML** - Ensure HTML content is valid and properly escaped
2. **Missing Fields** - Both `name` and `html` are required
3. **Token Permissions** - GitHub token needs `repo` scope
4. **Workflow Limits** - GitHub Actions has usage limits

### Logs

Check the following logs in GitHub Actions:
- Process payload logs
- Server startup logs  
- Video generation logs
- Commit and push logs

### Timeouts

- Server startup: 60 seconds
- Video generation: 5 minutes per video
- Total workflow: 30 minutes

## Video Specifications

Generated videos have these specifications:
- **Resolution:** 1920x1080 (Full HD)
- **Frame Rate:** 60fps
- **Format:** MP4 (H.264)
- **Duration:** ~15 seconds
- **File Size:** 1-3MB typically
- **Quality:** High-quality screenshot-based generation 
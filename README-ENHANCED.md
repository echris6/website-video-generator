# Enhanced Website Video Generator with Chatbot Demo & Cursor Simulation

A sophisticated screen recording tool that creates professional website demo videos with realistic cursor movements and interactive chatbot demonstrations. Perfect for showcasing websites with AI chatbots across different business niches.

## 🎯 Key Features

### ✨ Cursor Simulation
- **Realistic Cursor Movement**: Smooth, natural cursor movements with cubic-bezier easing
- **Visual Feedback**: Click animations with ripple effects
- **Cursor Trails**: Subtle trail effects for enhanced visibility
- **Professional Styling**: Drop shadows and hover states
- **Responsive Sizing**: Adapts to different screen sizes

### 🤖 Chatbot Interaction Demo
- **Niche-Specific Questions**: Pre-configured demo questions for each business type
- **Realistic Typing**: Natural typing speed (60-80 WPM) with occasional pauses
- **Full Interaction Flow**: Opens chatbot → Types question → Sends message → Shows response
- **Timing Control**: Precise control over each interaction phase

### 📹 Video Generation
- **60 FPS Smooth Scrolling**: Professional-quality video output
- **30-Second Duration**: Extended to showcase chatbot interaction
- **High Quality**: H.264 codec with optimized settings
- **Phased Recording**:
  - 0-3 seconds: Initial page view
  - 3-13 seconds: Chatbot interaction demo
  - 13-30 seconds: Smooth page scrolling

## 🚀 Quick Start

### Prerequisites
```bash
# Node.js and npm required
node --version  # v14 or higher
npm --version   # v6 or higher

# Install FFmpeg (required for video generation)
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### Installation
```bash
# Clone the repository
git clone [repository-url]
cd automated-screen-recorder

# Install dependencies
npm install

# Start the enhanced server
node server-enhanced.js
```

## 📖 API Usage

### Generate Video with Chatbot Demo

```javascript
POST /generate-video
Content-Type: application/json

{
  "html_content": "<html>...</html>",
  "business_name": "Luxury Real Estate Group",
  "niche": "real_estate",  // Options: medical_spa, real_estate, hvac, cosmetic_dental
  "settings": {
    "width": 1920,
    "height": 1080,
    "fps": 60,
    "duration": 30,
    "enableChatbotDemo": true,
    "videoCRF": 18,
    "videoPreset": "fast",
    "videoBitrate": 3000
  }
}
```

### Response
```json
{
  "success": true,
  "video_url": "/videos/luxury_real_estate_group_1234567890.mp4",
  "file_name": "luxury_real_estate_group_1234567890.mp4",
  "file_size": 15728640,
  "file_size_readable": "15.0 MB",
  "duration": "30 seconds",
  "features": {
    "chatbot_demo": true,
    "cursor_simulation": true,
    "smooth_scrolling": true,
    "niche": "real_estate"
  },
  "settings_used": { ... }
}
```

## 🏢 Niche-Specific Chatbot Questions

### Medical Spa
**Question**: "What Botox treatments do you offer?"  
**Expected Response**: "Botox reduces wrinkles by relaxing facial muscles. Results last 3-4 months. Starting at $295. Would you like to schedule a complimentary consultation?"

### Real Estate
**Question**: "Can you help me sell my home?"  
**Expected Response**: "My full-service marketing includes professional photography, staging consultation, and targeted buyer outreach. Properties I list typically sell 15% faster than market average. What's your property address?"

### HVAC
**Question**: "My AC isn't working"  
**Expected Response**: "No air conditioning can be uncomfortable and potentially dangerous. Our licensed technicians can diagnose and repair most issues same-day. What symptoms are you experiencing?"

### Cosmetic Dental
**Question**: "Tell me about Invisalign"  
**Expected Response**: "Clear aligners straighten teeth discreetly. 12-18 month treatment. Starting at $3,995 with payment plans. Would you like a free consultation?"

## 🧪 Testing

### Test Single Niche
```bash
# Test real estate with chatbot demo
node test-enhanced-api.js real-estate

# Test medical spa
node test-enhanced-api.js medical

# Test HVAC
node test-enhanced-api.js hvac

# Test cosmetic dental
node test-enhanced-api.js dental
```

### Test All Niches
```bash
# Generate videos for all niches
node test-enhanced-api.js all
```

### Test Without Chatbot
```bash
# Generate simple scrolling video (20 seconds)
node test-enhanced-api.js simple
```

## ⚙️ Configuration Options

### Video Settings
| Setting | Default | Description |
|---------|---------|-------------|
| `width` | 1920 | Video width in pixels |
| `height` | 1080 | Video height in pixels |
| `fps` | 60 | Frames per second |
| `duration` | 30 | Total video duration in seconds |
| `enableChatbotDemo` | true | Enable/disable chatbot interaction |
| `videoCRF` | 18 | Video quality (lower = better, 0-51) |
| `videoPreset` | fast | FFmpeg encoding preset |
| `videoBitrate` | 3000 | Video bitrate in kbps |

### Timing Configuration
| Phase | Duration | Description |
|-------|----------|-------------|
| Page Load | 3 seconds | Initial wait for page to stabilize |
| Initial View | 3 seconds | Static view of hero section |
| Chatbot Demo | 10 seconds | Complete chatbot interaction |
| Page Scroll | 17 seconds | Smooth scrolling through content |

## 🔧 Advanced Usage

### Custom Cursor Styling
```javascript
const CURSOR_SETTINGS = {
    size: 20,                              // Cursor diameter in pixels
    color: 'rgba(0, 0, 0, 0.8)',          // Cursor color
    clickScale: 0.8,                       // Scale factor on click
    moveSpeed: 'cubic-bezier(...)',       // Movement easing function
    trailOpacity: 0.3,                     // Trail effect opacity
    shadowBlur: 8,                         // Shadow blur radius
    shadowColor: 'rgba(0, 0, 0, 0.3)'     // Shadow color
};
```

### Custom Chatbot Questions
```javascript
const CHATBOT_QUESTIONS = {
    your_niche: {
        question: "Your custom question here",
        expectedResponse: "Expected bot response",
        typingSpeed: 75  // Words per minute
    }
};
```

## 🏗️ Architecture

### Components
1. **Puppeteer**: Browser automation for page rendering
2. **Sharp**: High-performance image processing for frame cropping
3. **FFmpeg**: Video encoding from screenshot frames
4. **Express**: API server for handling requests

### Video Generation Pipeline
1. **Page Setup**: Load HTML content in headless browser
2. **Cursor Injection**: Add custom cursor element and controls
3. **Frame Capture**:
   - Phase 1: Static frames of initial view
   - Phase 2: Chatbot interaction with cursor movement
   - Phase 3: Smooth scrolling with frame cropping
4. **Video Encoding**: FFmpeg combines frames into MP4

## 📊 Performance

- **Generation Speed**: ~45-60 seconds for 30-second video
- **File Size**: ~10-20 MB for 1080p 60fps video
- **Memory Usage**: ~500-800 MB during generation
- **CPU Usage**: High during FFmpeg encoding phase

## 🐛 Troubleshooting

### Common Issues

**Chatbot button not found**
- Ensure your HTML includes element with `id="chatToggle"`
- Check that chatbot widget loads properly

**Cursor not visible**
- Verify JavaScript injection is working
- Check browser console for errors

**Video quality issues**
- Adjust `videoCRF` (lower = better quality)
- Increase `videoBitrate` for complex content

**Performance problems**
- Reduce `fps` to 30 for faster generation
- Lower resolution for quicker processing

## 🔐 Security Considerations

- Sanitize HTML input to prevent XSS
- Limit file sizes to prevent DoS
- Implement rate limiting for production use
- Use environment variables for sensitive config

## 📝 License

[Your License Here]

## 🤝 Contributing

Contributions welcome! Please submit pull requests with:
- Clear description of changes
- Test coverage for new features
- Documentation updates

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Contact: [your-email@example.com]

---

Built with ❤️ for creating stunning website demos with interactive chatbot showcases.
# 🎬 Website Video Generator API

A professional Node.js API for generating smooth, high-quality scrolling videos of websites. Transform any HTML content into cinematic 60fps MP4 videos perfect for marketing materials, client presentations, and website showcases.

## ✨ Features

- **🎯 Screenshot-Based Generation**: Frame-perfect 60fps videos using advanced screenshot stitching
- **🚀 REST API**: Simple HTTP endpoints for video generation and management
- **💎 Professional Quality**: 1920x1080 HD videos with optimized encoding
- **⚡ Fast Processing**: Efficient batch processing with progress tracking
- **🎨 Customizable**: Adjustable video settings and scrolling parameters
- **🐳 Docker Ready**: Complete containerization for easy deployment
- **📁 Organized Storage**: Business category-based file organization

## 🏗️ Architecture

### Core Components
- **Express.js**: RESTful API server
- **Puppeteer**: Headless Chrome for website rendering
- **FFmpeg**: Video encoding and processing
- **Screenshot Engine**: Frame-perfect capture system

### Video Generation Process
1. **HTML Processing**: Load and render HTML content in headless browser
2. **Screenshot Capture**: Take 900 individual frames at precise scroll positions
3. **Video Assembly**: Stitch screenshots together using FFmpeg
4. **Optimization**: Encode with H.264 for optimal quality/size ratio

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- FFmpeg installed on system
- 2GB+ RAM for video processing

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/website-video-generator.git
cd website-video-generator

# Install dependencies
npm install

# Start the server
npm start
```

The API will be available at `http://localhost:3000`

### Docker Installation

```bash
# Build the container
docker-compose build

# Start the service
docker-compose up -d
```

## 📋 API Documentation

### Generate Video
Create a smooth scrolling video from HTML content.

**Endpoint:** `POST /generate-video`

**Request Body:**
```json
{
  "business_name": "My Company",
  "html_content": "<!DOCTYPE html>..."
}
```

**Response:**
```json
{
  "success": true,
  "video_url": "/videos/my_company_1234567890.mp4",
  "file_name": "my_company_1234567890.mp4",
  "file_size": 1458392,
  "file_size_readable": "1.39 MB",
  "duration_estimate": "15 seconds",
  "settings_used": {
    "width": 1920,
    "height": 1080,
    "fps": 60,
    "videoCRF": 18,
    "videoCodec": "libx264"
  }
}
```

### List Videos
Get all generated videos with metadata.

**Endpoint:** `GET /videos-list`

**Response:**
```json
{
  "videos": [
    {
      "filename": "my_company_1234567890.mp4",
      "size": "1.39 MB",
      "created": "2025-01-16T10:30:00Z",
      "url": "/videos/my_company_1234567890.mp4"
    }
  ],
  "total": 1
}
```

### Download Video
Stream or download generated videos.

**Endpoint:** `GET /videos/:filename`

### Health Check
Verify API status and dependencies.

**Endpoint:** `GET /health`

## 🎥 Video Specifications

| Setting | Value | Description |
|---------|-------|-------------|
| **Resolution** | 1920x1080 | Full HD quality |
| **Frame Rate** | 60 FPS | Smooth motion |
| **Duration** | 15 seconds | Optimal showcase length |
| **Codec** | H.264 (libx264) | Universal compatibility |
| **Quality** | CRF 18 | High quality encoding |
| **Bitrate** | 3000k | Balanced size/quality |

## 📁 Project Structure

```
website-video-generator/
├── server.js              # Main API server
├── package.json           # Dependencies and scripts
├── README.md              # Documentation
├── .gitignore             # Git exclusions
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Multi-service setup
├── videos/                # Generated video output
│   ├── medical-spas/     # Business category folders
│   ├── restaurants/      
│   └── e-commerce/       
├── frames/                # Temporary screenshot storage
└── websites/              # Organized website projects
    ├── medical-spas/
    │   ├── nakedmd/
    │   └── glow-aesthetic/
    ├── restaurants/
    └── e-commerce/
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Video Settings
DEFAULT_VIDEO_WIDTH=1920
DEFAULT_VIDEO_HEIGHT=1080
DEFAULT_VIDEO_FPS=60
DEFAULT_VIDEO_DURATION=15

# Storage
VIDEOS_DIR=./videos
FRAMES_DIR=./frames
MAX_STORAGE_GB=50

# Processing
MAX_CONCURRENT_JOBS=3
CLEANUP_TEMP_FILES=true
```

### Video Quality Presets

```javascript
// Fast (smaller files)
{
  videoCRF: 23,
  videoPreset: 'ultrafast',
  videoBitrate: 1500
}

// Balanced (default)
{
  videoCRF: 18,
  videoPreset: 'fast', 
  videoBitrate: 3000
}

// Premium (larger files)
{
  videoCRF: 15,
  videoPreset: 'slow',
  videoBitrate: 5000
}
```

## 🏢 Business Category Organization

The system automatically organizes generated videos by business type:

- **`medical-spas/`** - Medical spas, aesthetic centers, wellness clinics
- **`restaurants/`** - Restaurants, cafes, food service businesses  
- **`e-commerce/`** - Online stores, retail websites
- **`real-estate/`** - Property listings, real estate agencies
- **`professional-services/`** - Law firms, consulting, B2B services
- **`technology/`** - Tech companies, SaaS platforms, startups

## 🔄 Batch Processing

Process multiple websites efficiently:

```javascript
const websites = [
  { name: "spa1", html: "..." },
  { name: "spa2", html: "..." },
  { name: "spa3", html: "..." }
];

for (const site of websites) {
  const response = await fetch('/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_name: site.name,
      html_content: site.html
    })
  });
  
  const result = await response.json();
  console.log(`Generated: ${result.video_url}`);
}
```

## 🚀 Performance & Optimization

### Generation Speed
- **Screenshot Capture**: ~60 seconds (900 frames)
- **Video Encoding**: ~30 seconds (FFmpeg processing)
- **Total Time**: ~90 seconds per video

### System Requirements
- **CPU**: 4+ cores recommended for concurrent processing
- **RAM**: 4GB+ for multiple simultaneous jobs
- **Storage**: 1GB per 100 videos (average)
- **Network**: High bandwidth for large HTML content

### Optimization Tips
1. **Batch Processing**: Generate multiple videos during off-peak hours
2. **Storage Management**: Implement automatic cleanup of old videos
3. **Caching**: Cache rendered HTML for repeated generations
4. **Load Balancing**: Use multiple instances for high-volume processing

## 🐳 Docker Deployment

### Production Deployment

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  video-generator:
    build: .
    ports:
      - "80:3000"
    volumes:
      - ./videos:/app/videos
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - MAX_CONCURRENT_JOBS=5
    restart: unless-stopped
```

### Scaling

```bash
# Scale to multiple instances
docker-compose up --scale video-generator=3 -d

# Use with nginx load balancer
docker-compose -f docker-compose.yml -f docker-compose.nginx.yml up -d
```

## 🔍 Monitoring & Logging

### Health Monitoring
- API endpoint health checks
- Video generation success rates
- Storage usage tracking
- Performance metrics

### Logging
- Generation timestamps and duration
- Error tracking and debugging
- Client request logging
- Resource usage monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Puppeteer Team** - Headless Chrome automation
- **FFmpeg Project** - Video processing capabilities
- **Express.js Community** - Web framework foundation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/website-video-generator/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/website-video-generator/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/website-video-generator/discussions)

---

**Built with ❤️ for creating beautiful website showcase videos** 
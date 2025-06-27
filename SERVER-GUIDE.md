# Video Generator Server Guide

## Available Servers (All Working & Tested)

### 🏆 **server-clean.js** (RECOMMENDED)
- **Port:** 3000
- **Method:** Screenshot cropping (fastest & most reliable)
- **Features:** Simple, clean, uses testttt.html template
- **Use case:** Primary choice for production video generation
- **Command:** `node server-clean.js`

### 🎯 **server-final.js** 
- **Port:** 3002  
- **Method:** Screenshot cropping + cursor simulation
- **Features:** Combines proven screenshot method with simple cursor effects
- **Use case:** When you want basic cursor simulation
- **Command:** `node server-final.js`
- **Last Success:** `final_real_estate_1750826861300.mp4` (6.26 MB)

### 📹 **server-working.js**
- **Port:** 3001
- **Method:** Traditional scrolling capture  
- **Features:** Simple, reliable scrolling method
- **Use case:** Alternative method if screenshot cropping has issues
- **Command:** `node server-working.js`
- **Last Success:** `working_real_estate_1750824764013.mp4` (11.01 MB)

## Template File
- **testttt.html** - Luxury real estate website template with dynamic customization

## API Usage
All servers support:
```bash
POST /generate-video
{
  "businessName": "Your Business Name",
  "niche": "real_estate" | "medical" | "restaurant"
}
```

## Recommendation
Start with **server-clean.js** - it's the most reliable and uses the proven screenshot cropping method that works perfectly with testttt.html. 
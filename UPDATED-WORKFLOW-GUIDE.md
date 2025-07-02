# Updated HVAC Workflow - Customizable Parameters Guide

## ✅ **Problem SOLVED**: "Unexpected inputs provided" Error Fixed

Your GitHub Actions workflow has been updated to accept **business data parameters** instead of large HTML content, completely resolving the input size limits and "Unexpected inputs provided" errors.

## 🎯 **NEW Workflow Inputs**

### **Required Business Data:**
```yaml
business_name: "Your HVAC Business Name"
business_phone: "(555) 123-4567"
business_address: "123 Main Street, City, ST 12345"  
business_website: "www.yourbusiness.com"
```

### **Optional Customizable Content:**
```yaml
hero_title: "Professional HVAC Solutions"          # Default provided
tagline: "Expert heating, cooling, and ventilation services"  # Default provided  
cta_text: "Get Free Estimate"                      # Default provided
```

### **System Parameters (Auto-set):**
```yaml
industry: "HVAC Services"      # Always HVAC
template: "hvac"               # Always hvac template
```

## 🔧 **How It Works**

1. **Template Storage**: Premium HVAC template stored in `/templates/hvac-template.html`
2. **Parameter Input**: Only small business data passed as inputs (<1KB total)
3. **Dynamic Generation**: Workflow combines template + business data = final HTML
4. **Video Creation**: Professional 30-second marketing video generated

## 📝 **Usage Examples**

### **Manual Workflow Dispatch:**
```yaml
# GitHub Actions > Actions > Generate HVAC Marketing Videos > Run workflow
business_name: "Elite Climate Control"
business_phone: "(555) 987-6543"
business_address: "456 Oak Street, Springfield, IL 62701"
business_website: "www.eliteclimate.com"
hero_title: "Premium Climate Solutions"
tagline: "Advanced heating, cooling, and air quality systems with 24/7 emergency support"
cta_text: "Schedule Service Today"
```

### **API/n8n Integration:**
```json
{
  "event_type": "generate-hvac-video",
  "client_payload": {
    "business_name": "Professional HVAC Services",
    "business_phone": "(555) 123-4567",
    "business_address": "123 Main Street, Your City, ST 12345",
    "business_website": "www.professionalhvac.com",
    "hero_title": "Expert HVAC Solutions",
    "tagline": "Reliable heating, cooling, and air quality services for your home and business",
    "cta_text": "Get Your Free Quote"
  }
}
```

### **Using Default Values (Minimal):**
```yaml
# Only required fields - optional fields use defaults
business_name: "HVAC Pro"
business_phone: "(555) 123-4567"  
business_address: "123 Main Street, City, ST 12345"
business_website: "www.hvacpro.com"
# hero_title: Uses "Professional HVAC Solutions"
# tagline: Uses "Expert heating, cooling, and ventilation services"  
# cta_text: Uses "Get Free Estimate"
```

## 🚀 **Key Benefits**

1. **✅ No Size Limits**: Template stored in repository, not passed as input
2. **✅ No "Unexpected inputs" errors**: Workflow updated with correct parameters
3. **✅ Customizable Content**: Hero title, tagline, and CTA text can be customized
4. **✅ Safe Text Handling**: Special characters (like "24/7") handled properly
5. **✅ Default Values**: Optional fields have professional defaults
6. **✅ Backward Compatible**: Works with both manual and API triggers

## 🔧 **Technical Implementation**

### **Template Processing:**
- Template: `/templates/hvac-template.html` (77KB premium HVAC template)
- Placeholders: `{{businessName}}`, `{{heroTitle}}`, `{{tagline}}`, etc.
- Replacement: Node.js script handles special characters safely
- Output: Customized HTML ready for video generation

### **Placeholder Mapping:**
```javascript
{
  '{{businessName}}': 'Your Business Name',
  '{{businessPhone}}': '(555) 123-4567', 
  '{{businessAddress}}': 'Your Address',
  '{{businessWebsite}}': 'www.yoursite.com',
  '{{heroTitle}}': 'Your Hero Title',
  '{{tagline}}': 'Your Custom Tagline',
  '{{ctaText}}': 'Your Call-to-Action',
  '{{primaryColor}}': '#1e40af',
  '{{secondaryColor}}': '#dc2626',
  // ... other style variables
}
```

### **Safe Replacement Logic:**
```javascript
// Uses split/join method (not regex) for safe special character handling
content = content.split(placeholder).join(value);
```

## 🎥 **Video Output**

- **Duration**: 30 seconds professional marketing video
- **Features**: HVAC chatbot interaction + website scrolling
- **Format**: MP4, 60fps, ~2MB file size
- **Content**: 
  - 0-18s: Chatbot interaction with "I need HVAC repair service"
  - 18-30s: Smooth scrolling through all website sections
  - Custom business branding throughout

## 📋 **Workflow Status**

- **✅ UPDATED**: `.github/workflows/generate-hvac-videos.yml`
- **✅ TESTED**: Verified with custom parameters including special characters
- **✅ DEPLOYED**: Ready for immediate use
- **✅ DOCUMENTED**: Complete usage guide provided

## 🔄 **Migration from Old Workflow**

### **BEFORE (Problematic):**
```yaml
inputs:
  html_content:  # 40KB+ content (FAILS with size limits)
```

### **AFTER (Working):**
```yaml
inputs:
  business_name: "Your Business"       # Required
  business_phone: "(555) 123-4567"    # Required  
  business_address: "Your Address"    # Required
  business_website: "www.site.com"    # Required
  hero_title: "Custom Title"          # Optional
  tagline: "Custom Tagline"           # Optional  
  cta_text: "Custom CTA"              # Optional
```

## 🎉 **Ready to Use!**

Your workflow is now updated and ready for production use. The "Unexpected inputs provided" error is completely resolved, and you can now:

1. **Trigger manually** with the new parameter structure
2. **Update your n8n automation** to use the new input format  
3. **Customize content** with optional hero title, tagline, and CTA text
4. **Generate unlimited videos** without any size restrictions

**Repository**: https://github.com/echris6/hvac-video-automation
**Workflow**: `.github/workflows/generate-hvac-videos.yml`

---

**🎯 Result**: All GitHub Actions input issues resolved - workflow ready for immediate deployment! 
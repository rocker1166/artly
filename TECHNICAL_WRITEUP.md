# 🎨 Artly Studio - Technical Overview

## AI Model & Technology Stack

**Primary AI Models:**
- **Gemini 3 Pro Image (Preview)** - For image generation and editing
- **Gemini 2.0 Flash (Experimental)** - For prompt enhancement and validation

**Why Gemini 3 Pro Image?**
- **Latest image generation model** - State-of-the-art visual synthesis from Google
- **4K resolution support** - Generate high-quality images up to 4K
- **Advanced image grounding** - Context-aware generation from uploaded images  
- **Native editing capabilities** - Background removal, replacement, blur, and color swap
- **Google Search integration** - Grounding with real-time web data for accurate generation

## Core AI Features

### 🤖 Self-Prompt Enhancement
Intelligent prompt enrichment system that automatically expands user inputs with:
- Professional photography terminology
- Optimal lighting and composition details
- Style-specific enhancements
- Context preservation from original intent

### 🖼️ Advanced Image Editing Tools
- **Background Removal** - AI-powered transparent background extraction
- **Background Replacement** - Semantic understanding for natural scene swaps
- **Background Blur** - Professional depth-of-field simulation
- **Color Swap** - Intelligent color transformation across objects

### 🎨 In-Browser Image Controls
**Real-time client-side adjustments** without server roundtrips:
- **Brightness** - Dynamic luminosity adjustment (50-150%)
- **Contrast** - Enhanced detail visibility (50-150%)
- **Saturation** - Color vibrancy control (50-200%)
- **Clarity/Sharpness** - Edge enhancement (0-100%)

All adjustments preview instantly using CSS filters, then can be permanently applied via API.

### ⚡ Generation Pipeline
- **Preview Mode** - Instant 1K generation for rapid iteration
- **HD Export** - On-demand 4K high-resolution output
- **Smart Caching** - Device-ID based history with Supabase persistence

## Architecture Highlights

**Frontend:** Next.js 16 + React 19 (Turbopack) + TypeScript
**Backend:** Next.js API Routes + Supabase PostgreSQL
**Storage:** Hybrid local + cloud persistence
**Styling:** Custom glassmorphic design system with Tailwind CSS

### System Architecture

```
┌─ ConfigPanel (AI Control Center)
│  ├─ Quick Presets (E-commerce, Social, Poster, Avatar)
│  ├─ Smart Templates with {placeholder} system
│  ├─ Image Upload (Drag-drop + URL paste)
│  └─ Tool Suite (Background, Color Swap)
│
├─ PreviewCanvas (Live Display)
│  ├─ Real-time CSS filter preview
│  └─ Adjustment sliders (Brightness, Contrast, etc.)
│
├─ HistoryPanel (Smart History)
│  ├─ Device-ID based caching
│  └─ One-click prompt copying
│
├─ PromptGallery (Inspiration Hub)
│  ├─ Full-screen image viewer
│  └─ Prompt library with copy-on-click
│
└─ ExportFooter (Multi-platform Export)
   └─ Instagram, LinkedIn, Twitter, YouTube presets
```

## Unique Technical Innovations

✨ **Dual-Layer Processing**
- **Server:** AI generation, prompt enhancement, image grounding
- **Client:** Instant adjustments, preview rendering, history caching

🎯 **Smart Preset System**
One-click templates that auto-configure:
- Style mode (8 options: Realistic, Cinematic, Product Photo, etc.)
- Aspect ratio (6 options: 1:1, 16:9, 4:5, etc.)
- Prompt template with contextual placeholders

💾 **Progressive Storage Architecture**
- **Local-first:** Device ID for anonymous user tracking
- **Cloud backup:** Supabase for image uploads and job history
- **Asset management:** Uploaded images stored with job metadata

🔄 **Instant Sharing**
- Copy link generation for generated images
- Direct download in multiple formats (PNG, JPG, WebP)


⚙️ **Intelligent UX**
- Auto-tab switching when uploading images
- Real-time prompt validation (word count checks)
- Fallback API key system (personal key when quota exhausted)
- Loading states with progress messages

## Feature Matrix

| Feature | Technology | Purpose |
|---------|-----------|---------|
| Prompt Enhancement | Gemini 2.5 API | AI-powered prompt expansion |
| Image Generation | Gemini 2.5 Imagen | Text/Image → Image |
| Background Tools | Gemini 2.5 API | Remove/Replace/Blur backgrounds |
| Color Swap | Gemini 2.5 API | Semantic color transformations |
| In-Browser Adjustments | CSS Filters + Canvas API | Instant visual tweaks |
| History Persistence | Supabase PostgreSQL | Cloud-based job storage |
| Image Upload | Next.js API + FormData | Multi-source image input |
| Export Optimization | Sharp (server-side) | Platform-specific resizing |

## Performance Optimizations

- **Turbopack** - 700x faster dev rebuilds vs Webpack
- **React 19** - Better concurrent rendering
- **Streaming responses** - Progressive UI updates during generation
- **Client-side filters** - Zero-latency adjustment previews
- **Lazy loading** - History panel virtualization for large datasets

*Built for production with modern web standards and AI-first architecture.*


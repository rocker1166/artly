# 🎨 Artly Studio - Technical Overview

## AI Models Used

**Dual-model architecture:**
- **Gemini 3 Pro Image** (`gemini-3-pro-image-preview`) - Image generation, editing, 4K support
- **Gemini 2.0 Flash** (`gemini-2.0-flash-exp`) - Prompt enhancement, API validation

## Why These Models?

**Gemini 3 Pro Image:** State-of-the-art image generation with native background removal/replacement/blur, color swap, and Google Search grounding for real-time data integration.

**Gemini 2.0 Flash:** Sub-second response times for interactive prompt enrichment and cost-effective API validation.

## How AI Is Used

1. **Text-to-Image:** User prompt → Gemini 2.0 enhances with photography terms → Gemini 3 generates 1K preview/4K HD images
2. **Image Editing:** Upload image → AI-powered background tools & color swap via image grounding
3. **Self-Enhancement:** Automatic prompt expansion (e.g., "sunset mountain" → "dramatic golden hour landscape, professional photography")
4. **In-Browser Controls:** CSS filters for real-time brightness/contrast/saturation adjustments

## Architecture

**Frontend:** Next.js 16 + React 19 (Turbopack)  
**Backend:** API routes → Gemini AI → Supabase (PostgreSQL + Storage)  
**Components:** ConfigPanel (AI controls), PreviewCanvas (display), HistoryPanel (device-cached jobs), PromptGallery (inspiration hub)

**Tech Stack:** TypeScript, Tailwind CSS 4, Radix UI, Glassmorphic design system

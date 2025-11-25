# 🎨 Artly Studio

> **AI-Powered Image Generation & Editing Studio** built with Gemini 3 Pro Image

A modern, full-stack web application for creating and editing images using Google's latest Gemini AI models. Features intelligent prompt enhancement, advanced image editing tools, and a beautiful glassmorphic UI.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green?logo=supabase)

<img width="1909" height="863" alt="image" src="https://github.com/user-attachments/assets/089ef78f-7896-4778-8655-1149e8411c02" />
#before
<img width="1916" height="857" alt="image" src="https://github.com/user-attachments/assets/d86a29a4-a567-4101-84ca-4962cb7e50ea" />
#After
<img width="1908" height="852" alt="image" src="https://github.com/user-attachments/assets/646f6906-3f71-4a07-aaee-f6d9b9d2468f" />
#in browser adjustment
<img width="1901" height="827" alt="image" src="https://github.com/user-attachments/assets/115800bc-b78b-468d-8d75-decaf4314b0c" />


## ✨ Features

### 🤖 AI-Powered Generation
- **Gemini 3 Pro Image** - State-of-the-art image generation with 4K support
- **Self-Prompt Enhancement** - Automatic enrichment with professional photography terms
- **Google Search Grounding** - Real-time web data integration for accurate generation

### 🖼️ Advanced Image Editing
- **Background Tools** - Remove, replace, or blur backgrounds with AI
- **Color Swap** - Intelligent color transformations across objects
- **Image Grounding** - Upload images for context-aware generation

### 🎨 In-Browser Controls
- **Real-time Adjustments** - Brightness, contrast, saturation, clarity
- **Zero-latency Preview** - Instant CSS filter application
- **Permanent Apply** - Save adjustments via API

### 🎯 Smart Features
- **Quick Presets** - One-click templates (E-commerce, Social, Poster, Avatar)
- **Prompt Gallery** - Browse and copy prompts from generated images
- **History Panel** - Device-based caching with cloud backup
- **Multi-format Export** - Platform-optimized presets (Instagram, LinkedIn, Twitter)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** package manager ([Install](https://pnpm.io/installation))
  ```bash
  npm install -g pnpm
  ```
- **Supabase Account** ([Sign up](https://supabase.com))
- **Google AI API Key** ([Get here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/artly-studio.git
   cd artly-studio
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Google Gemini API Key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up Supabase Database**
   
   Run the following SQL in your Supabase SQL Editor:

   ```sql
   -- Create jobs table
   CREATE TABLE jobs (
     job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     device_id TEXT NOT NULL,
     status TEXT NOT NULL,
     original_prompt TEXT,
     enhanced_prompt TEXT,
     preview_url TEXT,
     final_url TEXT,
     asset_id TEXT,
     settings JSONB,
     thought_signature TEXT,
     conversation_history JSONB,
     error TEXT,
     progress_message TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create assets table
   CREATE TABLE assets (
     asset_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     url TEXT NOT NULL,
     mime_type TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create indexes
   CREATE INDEX idx_jobs_device_id ON jobs(device_id);
   CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
   ```

5. **Set up Supabase Storage**
   
   In Supabase Dashboard → Storage:
   - Create a new **public** bucket named `generated`
   - This will store all generated images

6. **Run the development server**
   ```bash
   pnpm dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
artly-studio/
├── app/
│   ├── api/              # API routes
│   │   ├── edit/         # Image generation endpoint
│   │   ├── enhance-prompt/ # Prompt enhancement
│   │   ├── history/      # User history retrieval
│   │   ├── upload/       # File upload handler
│   │   └── validate-gemini-key/ # API key validation
│   ├── globals.css       # Global styles & design tokens
│   └── page.tsx          # Landing page
├── components/
│   ├── creative-studio/  # Main studio components
│   │   ├── config-panel.tsx       # AI controls
│   │   ├── preview-canvas.tsx     # Live display
│   │   ├── history-panel.tsx      # Smart history
│   │   ├── example-images.tsx     # Gallery grid
│   │   └── prompt-gallery-modal.tsx # Inspiration hub
│   └── ui/               # Shadcn UI components
├── lib/
│   ├── gemini.ts         # Gemini AI client
│   ├── supabase.ts       # Supabase client
│   └── types.ts          # TypeScript types
└── public/               # Static assets
```

## 🔧 Configuration

### Quick Presets

Edit `lib/types.ts` to customize the quick preset templates:

```typescript
export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: "ecommerce",
    name: "E-commerce",
    icon: "shopping-bag",
    aspectRatio: "1:1",
    style: "product-photo",
    suggestedPrompts: [
      "Remove background, add soft shadow",
      "Place product on marble surface",
    ],
  },
  // Add more presets...
]
```

### Style Modes

8 built-in styles:
- Realistic
- Cinematic
- Flat
- Product Photo
- Artistic
- Anime
- Sketch
- 3D Render

### Aspect Ratios

6 supported ratios:
- 1:1 (Square)
- 16:9 (Widescreen)
- 9:16 (Portrait)
- 4:3 (Classic)
- 4:5 (Social)
- 3:4 (Vertical)

## 📦 Available Scripts

```bash
# Development
pnpm dev          # Start dev server (http://localhost:3000)

# Production
pnpm build        # Build for production
pnpm start        # Start production server

# Code Quality
pnpm lint         # Run ESLint
```

## 🎯 Usage Guide

### 1. Generate from Text
1. Select a **Quick Preset** or customize settings
2. Enter your prompt (or use a template with placeholders)
3. Click **Generate Preview** (1K) or **Generate HD** (4K)

### 2. Edit an Image
1. Upload or paste an image URL
2. Tools tab will auto-open
3. Configure background tools or color swap
4. Click **Apply Tool**

### 3. Adjust in Browser
1. After generation, go to **Adjust** tab
2. Tweak brightness, contrast, saturation, clarity
3. Click **Apply Changes** to save permanently

### 4. Browse History
1. Click on any image in the **History Panel**
2. Image loads for further editing
3. Copy prompt with one click

## 🔑 API Key Management

### Using Personal Gemini Key
1. Click **Gemini API** button in header
2. Paste your API key
3. Click **Save key**
4. Your key is stored locally and used as a fallback

### Why Add Your Key?
- Shared studio key has rate limits
- Personal key ensures uninterrupted generation
- Automatic fallback when shared quota exhausted

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (Turbopack) |
| **Frontend** | React 19, TypeScript |
| **AI Models** | Gemini 3 Pro Image, Gemini 2.0 Flash |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **Styling** | Tailwind CSS 4, Custom Glassmorphic Design |
| **UI Components** | Radix UI, Shadcn |
| **Animations** | GSAP, Tailwind Animate |
| **State Management** | React Hooks |

## 🌟 Key Features Explained

### Dual-Layer Processing
- **Server**: AI generation, prompt enhancement, image grounding
- **Client**: Instant adjustments, preview rendering, history caching

### Progressive Storage
- **Local-First**: Device ID for anonymous tracking
- **Cloud Backup**: Supabase for cross-device sync
- **Asset Management**: Uploaded images stored with job metadata

### Intelligent UX
- Auto-tab switching when uploading images
- Real-time prompt validation (word count checks)
- Loading states with progress messages
- Fallback API key system

## 🐛 Troubleshooting

### "fetch failed" or "ECONNRESET" errors
- Check internet connection
- Verify Gemini API key is valid
- Try using personal API key as fallback
- Check firewall/proxy settings

### Images not generating
- Ensure Supabase storage bucket `generated` exists and is **public**
- Verify `GEMINI_API_KEY` in `.env.local`
- Check browser console for detailed errors

### Database errors
- Confirm Supabase tables are created with correct schema
- Verify `SUPABASE_SERVICE_ROLE_KEY` has admin permissions

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 👨‍💻 Author

**Suman Jana**
- GitHub: [@rocker1166](https://github.com/rocker1166)

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - Powering the image generation
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Vercel](https://vercel.com/) - Deployment platform
- [Shadcn UI](https://ui.shadcn.com/) - UI component foundation

---

**Built with ❤️ using cutting-edge AI technology**

# Creative Studio

AI-powered image generation and editing tool built with Next.js, Gemini 3 Pro, and Supabase.

## Features

- **Text-to-Image Generation**: Create images from text descriptions
- **Image Editing**: Modify existing images with natural language
- **Multi-turn Editing**: Iteratively refine images in conversation
- **Quick Presets**: E-commerce, Social Post, Poster, Avatar templates
- **Advanced Tools**: Background removal/replace/blur, color swap, adjustments
- **Export Presets**: Instagram, LinkedIn, Twitter, YouTube, Presentation formats
- **Undo/Redo**: Keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- **Device-based History**: Persistent history without authentication

## Architecture

\`\`\`
User Prompt → Gemini 3 Pro (Enhance) → Gemini 3 Pro Image (Generate) → Supabase Storage
\`\`\`

## Setup

### 1. Clone and Install

\`\`\`bash
git clone <repo>
cd creative-studio
npm install
\`\`\`

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `scripts/001-create-tables.sql`
3. Go to Storage and create two buckets:
   - `assets` (public, 10MB limit)
   - `generated` (public, 20MB limit)
4. Run `scripts/002-create-storage-buckets.sql` for storage policies

### 3. Environment Variables

\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- `GEMINI_API_KEY` - Google AI Studio API key

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/enhance-prompt` | POST | Enhance user prompt with Gemini 3 Pro |
| `/api/upload` | POST | Upload image to Supabase Storage |
| `/api/upload-url` | POST | Upload image from URL |
| `/api/edit` | POST | Create generation/edit job |
| `/api/job/[jobId]` | GET | Get job status |
| `/api/history` | GET | Get device-specific history |
| `/api/export` | POST | Export with platform preset |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Docker

\`\`\`bash
docker build -t creative-studio .
docker run -p 3000:3000 --env-file .env.local creative-studio
\`\`\`

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **AI**: Google Gemini 3 Pro (text), Gemini 3 Pro Image (generation)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Styling**: Glassmorphic dark theme

## License

MIT

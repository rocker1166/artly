import { GoogleGenAI } from "@google/genai"

function requireGeminiKey() {
  const key = process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!key) {
    throw new Error("GEMINI_API_KEY is required but was not provided")
  }
  return key
}

let aiInstance: GoogleGenAI | null = null

export function getGeminiClient(customKey?: string): GoogleGenAI {
  const trimmedKey = customKey?.trim()
  if (trimmedKey) {
    return new GoogleGenAI({ apiKey: trimmedKey })
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: requireGeminiKey(),
    })
  }
  return aiInstance
}

// Style-specific prompt enhancement templates
export const STYLE_PROMPTS: Record<string, string> = {
  photorealistic: `You are an expert prompt engineer for AI image generation. 
Transform the user's simple prompt into a detailed, photorealistic image generation prompt.
Include: lighting conditions, camera angle, lens type, time of day, atmospheric details, texture descriptions.
Keep it under 200 words. Output ONLY the enhanced prompt, nothing else.`,

  cinematic: `You are an expert prompt engineer for AI image generation.
Transform the user's simple prompt into a cinematic, movie-quality image generation prompt.
Include: film grain, color grading (teal-orange, etc.), anamorphic lens effects, dramatic lighting, movie scene composition.
Keep it under 200 words. Output ONLY the enhanced prompt, nothing else.`,

  flat: `You are an expert prompt engineer for AI image generation.
Transform the user's simple prompt into a flat design, minimalist illustration prompt.
Include: solid colors, simple shapes, no shadows, vector-style, clean lines, limited color palette.
Keep it under 200 words. Output ONLY the enhanced prompt, nothing else.`,

  "product-photo": `You are an expert prompt engineer for AI image generation.
Transform the user's simple prompt into a professional e-commerce product photography prompt.
Include: studio lighting setup, seamless white/gray background, product focus, clean shadows, commercial quality.
Keep it under 200 words. Output ONLY the enhanced prompt, nothing else.`,

  artistic: `You are an expert prompt engineer for AI image generation.
Transform the user's simple prompt into an artistic, painterly image generation prompt.
Include: art style references (impressionism, expressionism, etc.), brush stroke descriptions, color palette, mood, artistic techniques.
Keep it under 200 words. Output ONLY the enhanced prompt, nothing else.`,

  anime: `You are an expert prompt engineer for AI image generation.
Transform the user's simple prompt into a detailed anime/manga style image generation prompt.
Include: anime art style specifics, character design elements, background style, color vibrancy, studio references if applicable.
Keep it under 200 words. Output ONLY the enhanced prompt, nothing else.`,

  sketch: `You are an expert prompt engineer for AI image generation.
Transform the user's simple prompt into a detailed sketch/drawing style image generation prompt.
Include: pencil/pen technique, shading style, line weight, paper texture, hatching patterns.
Keep it under 200 words. Output ONLY the enhanced prompt, nothing else.`,

  "3d-render": `You are an expert prompt engineer for AI image generation.
Transform the user's simple prompt into a detailed 3D render style image generation prompt.
Include: rendering engine style (Octane, Blender, etc.), lighting setup, material properties, reflection/refraction details.
Keep it under 200 words. Output ONLY the enhanced prompt, nothing else.`,
}

// Aspect ratio to pixel dimensions
export const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
  "4:3": { width: 1152, height: 896 },
  "4:5": { width: 896, height: 1120 },
  "3:4": { width: 896, height: 1152 },
}

// Size multipliers for resolution
export const SIZE_MULTIPLIERS: Record<string, number> = {
  "1K": 1,
  "2K": 1.5,
  "4K": 2,
}

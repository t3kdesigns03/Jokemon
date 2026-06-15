import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/client'
import { buildEvolutionPrompt, rollEvolutionTier, type Element, type EvolutionTier } from '@/lib/evolution'

// Configure fal client
fal.config({ credentials: process.env.FAL_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, imageUrl, element, forceTier } = body as {
      imageBase64?: string
      imageUrl?: string
      element: Element
      forceTier?: EvolutionTier
    }

    if (!element) {
      return NextResponse.json({ error: 'Element is required' }, { status: 400 })
    }
    if (!imageBase64 && !imageUrl) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    // Roll the tier (or use forced tier for testing)
    const tier = forceTier ?? rollEvolutionTier()
    const prompt = buildEvolutionPrompt(element, tier)

    // Build the image URL/data URI for fal
    const petImageUrl = imageUrl ?? `data:image/jpeg;base64,${imageBase64}`

    // Use FLUX Dev image-to-image for style transfer
    const result = await fal.run('fal-ai/flux/dev/image-to-image', {
      input: {
        image_url: petImageUrl,
        prompt,
        strength: tier === 'legendary' ? 0.95 : tier === 'champion' ? 0.88 : tier === 'evolved' ? 0.82 : 0.78,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      },
    }) as { data: { images: Array<{ url: string }> } }

    const joKemonImageUrl = result.data.images?.[0]?.url
    if (!joKemonImageUrl) {
      throw new Error('No image returned from fal.ai')
    }

    return NextResponse.json({
      success: true,
      tier,
      joKemonImageUrl,
      prompt,
    })
  } catch (err) {
    console.error('Evolution error:', err)
    const message = err instanceof Error ? err.message : 'Evolution failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

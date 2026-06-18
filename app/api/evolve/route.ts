import { NextRequest, NextResponse } from 'next/server'
import { buildEvolutionPrompt, rollEvolutionTier, type Element, type EvolutionTier } from '@/lib/evolution'

export const maxDuration = 60

const FAL_KEY = process.env.FAL_KEY ?? process.env.FAL_API_KEY ?? ''
const MODEL = 'fal-ai/flux/dev/image-to-image'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, element, forceTier } = body as {
      imageBase64?: string
      element: Element
      forceTier?: EvolutionTier
    }

    if (!element) return NextResponse.json({ error: 'Element is required' }, { status: 400 })
    if (!imageBase64) return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    if (!FAL_KEY) return NextResponse.json({ error: 'FAL API key not configured' }, { status: 500 })

    const tier = forceTier ?? rollEvolutionTier()
    const prompt = buildEvolutionPrompt(element, tier)

    // Use data URL directly — image is pre-compressed client-side to ~100KB
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`

    // Synchronous call — waits for result directly
    const falRes = await fetch(`https://fal.run/${MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageDataUrl,
        prompt,
        strength: 0.80,
        num_inference_steps: 10,
        num_images: 1,
        enable_safety_checker: true,
      }),
    })

    if (!falRes.ok) {
      const errText = await falRes.text()
      throw new Error(`fal.ai error (${falRes.status}): ${errText}`)
    }

    const result = await falRes.json()
    const joKemonImageUrl = result.images?.[0]?.url ?? result.output?.images?.[0]?.url

    if (!joKemonImageUrl) {
      console.error('fal.ai result:', JSON.stringify(result).slice(0, 500))
      throw new Error('No image in fal.ai response')
    }

    // Proxy image through server → avoids CORS when browser renders it
    const imgRes = await fetch(joKemonImageUrl)
    const imgBuffer = await imgRes.arrayBuffer()
    const imgBase64 = Buffer.from(imgBuffer).toString('base64')
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg'
    const joKemonDataUrl = `data:${mimeType};base64,${imgBase64}`

    return NextResponse.json({ success: true, tier, joKemonImageUrl: joKemonDataUrl })
  } catch (err) {
    console.error('Evolution error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Evolution failed' }, { status: 500 })
  }
}

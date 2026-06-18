import { NextRequest, NextResponse } from 'next/server'
import { buildEvolutionPrompt, rollEvolutionTier, type Element, type EvolutionTier } from '@/lib/evolution'

export const maxDuration = 60

const FAL_KEY = process.env.FAL_KEY ?? process.env.FAL_API_KEY ?? ''
const MODEL = 'fal-ai/flux/dev/image-to-image'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, element, petName, forceTier } = body as {
      imageBase64?: string
      element: Element
      petName?: string
      forceTier?: EvolutionTier
    }

    if (!element) return NextResponse.json({ error: 'Element is required' }, { status: 400 })
    if (!imageBase64) return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    if (!FAL_KEY) return NextResponse.json({ error: 'FAL API key not configured' }, { status: 500 })

    const tier = forceTier ?? rollEvolutionTier()
    const prompt = buildEvolutionPrompt(element, tier, petName)

    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 55_000)

    let falRes: Response
    try {
      falRes = await fetch(`https://fal.run/${MODEL}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Key ${FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageDataUrl,
          prompt,
          strength: 0.60,
          num_inference_steps: 20,
          num_images: 1,
          seed: Math.floor(Math.random() * 9_999_999),
          enable_safety_checker: true,
        }),
      })
    } finally {
      clearTimeout(timeout)
    }

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

    return NextResponse.json({ success: true, tier, joKemonImageUrl })
  } catch (err) {
    console.error('Evolution error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Evolution failed' }, { status: 500 })
  }
}

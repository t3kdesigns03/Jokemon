import { NextRequest, NextResponse } from 'next/server'
import { buildEvolutionPrompt, rollEvolutionTier, type Element, type EvolutionTier } from '@/lib/evolution'

export const maxDuration = 15 // Just enough to submit — no polling here

const FAL_KEY = process.env.FAL_KEY ?? process.env.FAL_API_KEY ?? ''
const MODEL = 'fal-ai/flux/dev/image-to-image'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, imageUrl, element, forceTier } = body as {
      imageBase64?: string
      imageUrl?: string
      element: Element
      forceTier?: EvolutionTier
    }

    if (!element) return NextResponse.json({ error: 'Element is required' }, { status: 400 })
    if (!imageBase64 && !imageUrl) return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    if (!FAL_KEY) return NextResponse.json({ error: 'FAL API key not configured' }, { status: 500 })

    const tier = forceTier ?? rollEvolutionTier()
    const prompt = buildEvolutionPrompt(element, tier)
    const petImageUrl = imageUrl ?? `data:image/jpeg;base64,${imageBase64}`

    // Submit only — return requestId immediately, browser will poll
    const submitRes = await fetch(`https://queue.fal.run/${MODEL}`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: petImageUrl,
        prompt,
        strength: 0.80,
        num_inference_steps: 8,
        num_images: 1,
        enable_safety_checker: true,
      }),
    })

    if (!submitRes.ok) {
      const errText = await submitRes.text()
      throw new Error(`fal.ai error (${submitRes.status}): ${errText}`)
    }

    const submitted = await submitRes.json()
    const requestId = submitted.request_id

    if (!requestId) throw new Error('No request_id from fal.ai')

    return NextResponse.json({ success: true, tier, requestId, model: MODEL })
  } catch (err) {
    console.error('Evolution error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Evolution failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { buildEvolutionPrompt, rollEvolutionTier, type Element, type EvolutionTier } from '@/lib/evolution'

const FAL_KEY = process.env.FAL_KEY ?? process.env.FAL_API_KEY ?? ''

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

    const strength =
      tier === 'legendary' ? 0.95
      : tier === 'champion' ? 0.88
      : tier === 'evolved' ? 0.82
      : 0.78

    // Submit to fal.ai queue
    const submitRes = await fetch('https://queue.fal.run/fal-ai/flux/dev/image-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: petImageUrl,
        prompt,
        strength,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      }),
    })

    if (!submitRes.ok) {
      const errText = await submitRes.text()
      throw new Error(`fal.ai submit failed (${submitRes.status}): ${errText}`)
    }

    const { request_id } = await submitRes.json()

    // Poll for result
    let joKemonImageUrl: string | null = null
    for (let i = 0; i < 60; i++) {
      await sleep(2000)
      const pollRes = await fetch(
        `https://queue.fal.run/fal-ai/flux/dev/image-to-image/requests/${request_id}`,
        { headers: { 'Authorization': `Key ${FAL_KEY}` } }
      )
      if (!pollRes.ok) continue
      const pollData = await pollRes.json()
      if (pollData.status === 'COMPLETED') {
        joKemonImageUrl = pollData.output?.images?.[0]?.url ?? null
        break
      }
      if (pollData.status === 'FAILED') throw new Error('fal.ai generation failed')
    }

    if (!joKemonImageUrl) throw new Error('Timed out waiting for image')

    return NextResponse.json({ success: true, tier, joKemonImageUrl, prompt })
  } catch (err) {
    console.error('Evolution error:', err)
    const message = err instanceof Error ? err.message : 'Evolution failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

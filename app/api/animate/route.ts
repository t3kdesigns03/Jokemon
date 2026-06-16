import { NextRequest, NextResponse } from 'next/server'
import { buildVideoPrompt, type Element, type EvolutionTier } from '@/lib/evolution'

const FAL_KEY = process.env.FAL_KEY ?? process.env.FAL_API_KEY ?? ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { joKemonImageUrl, element, tier } = body as {
      joKemonImageUrl: string
      element: Element
      tier: EvolutionTier
    }

    if (!joKemonImageUrl || !element || !tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!FAL_KEY) return NextResponse.json({ error: 'FAL API key not configured' }, { status: 500 })

    const prompt = buildVideoPrompt(element, tier)

    const submitRes = await fetch('https://queue.fal.run/fal-ai/kling-video/v1.6/standard/image-to-video', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: joKemonImageUrl,
        prompt,
        duration: '5',
        aspect_ratio: '1:1',
      }),
    })

    if (!submitRes.ok) {
      const errText = await submitRes.text()
      throw new Error(`fal.ai submit failed (${submitRes.status}): ${errText}`)
    }

    const { request_id } = await submitRes.json()

    return NextResponse.json({ success: true, requestId: request_id })
  } catch (err) {
    console.error('Animation error:', err)
    const message = err instanceof Error ? err.message : 'Animation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

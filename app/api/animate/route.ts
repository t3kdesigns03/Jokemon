import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/client'
import { buildVideoPrompt, type Element, type EvolutionTier } from '@/lib/evolution'

fal.config({ credentials: process.env.FAL_API_KEY })

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

    const prompt = buildVideoPrompt(element, tier)

    // Use Kling v1.6 standard image-to-video
    const result = await fal.run('fal-ai/kling-video/v1.6/standard/image-to-video', {
      input: {
        image_url: joKemonImageUrl,
        prompt,
        duration: '5',
        aspect_ratio: '1:1',
      },
    }) as { data: { video: { url: string } } }

    const videoUrl = result.data?.video?.url
    if (!videoUrl) {
      throw new Error('No video returned from fal.ai')
    }

    return NextResponse.json({ success: true, videoUrl })
  } catch (err) {
    console.error('Animation error:', err)
    const message = err instanceof Error ? err.message : 'Animation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { buildEvolutionPrompt, rollEvolutionTier, type Element, type EvolutionTier } from '@/lib/evolution'

export const maxDuration = 60

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

    // Submit
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
      throw new Error(`Submit failed (${submitRes.status}): ${errText}`)
    }

    const submitted = await submitRes.json()
    const request_id = submitted.request_id
    if (!request_id) throw new Error(`No request_id returned: ${JSON.stringify(submitted)}`)

    // Poll — 8 steps should finish in 5-15s
    for (let i = 0; i < 25; i++) {
      await sleep(2000)
      const pollRes = await fetch(
        `https://queue.fal.run/${MODEL}/requests/${request_id}`,
        { headers: { 'Authorization': `Key ${FAL_KEY}` } }
      )
      const pollData = await pollRes.json()
      console.log(`Poll ${i + 1}:`, pollData.status)

      if (pollData.status === 'COMPLETED') {
        const joKemonImageUrl = pollData.output?.images?.[0]?.url
        if (!joKemonImageUrl) throw new Error(`Completed but no image: ${JSON.stringify(pollData.output)}`)
        return NextResponse.json({ success: true, tier, joKemonImageUrl, prompt })
      }
      if (pollData.status === 'FAILED') {
        throw new Error(`fal.ai generation failed: ${JSON.stringify(pollData)}`)
      }
    }

    throw new Error('Timed out after 50s — fal.ai queue may be busy')
  } catch (err) {
    console.error('Evolution error:', err)
    const message = err instanceof Error ? err.message : 'Evolution failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

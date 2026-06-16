import { NextRequest, NextResponse } from 'next/server'
import { buildEvolutionPrompt, rollEvolutionTier, type Element, type EvolutionTier } from '@/lib/evolution'

export const maxDuration = 30

const FAL_KEY = process.env.FAL_KEY ?? process.env.FAL_API_KEY ?? ''
const MODEL = 'fal-ai/flux/schnell/image-to-image'

async function uploadImageToFal(base64: string, mimeType: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64')
  const uploadRes = await fetch('https://fal.run/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': mimeType,
      'Accept': 'application/json',
    },
    body: buffer,
  })
  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    throw new Error(`Image upload failed (${uploadRes.status}): ${err}`)
  }
  const json = await uploadRes.json()
  // fal returns { url: "https://..." }
  const url = json.url ?? json.file_url ?? json.cdn_url
  if (!url) throw new Error('No URL returned from fal.ai upload')
  return url
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageBase64, imageUrl, element, forceTier, mimeType = 'image/jpeg' } = body as {
      imageBase64?: string
      imageUrl?: string
      element: Element
      forceTier?: EvolutionTier
      mimeType?: string
    }

    if (!element) return NextResponse.json({ error: 'Element is required' }, { status: 400 })
    if (!imageBase64 && !imageUrl) return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    if (!FAL_KEY) return NextResponse.json({ error: 'FAL API key not configured' }, { status: 500 })

    const tier = forceTier ?? rollEvolutionTier()
    const prompt = buildEvolutionPrompt(element, tier)

    // Upload to fal.ai CDN first — data URLs cause timeouts
    let petImageUrl = imageUrl
    if (!petImageUrl && imageBase64) {
      petImageUrl = await uploadImageToFal(imageBase64, mimeType)
    }

    // Submit to queue — returns immediately with request_id
    const submitRes = await fetch(`https://queue.fal.run/${MODEL}`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: petImageUrl,
        prompt,
        strength: 0.82,
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
    })

    if (!submitRes.ok) {
      const errText = await submitRes.text()
      throw new Error(`fal.ai submit error (${submitRes.status}): ${errText}`)
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

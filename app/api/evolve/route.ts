import { NextRequest, NextResponse } from 'next/server'
import { buildEvolutionPrompt, rollEvolutionTier, type Element, type EvolutionTier } from '@/lib/evolution'

export const maxDuration = 60

const FAL_KEY = process.env.FAL_KEY ?? process.env.FAL_API_KEY ?? ''
const MODEL = 'fal-ai/flux/dev/image-to-image'

async function uploadImageToFal(base64: string, mimeType: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64')
  const res = await fetch('https://fal.run/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': mimeType,
    },
    body: buffer,
  })
  if (!res.ok) throw new Error(`Upload failed (${res.status}): ${await res.text()}`)
  const json = await res.json()
  const url = json.url ?? json.file_url
  if (!url) throw new Error('No URL from fal.ai upload')
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

    // Step 1: Upload image to fal.ai CDN
    let petImageUrl = imageUrl
    if (!petImageUrl && imageBase64) {
      petImageUrl = await uploadImageToFal(imageBase64, mimeType)
    }

    // Step 2: Call SYNCHRONOUS endpoint — waits for result, no polling needed
    const falRes = await fetch(`https://fal.run/${MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: petImageUrl,
        prompt,
        strength: 0.80,
        num_inference_steps: 8,
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
      console.error('fal.ai result shape:', JSON.stringify(result).slice(0, 500))
      throw new Error('No image URL in fal.ai response')
    }

    return NextResponse.json({ success: true, tier, joKemonImageUrl })
  } catch (err) {
    console.error('Evolution error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Evolution failed' }, { status: 500 })
  }
}

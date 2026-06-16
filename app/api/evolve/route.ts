import { NextRequest, NextResponse } from 'next/server'
import { buildEvolutionPrompt, rollEvolutionTier, type Element, type EvolutionTier } from '@/lib/evolution'

const XAI_KEY = process.env.XAI_API_KEY ?? ''
const XAI_BASE = 'https://api.x.ai/v1'

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
    if (!XAI_KEY) return NextResponse.json({ error: 'XAI API key not configured' }, { status: 500 })

    const tier = forceTier ?? rollEvolutionTier()

    // Step 1: Use Grok Vision to describe the pet
    const imageContent = imageUrl
      ? { type: 'image_url', image_url: { url: imageUrl } }
      : { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }

    const visionRes = await fetch(`${XAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-vision-latest',
        messages: [{
          role: 'user',
          content: [
            imageContent,
            {
              type: 'text',
              text: 'Describe this pet in detail for a creature design artist: species, breed, fur/coat color and pattern, eye color, size, distinctive features, and overall vibe. Be specific and vivid. 2-3 sentences max.',
            },
          ],
        }],
        max_tokens: 200,
      }),
    })

    let petDescription = 'a cute pet'
    if (visionRes.ok) {
      const visionData = await visionRes.json()
      petDescription = visionData.choices?.[0]?.message?.content ?? petDescription
    }

    // Step 2: Build the JokeMon prompt using the pet description + evolution data
    const basePrompt = buildEvolutionPrompt(element, tier)
    const fullPrompt = `${basePrompt}. Based on this real pet: ${petDescription}`

    // Step 3: Generate JokeMon with Grok Aurora
    const imageRes = await fetch(`${XAI_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-image',
        prompt: fullPrompt,
        n: 1,
        response_format: 'url',
      }),
    })

    if (!imageRes.ok) {
      const errText = await imageRes.text()
      throw new Error(`xAI image gen failed (${imageRes.status}): ${errText}`)
    }

    const imageData = await imageRes.json()
    const joKemonImageUrl = imageData.data?.[0]?.url

    if (!joKemonImageUrl) throw new Error('No image returned from xAI')

    return NextResponse.json({ success: true, tier, joKemonImageUrl, prompt: fullPrompt })
  } catch (err) {
    console.error('Evolution error:', err)
    const message = err instanceof Error ? err.message : 'Evolution failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

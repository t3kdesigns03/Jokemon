import { NextRequest, NextResponse } from 'next/server'
import { buildEvolutionPrompt, rollEvolutionTier, type Element, type EvolutionTier } from '@/lib/evolution'

export const maxDuration = 60 // Vercel: allow up to 60s

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
    if (!XAI_KEY) return NextResponse.json({ error: 'XAI_API_KEY not configured' }, { status: 500 })

    const tier = forceTier ?? rollEvolutionTier()

    // Step 1: Grok Vision describes the pet
    const petImageUrl = imageUrl ?? `data:image/jpeg;base64,${imageBase64}`

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
            { type: 'image_url', image_url: { url: petImageUrl } },
            {
              type: 'text',
              text: 'Describe this pet for a creature designer: species, breed if visible, fur/coat color and pattern, eye color, size, and 2-3 distinctive features. Be specific. Max 2 sentences.',
            },
          ],
        }],
        max_tokens: 150,
      }),
    })

    let petDescription = 'a cute pet with distinctive features'
    if (visionRes.ok) {
      const visionData = await visionRes.json()
      petDescription = visionData.choices?.[0]?.message?.content ?? petDescription
    }

    // Step 2: Build prompt and generate JokeMon with Grok Aurora
    const basePrompt = buildEvolutionPrompt(element, tier)
    const fullPrompt = `${basePrompt}. Inspired by this real pet: ${petDescription}`

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
      throw new Error(`Grok image gen failed (${imageRes.status}): ${errText}`)
    }

    const imageData = await imageRes.json()
    const joKemonImageUrl = imageData.data?.[0]?.url

    if (!joKemonImageUrl) throw new Error('No image returned from Grok')

    return NextResponse.json({ success: true, tier, joKemonImageUrl, prompt: fullPrompt })
  } catch (err) {
    console.error('Evolution error:', err)
    const message = err instanceof Error ? err.message : 'Evolution failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

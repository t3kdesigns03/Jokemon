import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

/**
 * POST /api/analyze
 * Body: { imageBase64: string }
 * Returns: { description: string }
 *
 * Sends the uploaded image to Claude claude-haiku-4-5-20251001 and asks for a brief
 * visual description to guide the JokeMon card generation prompt.
 */
export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json() as { imageBase64?: string }
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? ''
    if (!ANTHROPIC_KEY) {
      // Graceful fallback — just skip description, still generate cards
      return NextResponse.json({ description: '' })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: 'Describe this image in one short sentence (max 25 words). Focus on: what the subject is, its main colors, body shape, distinctive features (fur, spots, markings, size). Be specific and visual. No punctuation at the end.',
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      // Non-fatal — return empty description and let generation proceed
      console.error('Analyze API error:', res.status, await res.text().catch(() => ''))
      return NextResponse.json({ description: '' })
    }

    const data = await res.json()
    const description: string = data?.content?.[0]?.text?.trim() ?? ''
    return NextResponse.json({ description })

  } catch (err) {
    console.error('Analyze route error:', err)
    // Always return 200 with empty description so generation still proceeds
    return NextResponse.json({ description: '' })
  }
}

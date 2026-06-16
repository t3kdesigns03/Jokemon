import { NextRequest, NextResponse } from 'next/server'

const FAL_KEY = process.env.FAL_KEY ?? process.env.FAL_API_KEY ?? ''

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get('requestId')
  const model = searchParams.get('model') ?? 'fal-ai/flux/dev/image-to-image'

  if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })

  const res = await fetch(
    `https://queue.fal.run/${model}/requests/${requestId}`,
    { headers: { 'Authorization': `Key ${FAL_KEY}` } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: `fal.ai status check failed (${res.status})` }, { status: 502 })
  }

  const data = await res.json()

  if (data.status === 'COMPLETED') {
    const imageUrl = data.output?.images?.[0]?.url ?? null
    const videoUrl = data.output?.video?.url ?? null
    return NextResponse.json({ status: 'COMPLETED', imageUrl, videoUrl })
  }

  if (data.status === 'FAILED') {
    return NextResponse.json({ status: 'FAILED', error: 'Generation failed' })
  }

  return NextResponse.json({ status: data.status ?? 'IN_QUEUE' })
}

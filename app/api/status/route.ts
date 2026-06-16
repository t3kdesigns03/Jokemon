import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 10

const FAL_KEY = process.env.FAL_KEY ?? process.env.FAL_API_KEY ?? ''

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get('requestId')
  const model = searchParams.get('model') ?? 'fal-ai/flux/dev/image-to-image'

  if (!requestId) return NextResponse.json({ error: 'requestId required' }, { status: 400 })

  const res = await fetch(
    `https://queue.fal.run/${model}/requests/${requestId}/status`,
    { headers: { 'Authorization': `Key ${FAL_KEY}` } }
  )

  if (!res.ok) return NextResponse.json({ status: 'IN_QUEUE' })

  const data = await res.json()
  const status = data.status ?? 'IN_QUEUE'

  if (status !== 'COMPLETED') return NextResponse.json({ status })

  // Fetch the actual result
  const resultRes = await fetch(
    `https://queue.fal.run/${model}/requests/${requestId}`,
    { headers: { 'Authorization': `Key ${FAL_KEY}` } }
  )

  if (!resultRes.ok) return NextResponse.json({ status: 'IN_QUEUE' })

  const result = await resultRes.json()
  const imageUrl = result.output?.images?.[0]?.url ?? result.images?.[0]?.url ?? null
  const videoUrl = result.output?.video?.url ?? null

  return NextResponse.json({ status: 'COMPLETED', imageUrl, videoUrl })
}

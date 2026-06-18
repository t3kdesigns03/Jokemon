import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 15

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  const imgRes = await fetch(url)
  if (!imgRes.ok) return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })

  const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
  const buffer = await imgRes.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

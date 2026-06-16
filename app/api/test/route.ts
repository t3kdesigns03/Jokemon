import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    falKey: process.env.FAL_KEY ? 'SET' : 'MISSING',
    falApiKey: process.env.FAL_API_KEY ? 'SET' : 'MISSING',
  })
}

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const TIER_COLORS: Record<string, { main: string; bg: string; text: string }> = {
  starter:   { main: '#94a3b8', bg: '#1f2937', text: '#94a3b8' },
  evolved:   { main: '#38bdf8', bg: '#0f172a', text: '#38bdf8' },
  champion:  { main: '#a855f7', bg: '#0d0618', text: '#c084fc' },
  legendary: { main: '#fbbf24', bg: '#1a0a00', text: '#fbbf24' },
}

const ELEMENT_EMOJI: Record<string, string> = {
  water: '💧', fire: '🔥', wind: '🌪️',
}

const TIER_EMOJI: Record<string, string> = {
  starter: '✨', evolved: '💫', champion: '⚡', legendary: '👑',
}

const RARITY: Record<string, string> = {
  starter: 'Common', evolved: 'Rare', champion: 'Epic', legendary: 'Legendary',
}

const SPECIES: Record<string, Record<string, string>> = {
  water: { starter: 'Aqua Pup', evolved: 'Tide Sprite', champion: 'Storm Leviathan', legendary: 'Cosmic Tide God' },
  fire:  { starter: 'Ember Kit', evolved: 'Flame Fox', champion: 'Inferno Drake', legendary: 'Sol Phoenix' },
  wind:  { starter: 'Gale Pup', evolved: 'Storm Wing', champion: 'Thunder Hawk', legendary: 'Sky Sovereign' },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name    = searchParams.get('name')    || 'Fluffy'
  const tier    = searchParams.get('tier')    || 'starter'
  const element = searchParams.get('element') || 'fire'
  const img     = searchParams.get('img')     || ''
  const hp      = searchParams.get('hp')      || '50'
  const atk     = searchParams.get('atk')     || '40'
  const def     = searchParams.get('def')     || '35'
  const spd     = searchParams.get('spd')     || '45'

  const colors  = TIER_COLORS[tier]  ?? TIER_COLORS.starter
  const elEmoji = ELEMENT_EMOJI[element] ?? '✨'
  const tierEmoji = TIER_EMOJI[tier] ?? '✨'
  const rarity  = RARITY[tier] ?? 'Common'
  const species = SPECIES[element]?.[tier] ?? 'JokeMon'

  // Try to load the artwork image for the OG card preview
  let artworkSrc: string | null = null
  if (img) {
    try {
      // Fetch through the same origin proxy
      const base = new URL(req.url)
      const proxyUrl = `${base.origin}/api/proxy-image?url=${encodeURIComponent(img)}`
      const imgRes = await fetch(proxyUrl)
      if (imgRes.ok) {
        const buf = await imgRes.arrayBuffer()
        const mime = imgRes.headers.get('content-type') || 'image/jpeg'
        artworkSrc = `data:${mime};base64,${Buffer.from(buf).toString('base64')}`
      }
    } catch {
      // no artwork — that's fine
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          display: 'flex', flexDirection: 'row',
          background: `linear-gradient(135deg, #0a0a14 0%, ${colors.bg} 100%)`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute', width: 600, height: 600,
          borderRadius: '50%', top: -100, left: -100,
          background: `radial-gradient(circle, ${colors.main}18 0%, transparent 70%)`,
          display: 'flex',
        }} />

        {/* Left: Text content */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '64px 48px 64px 64px',
          gap: 0,
        }}>
          {/* Rarity badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: `${colors.main}22`,
            border: `1.5px solid ${colors.main}66`,
            borderRadius: 100, padding: '6px 18px',
            width: 'fit-content', marginBottom: 20,
          }}>
            <span style={{ fontSize: 18 }}>{tierEmoji}</span>
            <span style={{
              fontSize: 14, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: colors.text,
            }}>
              {rarity} · {elEmoji} {element.toUpperCase()}
            </span>
          </div>

          {/* Pet name */}
          <div style={{
            fontSize: 62, fontWeight: 900, color: colors.text,
            letterSpacing: '-0.02em', lineHeight: 1.05,
            textShadow: `0 0 40px ${colors.main}88`,
            marginBottom: 4,
          }}>
            {name}
          </div>

          {/* Species */}
          <div style={{
            fontSize: 22, fontWeight: 600, color: `${colors.text}88`,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: 32,
          }}>
            the {species}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 36 }}>
            {[['HP', hp], ['ATK', atk], ['DEF', def], ['SPD', spd]].map(([label, val]) => (
              <div key={label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                padding: '10px 16px', border: `1px solid ${colors.main}33`,
              }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.1em' }}>
                  {label}
                </span>
                <span style={{ fontSize: 24, fontWeight: 900, color: colors.text, marginTop: 2 }}>
                  {val}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              🎴 Evolve YOUR pet at
            </div>
            <div style={{ fontSize: 16, color: `${colors.text}99`, fontWeight: 600 }}>
              jokemon-nine.vercel.app
            </div>
          </div>
        </div>

        {/* Right: Card artwork */}
        <div style={{
          width: 320, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '40px 48px 40px 16px',
        }}>
          <div style={{
            width: 236, height: 330, borderRadius: 16, overflow: 'hidden',
            border: `2.5px solid ${colors.main}`,
            boxShadow: `0 0 40px ${colors.main}66, 0 0 80px ${colors.main}22`,
            background: colors.bg, display: 'flex', flexDirection: 'column',
          }}>
            {/* Card mini-header */}
            <div style={{
              background: `${colors.main}22`, padding: '8px 12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: colors.text, letterSpacing: '0.08em' }}>
                {elEmoji} {element.toUpperCase()}
              </span>
              <span style={{ fontSize: 13, fontWeight: 900, color: colors.text }}>
                {hp} HP
              </span>
            </div>

            {/* Name */}
            <div style={{
              textAlign: 'center', padding: '6px 8px 4px',
              fontSize: 14, fontWeight: 900, letterSpacing: '0.06em',
              color: colors.text, display: 'flex', justifyContent: 'center',
            }}>
              {name.toUpperCase()}
            </div>

            {/* Artwork */}
            <div style={{
              flex: 1, margin: '4px 6px 6px', borderRadius: 8, overflow: 'hidden',
              background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {artworkSrc ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={artworkSrc} alt={name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 48 }}>{elEmoji}</span>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '4px 10px 6px',
              display: 'flex', justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em' }}>
                PokePet Lab
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: `${colors.text}88` }}>
                {tierEmoji} {rarity}
              </span>
            </div>
          </div>
        </div>

        {/* PokePet branding bottom-left */}
        <div style={{
          position: 'absolute', bottom: 20, left: 64,
          fontSize: 13, color: 'rgba(255,255,255,0.18)',
          fontWeight: 600, letterSpacing: '0.06em',
          display: 'flex',
        }}>
          Made with Poke-Pet
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}

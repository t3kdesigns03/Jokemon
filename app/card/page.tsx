import type { Metadata } from 'next'
import Link from 'next/link'
import { TIERS, ELEMENTS, getSpeciesName } from '@/lib/evolution'
import type { Element, EvolutionTier } from '@/lib/evolution'

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

function sp(val: string | string[] | undefined, fallback: string): string {
  return typeof val === 'string' ? val : fallback
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const name  = sp(searchParams.name,    'Fluffy')
  const tier  = sp(searchParams.tier,    'starter') as EvolutionTier
  const el    = sp(searchParams.element, 'fire') as Element
  const img   = sp(searchParams.img,     '')
  const t     = TIERS[tier] ?? TIERS.starter
  const species = getSpeciesName(el, tier)

  const title       = `${name} the ${species} | Poke-Pet`
  const description = `Check out this ${t.rarity} ${name} JokeMon! ${t.emoji} Evolve your own pet at jokemon-nine.vercel.app`
  const ogUrl       = `/api/og?${new URLSearchParams({
    name, tier, element: el, img,
    hp:  sp(searchParams.hp,  '50'),
    atk: sp(searchParams.atk, '40'),
    def: sp(searchParams.def, '35'),
    spd: sp(searchParams.spd, '45'),
  }).toString()}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Poke-Pet',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${name}'s JokeMon Card` }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [ogUrl],
    },
  }
}

// ─── Shared card page (server component) ─────────────────────────────────────

export default function SharedCardPage({ searchParams }: PageProps) {
  const name    = sp(searchParams.name,    'Fluffy')
  const tier    = sp(searchParams.tier,    'starter') as EvolutionTier
  const element = sp(searchParams.element, 'fire') as Element
  const img     = sp(searchParams.img,     '')
  const hp      = Number(sp(searchParams.hp,  '50'))
  const atk     = Number(sp(searchParams.atk, '40'))
  const def     = Number(sp(searchParams.def, '35'))
  const spd     = Number(sp(searchParams.spd, '45'))
  const num     = Number(sp(searchParams.num, '001'))

  const t       = TIERS[tier]   ?? TIERS.starter
  const el      = ELEMENTS[element] ?? ELEMENTS.fire
  const species = getSpeciesName(element, tier)
  const proxyImg = img ? `/api/proxy-image?url=${encodeURIComponent(img)}` : null

  const borderColors: Record<EvolutionTier, string> = {
    starter:   '#374151',
    evolved:   '#94a3b8',
    champion:  '#a855f7',
    legendary: '#fbbf24',
  }
  const bgColors: Record<EvolutionTier, [string, string]> = {
    starter:   ['#111827', '#1f2937'],
    evolved:   ['#0f172a', '#1e3a5f'],
    champion:  ['#0d0618', '#1a0533'],
    legendary: ['#1a0a00', '#2d1400'],
  }
  const [bgFrom, bgTo] = bgColors[tier]

  const maxStat = tier === 'legendary' ? 200 : tier === 'champion' ? 130 : tier === 'evolved' ? 90 : 60
  const showSpecies = tier === 'evolved' || tier === 'champion' || tier === 'legendary'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 16px 48px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(100,60,200,0.12) 0%, transparent 70%)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 6px' }}>
          Shared JokeMon Card
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: t.color }}>
          {name} the {species}
        </h1>
        <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          {t.emoji} {t.rarity} · {el.emoji} {el.label} Type
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: 'min(320px, calc(100vw - 32px))', borderRadius: 14,
        border: `2px solid ${borderColors[tier]}`,
        background: `linear-gradient(160deg, ${bgFrom}, ${bgTo})`,
        boxShadow: `0 0 40px ${t.glowColor}`,
        overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          background: tier === 'legendary' ? 'rgba(251,191,36,0.18)'
                    : tier === 'champion'  ? 'rgba(168,85,247,0.18)'
                    : 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{ fontWeight: 900, fontSize: '0.65em', letterSpacing: '0.1em', color: el.color }}>
            {el.emoji} {el.label} TYPE
          </span>
          <span style={{ fontWeight: 900, fontSize: '0.85em', color: t.color }}>{hp} HP</span>
        </div>

        {/* Name */}
        <div style={{ textAlign: 'center', padding: '8px 14px 4px' }}>
          <div style={{
            fontSize: '1.05em', fontWeight: 900, letterSpacing: '0.08em',
            color: tier === 'legendary' ? '#fbbf24' : tier === 'champion' ? '#c084fc' : 'rgba(255,255,255,0.88)',
            textShadow: tier === 'legendary' ? '0 0 12px rgba(251,191,36,0.8)' : 'none',
          }}>
            {name.toUpperCase()}
          </div>
          {showSpecies && (
            <div style={{
              fontSize: '0.52em', fontWeight: 600, letterSpacing: '0.1em', marginTop: 2,
              textTransform: 'uppercase',
              color: tier === 'legendary' ? 'rgba(251,191,36,0.6)'
                   : tier === 'champion'  ? 'rgba(192,132,252,0.6)'
                   : 'rgba(148,163,184,0.5)',
            }}>
              the {species}
            </div>
          )}
        </div>

        {/* Image */}
        <div style={{
          margin: '6px 8px 8px', borderRadius: 10, overflow: 'hidden',
          aspectRatio: '1', background: '#000',
          border: tier === 'legendary' ? '2px solid rgba(251,191,36,0.7)'
                : tier === 'champion'  ? '2px solid rgba(168,85,247,0.6)'
                : tier === 'evolved'   ? '1px solid rgba(148,163,184,0.5)'
                : '1px solid #374151',
        }}>
          {proxyImg ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={proxyImg} alt={`${name} JokeMon`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 48 }}>
              {el.emoji}
            </div>
          )}
        </div>

        {/* Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 10px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 14px', borderRadius: 999,
            background: tier === 'legendary' ? 'linear-gradient(135deg,#92400e,#d97706,#fbbf24)'
                      : tier === 'champion'  ? 'linear-gradient(135deg,#4c1d95,#7c3aed)'
                      : tier === 'evolved'   ? 'linear-gradient(135deg,#1e293b,#334155)'
                      : '#1f2937',
            border: `1px solid ${borderColors[tier]}`,
            color: tier === 'legendary' ? '#000' : 'white',
            fontWeight: 900, fontSize: '0.65em', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            <span>{t.emoji}</span>
            <span>{t.rarity}</span>
            <span>{'★'.repeat(t.stars)}</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '4px 12px 10px' }}>
          {([['ATK', atk], ['DEF', def], ['SPD', spd]] as [string, number][]).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: '0.55em', fontWeight: 700, color: 'rgba(255,255,255,0.3)', width: 24, flexShrink: 0 }}>
                {label}
              </span>
              <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (val / maxStat) * 100)}%`,
                  height: '100%', borderRadius: 999,
                  background: `linear-gradient(90deg, ${t.color}77, ${t.color})`,
                }} />
              </div>
              <span style={{ fontSize: '0.6em', fontWeight: 700, color: t.color, width: 22, textAlign: 'right' }}>
                {val}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '6px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.5em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            PokePet Lab
          </span>
          <span style={{ fontSize: '0.5em', color: 'rgba(255,255,255,0.18)' }}>
            No. {String(num).padStart(3, '0')}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: 32, textAlign: 'center', maxWidth: 320 }}>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: '0 0 16px' }}>
          Want your own JokeMon card?
        </p>
        <Link href="/" style={{
          display: 'inline-block', padding: '14px 32px', borderRadius: 12,
          background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)`,
          color: '#000', fontWeight: 900, fontSize: 15, textDecoration: 'none',
          letterSpacing: '0.05em',
        }}>
          ⚡ Evolve Your Pet Free →
        </Link>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 12 }}>
          jokemon-nine.vercel.app
        </p>
      </div>
    </div>
  )
}

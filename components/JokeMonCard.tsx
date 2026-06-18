'use client'

import { useEffect, useState } from 'react'
import { ELEMENTS, TIERS } from '@/lib/evolution'
import type { CollectionCard } from '@/lib/collection'

interface JokeMonCardProps {
  card: CollectionCard
  compact?: boolean          // smaller size for gallery grid
  onClick?: () => void
}

// ─── Per-rarity visual config ─────────────────────────────────────────────────

const RARITY_CFG = {
  starter: {
    outerBorder: '2px solid #374151',
    outerGlow: 'none',
    outerRadius: '0.875rem',
    innerBg: 'linear-gradient(160deg, #111827 0%, #1f2937 100%)',
    headerBg: 'rgba(55,65,81,0.4)',
    imageBorder: '1px solid #374151',
    badgeBg: '#1f2937',
    badgeBorder: '#4b5563',
    badgeColor: '#9ca3af',
    statColor: '#6b7280',
    isRainbow: false,
    isEpic: false,
    isRare: false,
    showSparkles: false,
  },
  evolved: {
    outerBorder: '2px solid #94a3b8',
    outerGlow: '0 0 14px rgba(148,163,184,0.3), 0 0 35px rgba(148,163,184,0.1)',
    outerRadius: '0.875rem',
    innerBg: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f1a2e 100%)',
    headerBg: 'rgba(148,163,184,0.08)',
    imageBorder: '1px solid rgba(148,163,184,0.5)',
    badgeBg: 'linear-gradient(135deg,#1e293b,#334155)',
    badgeBorder: '#94a3b8',
    badgeColor: '#e2e8f0',
    statColor: '#94a3b8',
    isRainbow: false,
    isEpic: false,
    isRare: true,
    showSparkles: false,
  },
  champion: {
    outerBorder: '3px solid #a855f7',
    outerGlow: '0 0 25px rgba(168,85,247,0.65), 0 0 60px rgba(168,85,247,0.25)',
    outerRadius: '0.875rem',
    innerBg: 'linear-gradient(160deg, #0d0618 0%, #1a0533 50%, #0d0618 100%)',
    headerBg: 'rgba(168,85,247,0.18)',
    imageBorder: '2px solid rgba(168,85,247,0.6)',
    badgeBg: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
    badgeBorder: '#c084fc',
    badgeColor: '#f3e8ff',
    statColor: '#c084fc',
    isRainbow: false,
    isEpic: true,
    isRare: false,
    showSparkles: false,
  },
  legendary: {
    outerBorder: 'none',
    outerGlow: 'none',   // handled by .legendary-glow-pulse
    outerRadius: '1rem',
    innerBg: 'linear-gradient(160deg, #1a0a00 0%, #2d1400 40%, #1a0500 100%)',
    headerBg: 'rgba(251,191,36,0.18)',
    imageBorder: '2px solid rgba(251,191,36,0.7)',
    badgeBg: 'linear-gradient(135deg,#92400e,#d97706,#fbbf24)',
    badgeBorder: '#fbbf24',
    badgeColor: '#000',
    statColor: '#fbbf24',
    isRainbow: true,
    isEpic: false,
    isRare: false,
    showSparkles: true,
  },
}

// ─── Sparkle positions (stable SSR-safe) ─────────────────────────────────────

const SPARKLE_POS = [
  { x: 8,  y: 15, dur: 2.2, delay: 0.0,  size: 10 },
  { x: 88, y: 10, dur: 1.8, delay: 0.4,  size: 8  },
  { x: 92, y: 55, dur: 2.5, delay: 0.8,  size: 12 },
  { x: 5,  y: 70, dur: 2.0, delay: 1.2,  size: 9  },
  { x: 50, y: 5,  dur: 1.9, delay: 0.6,  size: 7  },
  { x: 20, y: 90, dur: 2.3, delay: 1.6,  size: 11 },
  { x: 75, y: 85, dur: 2.1, delay: 1.0,  size: 8  },
  { x: 40, y: 95, dur: 1.7, delay: 0.3,  size: 10 },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function JokeMonCard({ card, compact = false, onClick }: JokeMonCardProps) {
  const { tier, element, joKemonImageUrl, hp, atk, def, spd, cardNumber } = card
  const cfg = RARITY_CFG[tier]
  const tierCfg = TIERS[tier]
  const elementCfg = ELEMENTS[element]
  const [imgLoaded, setImgLoaded] = useState(false)
  const [showSparkles, setShowSparkles] = useState(false)

  useEffect(() => {
    if (cfg.showSparkles) setShowSparkles(true)
  }, [cfg.showSparkles])

  const maxStat = tier === 'legendary' ? 200 : tier === 'champion' ? 130 : tier === 'evolved' ? 90 : 60
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(joKemonImageUrl)}`

  const cardWidth = compact ? 160 : 320
  const fontSize = compact ? 0.55 : 1

  // ── Outer wrapper handles rainbow vs normal border ──────────────────────────
  const outerContent = (
    <div
      style={{
        borderRadius: cfg.outerRadius,
        overflow: 'hidden',
        background: cfg.innerBg,
        width: cardWidth,
        fontSize: `${fontSize}rem`,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...(cfg.isRainbow ? {} : {
          border: cfg.outerBorder,
          boxShadow: cfg.outerGlow,
        }),
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: compact ? '6px 8px' : '10px 14px',
        background: cfg.headerBg,
        borderBottom: `1px solid rgba(255,255,255,0.05)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 4 : 6 }}>
          <span style={{ fontSize: compact ? '1em' : '1.25em' }}>{elementCfg.emoji}</span>
          <span style={{
            fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
            fontSize: compact ? '0.55em' : '0.7em', color: elementCfg.color,
          }}>
            {elementCfg.label} TYPE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: compact ? '0.45em' : '0.6em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HP</span>
          <span style={{ fontWeight: 900, fontSize: compact ? '0.7em' : '1em', color: tierCfg.color }}>{hp}</span>
        </div>
      </div>

      {/* Image */}
      <div
        className={cfg.isRare ? 'rare-shimmer' : ''}
        style={{
          margin: compact ? '4px' : '8px',
          borderRadius: compact ? '6px' : '10px',
          overflow: 'hidden',
          aspectRatio: '1',
          border: cfg.imageBorder,
          background: '#000',
          boxShadow: cfg.isEpic ? `inset 0 0 20px rgba(168,85,247,0.3)` :
                     cfg.isRainbow ? `inset 0 0 30px rgba(251,191,36,0.2)` : 'none',
          position: 'relative',
        }}
      >
        {!imgLoaded && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: '#0a0a14',
          }}>
            <span style={{ fontSize: compact ? '1.5em' : '2em', opacity: 0.4, animation: 'float 2s ease-in-out infinite' }}>
              {elementCfg.emoji}
            </span>
          </div>
        )}
        <img
          src={proxyUrl}
          alt="JokeMon"
          onLoad={() => setImgLoaded(true)}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease',
          }}
        />
        {/* Epic energy overlay */}
        {cfg.isEpic && (
          <div className="epic-glow-pulse" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle at 50% 110%, rgba(168,85,247,0.2) 0%, transparent 60%)',
          }} />
        )}
        {/* Legendary light rays */}
        {cfg.isRainbow && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle at 50% 80%, rgba(251,191,36,0.15) 0%, transparent 65%)',
          }} />
        )}
      </div>

      {/* Rarity badge */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: compact ? '4px 0' : '8px 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: compact ? 3 : 5,
          padding: compact ? '2px 8px' : '4px 14px',
          borderRadius: 999,
          background: cfg.badgeBg,
          border: `1px solid ${cfg.badgeBorder}`,
          color: cfg.badgeColor,
          fontWeight: 900, textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontSize: compact ? '0.55em' : '0.7em',
          boxShadow: cfg.isEpic   ? `0 0 12px rgba(168,85,247,0.5)` :
                     cfg.isRainbow ? `0 0 16px rgba(251,191,36,0.6)` : 'none',
        }}>
          <span>{tierCfg.emoji}</span>
          <span>{tierCfg.rarity}</span>
          <span>{'★'.repeat(tierCfg.stars)}</span>
        </div>
      </div>

      {/* Stats — hidden in compact mode */}
      {!compact && (
        <div style={{ padding: '4px 12px 10px' }}>
          {[['ATK', atk], ['DEF', def], ['SPD', spd]].map(([label, val]) => (
            <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: '0.6em', fontWeight: 700, color: 'rgba(255,255,255,0.35)', width: 24, flexShrink: 0 }}>
                {label}
              </span>
              <div style={{
                flex: 1, height: 5, borderRadius: 999,
                background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  width: `${Math.min(100, ((val as number) / maxStat) * 100)}%`,
                  background: `linear-gradient(90deg, ${cfg.statColor}88, ${cfg.statColor})`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{ fontSize: '0.65em', fontWeight: 700, color: cfg.statColor, width: 22, textAlign: 'right' }}>
                {val}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: compact ? '3px 8px' : '6px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: compact ? '0.45em' : '0.55em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          PokePet Lab
        </span>
        <span style={{ fontSize: compact ? '0.45em' : '0.55em', color: 'rgba(255,255,255,0.2)' }}>
          No. {String(cardNumber).padStart(3, '0')}
        </span>
      </div>
    </div>
  )

  // ── Legendary: wrap in rainbow border + sparkles ────────────────────────────
  if (cfg.isRainbow) {
    return (
      <div
        className="legendary-glow-pulse"
        style={{ position: 'relative', display: 'inline-block', borderRadius: cfg.outerRadius }}
      >
        {/* Sparkles */}
        {showSparkles && SPARKLE_POS.map((s, i) => (
          <span
            key={i}
            className="sparkle"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              fontSize: s.size,
              '--dur': `${s.dur}s`, '--delay': `${s.delay}s`,
            } as React.CSSProperties}
          >
            ✦
          </span>
        ))}
        {/* Rainbow border wrapper */}
        <div
          className="legendary-rainbow-border"
          style={{ padding: 3, borderRadius: cfg.outerRadius, display: 'inline-block' }}
        >
          {outerContent}
        </div>
      </div>
    )
  }

  return outerContent
}

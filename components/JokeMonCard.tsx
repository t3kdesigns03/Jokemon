'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { ELEMENTS, TIERS } from '@/lib/evolution'
import type { CollectionCard } from '@/lib/collection'

interface JokeMonCardProps {
  card: CollectionCard
  compact?: boolean
  onClick?: () => void
}

const RARITY_CFG = {
  starter: {
    outerBorder: '2px solid #374151', outerGlow: 'none', outerRadius: '0.875rem',
    innerBg: 'linear-gradient(160deg, #111827 0%, #1f2937 100%)',
    headerBg: 'rgba(55,65,81,0.4)', imageBorder: '1px solid #374151',
    badgeBg: '#1f2937', badgeBorder: '#4b5563', badgeColor: '#9ca3af', statColor: '#6b7280',
    isRainbow: false, isEpic: false, isRare: false, showSparkles: false,
  },
  evolved: {
    outerBorder: '2px solid #94a3b8', outerGlow: '0 0 14px rgba(148,163,184,0.3)', outerRadius: '0.875rem',
    innerBg: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f1a2e 100%)',
    headerBg: 'rgba(148,163,184,0.08)', imageBorder: '1px solid rgba(148,163,184,0.5)',
    badgeBg: 'linear-gradient(135deg,#1e293b,#334155)', badgeBorder: '#94a3b8', badgeColor: '#e2e8f0',
    statColor: '#94a3b8', isRainbow: false, isEpic: false, isRare: true, showSparkles: false,
  },
  champion: {
    outerBorder: '3px solid #a855f7', outerGlow: '0 0 25px rgba(168,85,247,0.65), 0 0 60px rgba(168,85,247,0.25)',
    outerRadius: '0.875rem',
    innerBg: 'linear-gradient(160deg, #0d0618 0%, #1a0533 50%, #0d0618 100%)',
    headerBg: 'rgba(168,85,247,0.18)', imageBorder: '2px solid rgba(168,85,247,0.6)',
    badgeBg: 'linear-gradient(135deg,#4c1d95,#7c3aed)', badgeBorder: '#c084fc', badgeColor: '#f3e8ff',
    statColor: '#c084fc', isRainbow: false, isEpic: true, isRare: false, showSparkles: false,
  },
  legendary: {
    outerBorder: 'none', outerGlow: 'none', outerRadius: '1rem',
    innerBg: 'linear-gradient(160deg, #1a0a00 0%, #2d1400 40%, #1a0500 100%)',
    headerBg: 'rgba(251,191,36,0.18)', imageBorder: '2px solid rgba(251,191,36,0.7)',
    badgeBg: 'linear-gradient(135deg,#92400e,#d97706,#fbbf24)', badgeBorder: '#fbbf24', badgeColor: '#000',
    statColor: '#fbbf24', isRainbow: true, isEpic: false, isRare: false, showSparkles: true,
  },
}

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

// ─── Tilt wrapper for full card ───────────────────────────────────────────────

function TiltCard({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rotateX = useSpring(useTransform(rawY, [-1, 1], [8, -8]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(rawX, [-1, 1], [-8, 8]),  { stiffness: 300, damping: 30 })

  if (disabled) return <>{children}</>

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', display: 'inline-block' }}
      onMouseMove={e => {
        const rect = ref.current!.getBoundingClientRect()
        rawX.set(((e.clientX - rect.left) / rect.width  - 0.5) * 2)
        rawY.set(((e.clientY - rect.top)  / rect.height - 0.5) * 2)
      }}
      onMouseLeave={() => { rawX.set(0); rawY.set(0) }}
      whileHover={{ scale: 1.02 }}
      transition={{ scale: { type: 'spring', stiffness: 400, damping: 25 } }}
    >
      {children}
    </motion.div>
  )
}

// ─── Main Card ────────────────────────────────────────────────────────────────

export default function JokeMonCard({ card, compact = false, onClick }: JokeMonCardProps) {
  const { tier, element, joKemonImageUrl, hp, atk, def, spd, cardNumber } = card
  const cfg = RARITY_CFG[tier]
  const tierCfg = TIERS[tier]
  const elementCfg = ELEMENTS[element]
  const [imgLoaded, setImgLoaded] = useState(false)
  const [showSparkles, setShowSparkles] = useState(false)
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(joKemonImageUrl)}`
  const cardWidth = compact ? 160 : 'min(320px, calc(100vw - 40px))'
  const maxStat = tier === 'legendary' ? 200 : tier === 'champion' ? 130 : tier === 'evolved' ? 90 : 60

  useEffect(() => { if (cfg.showSparkles) setShowSparkles(true) }, [cfg.showSparkles])

  const inner = (
    <div
      style={{
        borderRadius: cfg.outerRadius, overflow: 'hidden',
        background: cfg.innerBg, width: cardWidth,
        cursor: onClick ? 'pointer' : 'default', userSelect: 'none',
        ...(cfg.isRainbow ? {} : { border: cfg.outerBorder, boxShadow: cfg.outerGlow }),
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: compact ? '6px 8px' : '10px 14px',
        background: cfg.headerBg, borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 4 : 6 }}>
          <span style={{ fontSize: compact ? '0.9em' : '1.1em' }}>{elementCfg.emoji}</span>
          <span style={{ fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
            fontSize: compact ? '0.5em' : '0.65em', color: elementCfg.color }}>
            {elementCfg.label} TYPE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: compact ? '0.4em' : '0.55em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>HP</span>
          <span style={{ fontWeight: 900, fontSize: compact ? '0.65em' : '0.9em', color: tierCfg.color }}>{hp}</span>
        </div>
      </div>

      {/* Image */}
      <div
        className={cfg.isRare ? 'rare-shimmer' : ''}
        style={{
          margin: compact ? '4px' : '8px', borderRadius: compact ? 6 : 10,
          overflow: 'hidden', aspectRatio: '1', border: cfg.imageBorder, background: '#000',
          boxShadow: cfg.isEpic ? 'inset 0 0 20px rgba(168,85,247,0.3)'
                   : cfg.isRainbow ? 'inset 0 0 30px rgba(251,191,36,0.2)' : 'none',
          position: 'relative',
        }}
      >
        {!imgLoaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: '#0a0a14' }}>
            <motion.span
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ fontSize: compact ? '1.5em' : '2em' }}
            >
              {elementCfg.emoji}
            </motion.span>
          </div>
        )}
        <img
          src={proxyUrl} alt="JokeMon" onLoad={() => setImgLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
        />
        {cfg.isEpic && (
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(circle at 50% 110%, rgba(168,85,247,0.25) 0%, transparent 60%)' }}
          />
        )}
        {cfg.isRainbow && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle at 50% 80%, rgba(251,191,36,0.15) 0%, transparent 65%)' }} />
        )}
      </div>

      {/* Badge */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: compact ? '4px 0' : '8px 0' }}>
        <motion.div
          animate={cfg.isEpic   ? { boxShadow: ['0 0 8px rgba(168,85,247,0.4)', '0 0 18px rgba(168,85,247,0.8)', '0 0 8px rgba(168,85,247,0.4)'] }
                 : cfg.isRainbow ? { boxShadow: ['0 0 10px rgba(251,191,36,0.5)', '0 0 22px rgba(251,191,36,0.9)', '0 0 10px rgba(251,191,36,0.5)'] }
                 : {}}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: compact ? 3 : 5,
            padding: compact ? '2px 8px' : '4px 14px', borderRadius: 999,
            background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}`,
            color: cfg.badgeColor, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.08em', fontSize: compact ? '0.5em' : '0.65em',
          }}
        >
          <span>{tierCfg.emoji}</span>
          <span>{tierCfg.rarity}</span>
          <span>{'★'.repeat(tierCfg.stars)}</span>
        </motion.div>
      </div>

      {/* Stats */}
      {!compact && (
        <div style={{ padding: '4px 12px 10px' }}>
          {[['ATK', atk], ['DEF', def], ['SPD', spd]].map(([label, val]) => (
            <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: '0.55em', fontWeight: 700, color: 'rgba(255,255,255,0.3)', width: 24, flexShrink: 0 }}>
                {label}
              </span>
              <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((val as number) / maxStat) * 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 999,
                    background: `linear-gradient(90deg, ${cfg.statColor}77, ${cfg.statColor})` }}
                />
              </div>
              <span style={{ fontSize: '0.6em', fontWeight: 700, color: cfg.statColor, width: 22, textAlign: 'right' }}>
                {val}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: compact ? '3px 8px' : '6px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: compact ? '0.4em' : '0.5em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          PokePet Lab
        </span>
        <span style={{ fontSize: compact ? '0.4em' : '0.5em', color: 'rgba(255,255,255,0.18)' }}>
          No. {String(cardNumber).padStart(3, '0')}
        </span>
      </div>
    </div>
  )

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.06, y: -4 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        style={{ display: 'inline-block' }}
      >
        {inner}
      </motion.div>
    )
  }

  // Full card gets tilt effect
  const fullCard = (
    <div style={{ position: 'relative', display: 'inline-block', borderRadius: cfg.outerRadius }}>
      {showSparkles && SPARKLE_POS.map((s, i) => (
        <span key={i} className="sparkle"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size,
            '--dur': `${s.dur}s`, '--delay': `${s.delay}s` } as React.CSSProperties}>
          ✦
        </span>
      ))}
      {cfg.isRainbow ? (
        <motion.div
          className="legendary-glow-pulse"
          style={{ position: 'relative', display: 'inline-block', borderRadius: cfg.outerRadius }}
        >
          <div className="legendary-rainbow-border"
            style={{ padding: 3, borderRadius: cfg.outerRadius, display: 'inline-block' }}>
            {inner}
          </div>
        </motion.div>
      ) : (
        <div className={cfg.isEpic ? 'epic-glow-pulse' : ''} style={{ display: 'inline-block' }}>
          {inner}
        </div>
      )}
    </div>
  )

  return <TiltCard>{fullCard}</TiltCard>
}

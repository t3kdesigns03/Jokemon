'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ELEMENTS, TIERS, getSpeciesName } from '@/lib/evolution'
import type { CollectionCard } from '@/lib/collection'
import type { EvolutionTier } from '@/lib/evolution'

interface JokeMonCardProps {
  card: CollectionCard
  compact?: boolean
  onClick?: () => void
  /** If true, enables drag-to-rotate (holo reacts to rotation). Disabled in compact/collection grid. */
  interactive?: boolean
}

// ─── Rotation context ─────────────────────────────────────────────────────────
// DragRotateCard provides {rx, ry} (current rotation in degrees).
// IllustrationOverlay consumes it so the holo overlays react to card tilt
// without any prop-drilling through the card's JSX tree.
const CardRotCtx = createContext<{ rx: number; ry: number }>({ rx: 0, ry: 0 })

// ─── Per-rarity config ────────────────────────────────────────────────────────
const RARITY_CFG = {
  starter: {
    outerBorder: '2px solid #374151', outerGlow: 'none', outerRadius: '0.875rem',
    innerBg: 'linear-gradient(160deg, #111827 0%, #1f2937 100%)',
    headerBg: 'rgba(55,65,81,0.4)', imageBorder: '1px solid #374151',
    badgeBg: '#1f2937', badgeBorder: '#4b5563', badgeColor: '#9ca3af', statColor: '#6b7280',
    isRainbow: false, isEpic: false, isRare: false, showSparkles: false, holoStrength: 0,
    // No filter for common cards
    imageFilter: 'none',
  },
  evolved: {
    outerBorder: '2px solid #94a3b8', outerGlow: '0 0 14px rgba(148,163,184,0.3)', outerRadius: '0.875rem',
    innerBg: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f1a2e 100%)',
    headerBg: 'rgba(148,163,184,0.08)', imageBorder: '1px solid rgba(148,163,184,0.5)',
    badgeBg: 'linear-gradient(135deg,#1e293b,#334155)', badgeBorder: '#94a3b8', badgeColor: '#e2e8f0',
    statColor: '#94a3b8', isRainbow: false, isEpic: false, isRare: true, showSparkles: false, holoStrength: 0.3,
    // Rare: subtle contrast + saturation boost — artwork pops more
    imageFilter: 'contrast(1.08) saturate(1.25)',
  },
  champion: {
    outerBorder: '3px solid #a855f7', outerGlow: '0 0 25px rgba(168,85,247,0.65), 0 0 60px rgba(168,85,247,0.25)',
    outerRadius: '0.875rem',
    innerBg: 'linear-gradient(160deg, #0d0618 0%, #1a0533 50%, #0d0618 100%)',
    headerBg: 'rgba(168,85,247,0.18)', imageBorder: '2px solid rgba(168,85,247,0.6)',
    badgeBg: 'linear-gradient(135deg,#4c1d95,#7c3aed)', badgeBorder: '#c084fc', badgeColor: '#f3e8ff',
    statColor: '#c084fc', isRainbow: false, isEpic: true, isRare: false, showSparkles: false, holoStrength: 0.7,
    // Epic: stronger contrast + vibrance + slight brightness lift
    imageFilter: 'contrast(1.13) saturate(1.5) brightness(1.04)',
  },
  legendary: {
    outerBorder: 'none', outerGlow: 'none', outerRadius: '1rem',
    innerBg: 'linear-gradient(160deg, #1a0a00 0%, #2d1400 40%, #1a0500 100%)',
    headerBg: 'rgba(251,191,36,0.18)', imageBorder: '2px solid rgba(251,191,36,0.7)',
    badgeBg: 'linear-gradient(135deg,#92400e,#d97706,#fbbf24)', badgeBorder: '#fbbf24', badgeColor: '#000',
    statColor: '#fbbf24', isRainbow: true, isEpic: false, isRare: false, showSparkles: true, holoStrength: 1,
    // Legendary: max enhancement — strong contrast, saturated, slightly brighter
    imageFilter: 'contrast(1.18) saturate(1.7) brightness(1.07)',
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

// ─── IllustrationOverlay ──────────────────────────────────────────────────────
// Six layered effects stacked over the illustration for Rare+ cards.
// Reads rotation from CardRotCtx — when the card is tilted, the rainbow
// gradient shifts angle and the specular spot moves, exactly like a real TCG foil.
//
// Tuning guide:
//   foilBase    — minimum foil opacity at rest (increase to always show rainbow)
//   rotBoost    — how much extra opacity to add when fully tilted (increase for drama)
//   rainbowStrength — multiplier on the RGBA alpha per tier (0–1)
//   shineX/Y multiplier — how far the specular spot tracks the tilt (increase = more parallax)
function IllustrationOverlay({ tier }: { tier: EvolutionTier }) {
  const { rx, ry } = useContext(CardRotCtx)
  if (tier === 'starter') return null

  // Normalized rotation magnitude: 0 = face-on, 1 = max tilt (~45°)
  const rotMag = Math.min(1, Math.sqrt(rx * rx + ry * ry) / 45)

  // Rainbow gradient angle shifts with horizontal tilt — tilting right rotates the spectrum
  const holoAngle = 130 + ry * 3.5 + rx * 1.5

  // Specular spot position follows rotation — mimics light bouncing off real foil
  // Adjust multiplier (1.8) to control how far the spot tracks
  const shineX = 50 + ry * 1.8
  const shineY = 50 - rx * 1.8

  // Per-tier base opacity and rainbow intensity — keep subtle at rest, vivid when tilted
  const foilBase       = { evolved: 0.03, champion: 0.08, legendary: 0.14 }[tier] ?? 0
  const rotBoost       = rotMag * 0.48  // additional opacity when tilted
  const foilOp         = Math.min(0.65, foilBase + rotBoost)
  const rainbowStr     = { evolved: 0.18, champion: 0.38, legendary: 0.62 }[tier] ?? 0

  return (
    <>
      {/* ── Layer 1: Holographic dot-grid texture ─────────────────────────── */}
      {/* Classic TCG reverse-holo: a fine grid of dots/lines visible through the art.    */}
      {/* Evolved = subtle silver dots, Epic = purple grid, Legendary = gold grid + shift  */}
      <div
        className={
          tier === 'legendary' ? 'holo-grid-legendary'
          : tier === 'champion' ? 'holo-grid-epic'
          : 'holo-grid-evolved'
        }
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          // Ramps 0.3→0.85 as the card tilts — at rest it's barely there,
          // full tilt makes the grid vivid like real foil catching light
          opacity: 0.3 + rotMag * 0.55,
          borderRadius: 'inherit',
        }}
      />

      {/* ── Layer 2: Rotation-reactive rainbow foil (color-dodge) ────────── */}
      {/* THE signature effect: tilt the card to see rainbow colors sweep across.  */}
      {/* Angle updates every frame via CardRotCtx so it feels physically real.    */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
        background: `
          radial-gradient(ellipse 70% 60% at ${shineX}% ${shineY}%,
            rgba(255,255,255,${0.42 * rainbowStr}) 0%, transparent 60%),
          linear-gradient(${holoAngle}deg,
            rgba(255,0,128,${0.88 * rainbowStr}) 0%,
            rgba(255,100,0,${0.88 * rainbowStr}) 14%,
            rgba(255,220,0,${0.88 * rainbowStr}) 28%,
            rgba(0,255,128,${0.88 * rainbowStr}) 42%,
            rgba(0,100,255,${0.88 * rainbowStr}) 57%,
            rgba(128,0,255,${0.88 * rainbowStr}) 71%,
            rgba(255,0,200,${0.88 * rainbowStr}) 85%,
            rgba(255,0,128,${0.88 * rainbowStr}) 100%
          )
        `,
        opacity: foilOp,
        mixBlendMode: 'color-dodge',
      }} />

      {/* ── Layer 3: Specular shine spot (screen blend) ───────────────────── */}
      {/* Bright highlight that tracks the tilt — like the white glint on a foil card. */}
      {/* Only on Epic+ (evolved gets enough from layers 1–2).                          */}
      {(tier === 'champion' || tier === 'legendary') && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
          background: `radial-gradient(circle at ${shineX}% ${shineY}%,
            rgba(255,255,255,${0.35 + rotMag * 0.25}) 0%, transparent 26%)`,
          // Only visible when tilted — fades to 0 when face-on
          opacity: rotMag * (tier === 'legendary' ? 0.65 : 0.5),
          mixBlendMode: 'screen',
        }} />
      )}

      {/* ── Layer 4: Animated diagonal light sweep ────────────────────────── */}
      {/* A bright beam that continuously crosses the illustration.               */}
      {/* Epic: purple-tinted, 3.5s cycle. Legendary: gold-tinted, 2.2s cycle.   */}
      {(tier === 'champion' || tier === 'legendary') && (
        <div
          className={tier === 'legendary' ? 'legendary-light-sweep' : 'epic-light-sweep'}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit' }}
        />
      )}

      {/* ── Layer 5: Legendary — gold energy frame (inset glow) ──────────── */}
      {/* An inner glow at the edges of the illustration, scales with rotation.  */}
      {/* Adjust the RGBA alpha values to control glow intensity at rest/tilted.  */}
      {tier === 'legendary' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
          boxShadow: [
            `inset 0 0 22px rgba(251,191,36,${0.10 + rotMag * 0.40})`,
            `inset 0 0 55px rgba(249,115,22,${0.06 + rotMag * 0.22})`,
            `inset 0 0 90px rgba(168,85,247,${0.04 + rotMag * 0.12})`,
          ].join(', '),
        }} />
      )}

      {/* ── Layer 6: removed — flicker reserved for special illustration reveals only ── */}
    </>
  )
}

// ─── DragRotateCard ───────────────────────────────────────────────────────────
// Wraps the card in a pointer-event-driven 3D rotation.
// Provides CardRotCtx so IllustrationOverlay can access current rotation.
// Also renders a full-card holo overlay (lighter than the image-specific one).

interface DragRotateProps {
  children: React.ReactNode
  holoStrength: number
  isRainbow: boolean
  isEpic: boolean
}

function DragRotateCard({ children, holoStrength, isRainbow, isEpic }: DragRotateProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [rot, setRot] = useState({ x: 0, y: 0 })
  const [isDown, setIsDown] = useState(false)
  const last = useRef({ x: 0, y: 0 })
  const animFrame = useRef<number | null>(null)
  const targetRot = useRef({ x: 0, y: 0 })
  const currentRot = useRef({ x: 0, y: 0 })

  // Smooth lerp loop — runs every frame, eases toward targetRot
  useEffect(() => {
    const loop = () => {
      const lerp = isDown ? 0.25 : 0.08
      currentRot.current.x += (targetRot.current.x - currentRot.current.x) * lerp
      currentRot.current.y += (targetRot.current.y - currentRot.current.y) * lerp
      setRot({ x: currentRot.current.x, y: currentRot.current.y })
      animFrame.current = requestAnimationFrame(loop)
    }
    animFrame.current = requestAnimationFrame(loop)
    return () => { if (animFrame.current) cancelAnimationFrame(animFrame.current) }
  }, [isDown])

  const getPos = (e: React.PointerEvent) => ({ x: e.clientX, y: e.clientY })

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDown(true)
    last.current = getPos(e)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDown) return
    const pos = getPos(e)
    const dx = pos.x - last.current.x
    const dy = pos.y - last.current.y
    targetRot.current = {
      x: Math.max(-35, Math.min(35, targetRot.current.x - dy * 0.6)),
      y: Math.max(-45, Math.min(45, targetRot.current.y + dx * 0.6)),
    }
    last.current = pos
  }

  const onPointerUp = () => {
    setIsDown(false)
    targetRot.current = { x: 0, y: 0 }
  }

  // Full-card holo — lighter version, sits over the entire card (text + borders + image)
  // The image-specific IllustrationOverlay is the primary effect; this adds global iridescence
  const holoAngle   = 135 + rot.y * 1.5 + rot.x * 0.5
  const holoOpacity = holoStrength * (0.10 + Math.abs(rot.y) / 45 * 0.20 + Math.abs(rot.x) / 35 * 0.10)
  const shineX      = 50 + rot.y * 0.8
  const shineY      = 50 - rot.x * 0.8

  return (
    <CardRotCtx.Provider value={{ rx: rot.x, ry: rot.y }}>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{
          display: 'inline-block',
          cursor: isDown ? 'grabbing' : 'grab',
          transformStyle: 'preserve-3d',
          transform: `perspective(900px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          transition: isDown ? 'none' : 'transform 0.1s ease-out',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
          position: 'relative',
        }}
      >
        {children}

        {/* Full-card rainbow foil — covers text/borders too, subtler than image layer */}
        {holoStrength > 0 && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '0.875rem',
            pointerEvents: 'none', zIndex: 10,
            opacity: holoOpacity,
            background: `
              radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.22) 0%, transparent 55%),
              linear-gradient(${holoAngle}deg,
                rgba(255,0,128,0.4) 0%, rgba(255,165,0,0.4) 16%, rgba(255,255,0,0.4) 33%,
                rgba(0,255,128,0.4) 50%, rgba(0,128,255,0.4) 66%, rgba(128,0,255,0.4) 83%,
                rgba(255,0,128,0.4) 100%)
            `,
            mixBlendMode: 'color-dodge',
          }} />
        )}

        {/* Full-card specular shine spot */}
        {holoStrength > 0.5 && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '0.875rem',
            pointerEvents: 'none', zIndex: 11,
            opacity: Math.max(0, holoStrength * 0.3 * (Math.abs(rot.y) / 45 + Math.abs(rot.x) / 35)),
            background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.9) 0%, transparent 26%)`,
            mixBlendMode: 'screen',
          }} />
        )}
      </div>
    </CardRotCtx.Provider>
  )
}

// ─── Card content ─────────────────────────────────────────────────────────────

export default function JokeMonCard({ card, compact = false, onClick, interactive = false }: JokeMonCardProps) {
  const { tier, element, petName, joKemonImageUrl, hp, atk, def, spd, cardNumber } = card
  const cfg        = RARITY_CFG[tier]
  const tierCfg    = TIERS[tier]
  const elementCfg = ELEMENTS[element]
  const [imgLoaded, setImgLoaded]     = useState(false)
  const [showSparkles, setShowSparkles] = useState(false)
  const proxyUrl   = `/api/proxy-image?url=${encodeURIComponent(joKemonImageUrl)}`
  const cardWidth  = compact ? 160 : 'min(320px, calc(100vw - 40px))'
  const maxStat    = tier === 'legendary' ? 200 : tier === 'champion' ? 130 : tier === 'evolved' ? 90 : 60
  const displayName = (petName || 'Fluffy').toUpperCase()
  const species     = getSpeciesName(element, tier)
  const showSpecies = !compact && (tier === 'evolved' || tier === 'champion' || tier === 'legendary')

  useEffect(() => { if (cfg.showSparkles) setShowSparkles(true) }, [cfg.showSparkles])

  const inner = (
    <div
      style={{
        borderRadius: cfg.outerRadius, overflow: 'hidden',
        background: cfg.innerBg, width: cardWidth,
        cursor: onClick ? 'pointer' : interactive ? 'grab' : 'default',
        userSelect: 'none',
        ...(cfg.isRainbow ? {} : { border: cfg.outerBorder, boxShadow: cfg.outerGlow }),
      }}
      onClick={onClick}
    >
      {/* ── Header ── */}
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

      {/* ── Pet name + species ── */}
      {!compact && (
        <div style={{ textAlign: 'center', padding: '6px 14px 2px' }}>
          <div style={{
            fontSize: '1.1em', fontWeight: 900, letterSpacing: '0.08em',
            color: cfg.isRainbow ? '#fbbf24' : cfg.isEpic ? '#c084fc' : 'rgba(255,255,255,0.85)',
            textShadow: cfg.isRainbow
              ? '0 0 12px rgba(251,191,36,0.8)'
              : cfg.isEpic ? '0 0 10px rgba(168,85,247,0.6)' : 'none',
          }}>
            {displayName}
          </div>
          {showSpecies && (
            <div style={{
              fontSize: '0.52em', fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginTop: 1,
              color: cfg.isRainbow
                ? 'rgba(251,191,36,0.65)'
                : cfg.isEpic
                ? 'rgba(192,132,252,0.65)'
                : 'rgba(148,163,184,0.55)',
            }}>
              the {species}
            </div>
          )}
        </div>
      )}

      {/* ── Illustration ── */}
      <div
        className={cfg.isRare ? 'rare-shimmer' : ''}
        style={{
          margin: compact ? '4px' : '6px 8px 8px',
          borderRadius: compact ? 6 : 10,
          overflow: 'hidden', aspectRatio: '1',
          border: cfg.imageBorder, background: '#000',
          boxShadow: cfg.isEpic    ? 'inset 0 0 22px rgba(168,85,247,0.32)'
                   : cfg.isRainbow ? 'inset 0 0 32px rgba(251,191,36,0.22)' : 'none',
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
          src={proxyUrl} alt={displayName}
          onLoad={() => setImgLoaded(true)}
          onError={e => {
            // Image failed — show element emoji as fallback so card isn't a black box
            const el = e.currentTarget.parentElement
            if (el) el.style.background = '#0a0a14'
            e.currentTarget.style.display = 'none'
            setImgLoaded(true)
          }}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.4s ease',
            filter: imgLoaded ? cfg.imageFilter : 'none',
          }}
        />

        {cfg.isEpic && (
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(circle at 50% 110%, rgba(168,85,247,0.28) 0%, transparent 60%)' }}
          />
        )}
        {cfg.isRainbow && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(circle at 50% 80%, rgba(251,191,36,0.18) 0%, transparent 65%)' }} />
        )}

        {!compact && <IllustrationOverlay tier={tier} />}
      </div>

      {/* ── Rarity badge ── */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: compact ? '4px 0' : '8px 0' }}>
        <motion.div
          animate={
            cfg.isEpic    ? { boxShadow: ['0 0 8px rgba(168,85,247,0.4)',  '0 0 18px rgba(168,85,247,0.8)',  '0 0 8px rgba(168,85,247,0.4)']  }
          : cfg.isRainbow ? { boxShadow: ['0 0 10px rgba(251,191,36,0.5)', '0 0 22px rgba(251,191,36,0.9)', '0 0 10px rgba(251,191,36,0.5)'] }
          : {}
          }
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

      {/* ── Stats ── */}
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

      {/* ── Footer ── */}
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

  const cardWithSparkles = (
    <div style={{ position: 'relative', display: 'inline-block', borderRadius: cfg.outerRadius }}>
      {showSparkles && SPARKLE_POS.map((s, i) => (
        <span key={i} className="sparkle"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size,
            '--dur': `${s.dur}s`, '--delay': `${s.delay}s` } as React.CSSProperties}>
          ✦
        </span>
      ))}
      {cfg.isRainbow ? (
        <motion.div className="legendary-glow-pulse"
          style={{ position: 'relative', display: 'inline-block', borderRadius: cfg.outerRadius }}>
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

  if (interactive) {
    return (
      <DragRotateCard
        holoStrength={cfg.holoStrength}
        isRainbow={cfg.isRainbow}
        isEpic={cfg.isEpic}
      >
        {cardWithSparkles}
      </DragRotateCard>
    )
  }

  return cardWithSparkles
}

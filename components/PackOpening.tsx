'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ELEMENTS, TIERS, type Element, type EvolutionTier } from '@/lib/evolution'
import type { CollectionCard } from '@/lib/collection'
import JokeMonCard from './JokeMonCard'

// ─── Types ────────────────────────────────────────────────────────────────────

type PackPhase = 'entering' | 'idle' | 'ripping' | 'suspense' | 'flipping' | 'revealed'

interface Props {
  element: Element
  petName: string
  cardPromise: Promise<CollectionCard>
  onComplete: (card: CollectionCard) => void
  onError: (msg: string) => void
}

interface Particle {
  id: number; x: number; y: number
  vx: number; vy: number
  color: string; size: number; dur: number
}

// ─── Per-rarity reveal drama ──────────────────────────────────────────────────

const FLIP_CFG: Record<EvolutionTier, {
  suspenseMs: number; preFlipMs: number; flipDur: number
  preText: string | null; shake: number
}> = {
  starter:   { suspenseMs: 300,  preFlipMs: 0,   flipDur: 0.35, preText: null,                    shake: 0 },
  evolved:   { suspenseMs: 650,  preFlipMs: 150, flipDur: 0.45, preText: null,                    shake: 0 },
  champion:  { suspenseMs: 1100, preFlipMs: 400, flipDur: 0.65, preText: '💜 EPIC PULL!',         shake: 5 },
  legendary: { suspenseMs: 2200, preFlipMs: 900, flipDur: 1.10, preText: '👑 LEGENDARY DETECTED', shake: 9 },
}

// ─── Element theme ────────────────────────────────────────────────────────────

const THEME = {
  fire:  {
    bg: 'radial-gradient(ellipse at 42% 32%, #7c1a00 0%, #3d0900 55%, #080201 100%)',
    border: '#f97316', glow: 'rgba(249,115,22,0.65)', accent: '#fb923c',
    particles: ['#f97316', '#ef4444', '#fbbf24', '#fde68a', '#ff6b35'],
  },
  water: {
    bg: 'radial-gradient(ellipse at 42% 32%, #003b6e 0%, #001535 55%, #000710 100%)',
    border: '#0ea5e9', glow: 'rgba(14,165,233,0.65)', accent: '#38bdf8',
    particles: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#00c8ff'],
  },
  wind:  {
    bg: 'radial-gradient(ellipse at 42% 32%, #003320 0%, #001510 55%, #000704 100%)',
    border: '#22c55e', glow: 'rgba(34,197,94,0.65)', accent: '#4ade80',
    particles: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#00ff88'],
  },
} as const

const PACK_W = 280
const PACK_H = 392

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

function burst(theme: typeof THEME.fire, count = 36): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6
    const speed = 80 + Math.random() * 220
    return {
      id: i, x: 0, y: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 90,
      color: theme.particles[i % theme.particles.length],
      size: 4 + Math.random() * 9,
      dur: 0.55 + Math.random() * 0.5,
    }
  })
}

// ─── Pack Pattern (element-specific) ─────────────────────────────────────────

function PackPattern({ element }: { element: Element }) {
  const t = THEME[element]
  if (element === 'fire') return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.13, zIndex: 1 }}>
      {[...Array(9)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${4 + i * 11}%`, bottom: 0,
          width: 3, height: `${35 + (i % 3) * 20}%`,
          background: `linear-gradient(to top, ${t.accent}, transparent)`,
          transform: `skewX(${-18 + i * 4}deg)`,
        }} />
      ))}
    </div>
  )
  if (element === 'water') return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.11, zIndex: 1 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%,-50%)',
          width: `${45 + i * 30}%`, height: `${45 + i * 30}%`,
          borderRadius: '50%', border: `1px solid ${t.accent}`,
        }} />
      ))}
    </div>
  )
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.12, zIndex: 1 }}>
      {[...Array(7)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${-10 + i * 18}%`, top: `${-5 + i * 12}%`,
          width: '110%', height: 1,
          background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)`,
          transform: `rotate(${-8 + i * 4}deg)`,
        }} />
      ))}
    </div>
  )
}

// ─── Pack face visual ─────────────────────────────────────────────────────────

function PackFace({ element, shimmer = false }: { element: Element; shimmer?: boolean }) {
  const el = ELEMENTS[element]
  const t  = THEME[element]

  return (
    <div style={{
      width: PACK_W, height: PACK_H, borderRadius: 16, overflow: 'hidden',
      background: t.bg, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <PackPattern element={element} />

      {/* Shimmer sweep on idle */}
      {shimmer && (
        <motion.div
          animate={{ x: [-PACK_W, PACK_W * 1.6] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.8 }}
          style={{
            position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
            background: 'linear-gradient(108deg, transparent 28%, rgba(255,255,255,0.1) 50%, transparent 72%)',
          }}
        />
      )}

      {/* Top bar */}
      <div style={{
        width: '100%', padding: '14px 16px 10px', zIndex: 2, textAlign: 'center',
        background: 'rgba(0,0,0,0.45)', borderBottom: `1px solid ${t.border}44`,
      }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.26em', textTransform: 'uppercase', color: t.accent }}>
          ✦ POKE-PET ✦
        </div>
      </div>

      {/* Center art */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 2 }}>
        <motion.div
          animate={{
            scale: [1, 1.09, 1],
            filter: [`drop-shadow(0 0 14px ${t.glow})`, `drop-shadow(0 0 36px ${t.glow})`, `drop-shadow(0 0 14px ${t.glow})`],
          }}
          transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 82 }}
        >
          {el.emoji}
        </motion.div>
        <div style={{ fontWeight: 900, fontSize: 21, color: 'white', textAlign: 'center', lineHeight: 1.2,
          textShadow: `0 0 22px ${t.glow}` }}>
          EVOLUTION<br />PACK
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.accent }}>
          {el.label} TYPE
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        width: '100%', padding: '12px 16px 14px', zIndex: 2, textAlign: 'center',
        background: 'rgba(0,0,0,0.5)', borderTop: `1px solid ${t.border}44`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 6 }}>
          {[...Array(5)].map((_, i) => (
            <motion.div key={i}
              animate={{ opacity: [0.2, 0.85, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.18 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent }}
            />
          ))}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em' }}>
          CONTAINS 1 CARD
        </div>
      </div>

      {/* Inner glow */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none', zIndex: 1,
        boxShadow: `inset 0 0 48px ${t.glow}28` }} />
    </div>
  )
}

// ─── Card back face ───────────────────────────────────────────────────────────

function CardBack({ element, tier, forming }: { element: Element; tier?: EvolutionTier; forming?: boolean }) {
  const t   = THEME[element]
  const tc  = tier ? TIERS[tier] : null

  return (
    <div style={{
      width: 'min(320px, calc(100vw - 40px))',
      aspectRatio: '5 / 7',
      borderRadius: 14,
      background: t.bg,
      border: `2px solid ${tc ? tc.color + '88' : t.border + '55'}`,
      boxShadow: `0 0 ${tc ? '32px' : '16px'} ${tc ? tc.glowColor : t.glow}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 18, position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${t.accent}10 1px, transparent 1px),linear-gradient(90deg,${t.accent}10 1px,transparent 1px)`,
        backgroundSize: '28px 28px',
      }} />

      {/* Rarity radial glow (once known) */}
      {tc && tier !== 'starter' && (
        <motion.div
          animate={{ opacity: [0.25, 0.75, 0.25] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          style={{ position: 'absolute', inset: 0, borderRadius: 14,
            background: `radial-gradient(circle at 50% 50%, ${tc.glowColor} 0%, transparent 65%)` }}
        />
      )}

      {/* Egg */}
      <motion.div
        animate={{ scale: [1, 1.07, 1], opacity: [0.5, 0.95, 0.5] }}
        transition={{ duration: 1.9, repeat: Infinity }}
        style={{ fontSize: 58, zIndex: 1 }}
      >
        🥚
      </motion.div>

      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase',
        color: t.accent + 'cc', zIndex: 1 }}>
        POKE-PET
      </div>

      {/* Forming indicator */}
      {forming && (
        <motion.div
          animate={{ opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 1.3, repeat: Infinity }}
          style={{ position: 'absolute', bottom: 20, fontSize: 10, color: t.accent, letterSpacing: '0.1em', zIndex: 2 }}
        >
          YOUR JOKÉMON IS FORMING…
        </motion.div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PackOpening({ element, petName, cardPromise, onComplete, onError }: Props) {
  const [phase, setPhase]           = useState<PackPhase>('entering')
  const [card, setCard]             = useState<CollectionCard | null>(null)
  const [genDone, setGenDone]       = useState(false)
  const [isFlipped, setIsFlipped]   = useState(false)
  const [particles, setParticles]   = useState<Particle[]>([])
  const [preText, setPreText]       = useState<string | null>(null)
  const [shaking, setShaking]       = useState(false)
  const cardRef = useRef<CollectionCard | null>(null)
  const confRef = useRef<(() => void) | null>(null)

  // Confetti loader
  useEffect(() => {
    import('canvas-confetti').then(m => {
      const fire = m.default
      confRef.current = () => {
        const opts = { particleCount: 180, spread: 90, origin: { y: 0.55 },
          colors: ['#fbbf24','#a855f7','#38bdf8','#f472b6','#34d399'] }
        fire({ ...opts, angle: 60,  origin: { x: 0,   y: 0.6 } })
        fire({ ...opts, angle: 120, origin: { x: 1,   y: 0.6 } })
        setTimeout(() => fire({ ...opts, particleCount: 90, spread: 120, origin: { y: 0.4 } }), 400)
      }
    })
  }, [])

  // Resolve generation promise
  useEffect(() => {
    cardPromise.then(c => {
      cardRef.current = c
      setCard(c)
      setGenDone(true)
    }).catch(err => {
      onError(err instanceof Error ? err.message : 'Evolution failed')
    })
  }, [cardPromise, onError])

  // Pack entrance → idle
  useEffect(() => {
    const t = setTimeout(() => setPhase('idle'), 750)
    return () => clearTimeout(t)
  }, [])

  // ── Rip handler ──────────────────────────────────────────────────────────────
  const handleRip = () => {
    if (phase !== 'idle') return
    setPhase('ripping')
    setParticles(burst(THEME[element]))

    // ripping (600ms) → suspense → reveal chain
    setTimeout(() => setPhase('suspense'), 620)
    setTimeout(doReveal, 620)
  }

  // ── Reveal choreography ───────────────────────────────────────────────────────
  async function doReveal() {
    // Wait for generation
    await new Promise<void>(resolve => {
      if (cardRef.current) { resolve(); return }
      const iv = setInterval(() => { if (cardRef.current) { clearInterval(iv); resolve() } }, 80)
    })

    const c   = cardRef.current!
    const cfg = FLIP_CFG[c.tier]

    // Suspense hold — minimum drama wait
    await sleep(cfg.suspenseMs)

    // Pre-flip text
    if (cfg.preText) {
      setPreText(cfg.preText)
      await sleep(cfg.preFlipMs)
    }

    // Screen shake + legendary pre-flip confetti
    if (cfg.shake > 0) {
      setShaking(true)
      setTimeout(() => setShaking(false), 650)
    }
    if (c.tier === 'legendary') confRef.current?.()

    // Flip!
    setPhase('flipping')
    setIsFlipped(true)

    // After flip + epic reveal confetti
    await sleep(cfg.flipDur * 1000 + 300)
    if (c.tier === 'champion') confRef.current?.()

    setPhase('revealed')
  }

  const theme = THEME[element]
  const flipDur = card ? FLIP_CFG[card.tier].flipDur : 0.4

  return (
    <motion.div
      animate={shaking ? {
        x: [-7, 7, -5, 5, -3, 3, -1, 1, 0],
        y: [-4, 4, -3, 3, -2, 2, 0],
      } : { x: 0, y: 0 }}
      transition={{ duration: 0.55 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '16px 0' }}
    >
      {/* Header label */}
      <motion.p
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.16em',
          textTransform: 'uppercase', margin: 0 }}
      >
        {phase === 'revealed' ? 'Evolution Complete!' : `${petName ? petName.toUpperCase() + "'S " : ''}EVOLUTION PACK`}
      </motion.p>

      {/* ── Main stage ── */}
      <div style={{ position: 'relative', width: PACK_W, minHeight: PACK_H,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* ── Pack (entering / idle) ── */}
        <AnimatePresence>
          {(phase === 'entering' || phase === 'idle') && (
            <motion.div key="pack"
              initial={{ scale: 0.68, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.12, opacity: 0, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{ position: 'absolute', filter: `drop-shadow(0 4px 28px ${theme.glow})` }}
            >
              <PackFace element={element} shimmer={phase === 'idle'} />
              {/* Animated border */}
              <motion.div
                animate={{ boxShadow: [`0 0 18px ${theme.glow}`, `0 0 48px ${theme.glow}`, `0 0 18px ${theme.glow}`] }}
                transition={{ duration: 1.9, repeat: Infinity }}
                style={{ position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
                  border: `2px solid ${theme.border}` }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Rip: two halves fly apart ── */}
        <AnimatePresence>
          {phase === 'ripping' && (
            <>
              <motion.div key="left"
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{ x: -210, y: -190, rotate: -38, opacity: 0 }}
                transition={{ duration: 0.58, ease: [0.15, 0, 0.85, 1] }}
                style={{ position: 'absolute',
                  clipPath: 'polygon(0 0, 51% 0, 49% 100%, 0 100%)',
                  filter: `drop-shadow(0 0 18px ${theme.glow})` }}
              >
                <PackFace element={element} />
              </motion.div>

              <motion.div key="right"
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{ x: 210, y: -190, rotate: 38, opacity: 0 }}
                transition={{ duration: 0.58, ease: [0.15, 0, 0.85, 1] }}
                style={{ position: 'absolute',
                  clipPath: 'polygon(49% 0, 100% 0, 100% 100%, 51% 100%)',
                  filter: `drop-shadow(0 0 18px ${theme.glow})` }}
              >
                <PackFace element={element} />
              </motion.div>

              {/* Flash burst */}
              <motion.div
                initial={{ opacity: 1, scale: 0.3 }}
                animate={{ opacity: 0, scale: 2.2 }}
                transition={{ duration: 0.45 }}
                style={{ position: 'absolute', inset: -50, borderRadius: '50%', zIndex: 10, pointerEvents: 'none',
                  background: `radial-gradient(circle, ${theme.accent}cc 0%, transparent 65%)` }}
              />
            </>
          )}
        </AnimatePresence>

        {/* ── Particles ── */}
        {particles.map(p => (
          <motion.div key={p.id}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: p.vx * 0.75, y: p.vy * 0.75, scale: 0, opacity: 0 }}
            transition={{ duration: p.dur, ease: 'easeOut' }}
            style={{ position: 'absolute', left: '50%', top: '50%',
              width: p.size, height: p.size, borderRadius: '50%',
              marginLeft: -p.size / 2, marginTop: -p.size / 2,
              background: p.color, pointerEvents: 'none', zIndex: 20 }}
          />
        ))}

        {/* ── Card (face-down → flip → face-up) ── */}
        <AnimatePresence>
          {(phase === 'suspense' || phase === 'flipping' || phase === 'revealed') && (
            <motion.div key="card"
              initial={{ y: 60, scale: 0.75, opacity: 0 }}
              animate={{ y: 0,  scale: 1,    opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{ position: 'relative' }}
            >
              {/* Pre-flip drama text */}
              <AnimatePresence>
                {preText && (
                  <motion.div
                    key="pretext"
                    initial={{ opacity: 0, y: -8, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: 'absolute', top: -52, left: 0, right: 0, textAlign: 'center', zIndex: 30 }}
                  >
                    <motion.span
                      animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 0.7, repeat: Infinity }}
                      style={{
                        fontSize: card?.tier === 'legendary' ? 20 : 17, fontWeight: 900,
                        color: card ? TIERS[card.tier].color : 'white',
                        textShadow: card ? `0 0 24px ${TIERS[card.tier].glowColor}` : 'none',
                      }}
                    >
                      {preText}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Flip container */}
              <div style={{ perspective: 1100 }}>
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: flipDur, ease: isFlipped ? [0.15, 0, 0, 1] : 'easeOut' }}
                  style={{ transformStyle: 'preserve-3d', position: 'relative' }}
                >
                  {/* Face DOWN */}
                  <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                    <CardBack
                      element={element}
                      tier={card?.tier}
                      forming={phase === 'suspense' && !genDone}
                    />
                  </div>

                  {/* Face UP */}
                  <div style={{
                    backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    position: 'absolute', top: 0, left: 0,
                  }}>
                    {card && (
                      <JokeMonCard card={card} interactive={phase === 'revealed'} />
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Suspense status hint ── */}
      <AnimatePresence>
        {phase === 'suspense' && !isFlipped && (
          <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {genDone && card ? (
              <motion.p
                animate={{ opacity: [0.45, 1, 0.45] }} transition={{ duration: 0.85, repeat: Infinity }}
                style={{ fontSize: 13, color: TIERS[card.tier].color, margin: 0, letterSpacing: '0.06em', textAlign: 'center' }}
              >
                {card.tier === 'legendary' ? '✨ Something incredible is forming…'
                 : card.tier === 'champion' ? '⚡ Powerful energy detected…'
                 : card.tier === 'evolved'  ? '💫 Evolution energy building…'
                 : '🥚 Hatching…'}
              </motion.p>
            ) : (
              <motion.p
                animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.3, repeat: Infinity }}
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', margin: 0, letterSpacing: '0.1em' }}
              >
                EVOLVING…
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RIP OPEN button ── */}
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.div key="ripbtn"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ delay: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
          >
            <motion.button
              onClick={handleRip}
              animate={{
                scale: [1, 1.035, 1],
                boxShadow: [`0 0 22px ${theme.glow}`, `0 0 55px ${theme.glow}`, `0 0 22px ${theme.glow}`],
              }}
              transition={{ duration: 1.7, repeat: Infinity }}
              whileHover={{ scale: 1.08, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.92 }}
              style={{
                padding: '18px 52px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${theme.border}, ${theme.accent})`,
                color: '#000', fontWeight: 900, fontSize: 18, letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              🎴 RIP OPEN PACK
            </motion.button>
            <motion.p
              animate={{ opacity: [0.3, 0.65, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, letterSpacing: '0.08em' }}
            >
              Tap to reveal your JokeMon
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Post-reveal: drag hint + continue button ── */}
      <AnimatePresence>
        {phase === 'revealed' && card && (
          <motion.div key="actions"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320, alignItems: 'center' }}
          >
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', margin: 0, letterSpacing: '0.08em' }}>
              ↕ Drag to rotate · holo shifts with angle
            </p>
            <motion.button
              onClick={() => onComplete(card)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${TIERS[card.tier].color}, ${TIERS[card.tier].color}cc)`,
                color: '#000', fontWeight: 900, fontSize: 15, letterSpacing: '0.05em',
              }}
            >
              ✓ Add to Collection →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

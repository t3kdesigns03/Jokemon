'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { ELEMENTS, TIERS, type Element, type EvolutionTier } from '@/lib/evolution'
import { addCard, addXP, generateStats, type CollectionCard } from '@/lib/collection'
import JokeMonCard from './JokeMonCard'

const Card3DViewer = dynamic(() => import('./Card3DViewer'), { ssr: false })

// ─── Constants ────────────────────────────────────────────────────────────────

const PACK_COUNT   = 10
const STAGGER_MS   = 700   // time between starting each generation request
const AUTO_NEXT_MS = 1600  // auto-advance after reveal completes

// ─── Types ────────────────────────────────────────────────────────────────────

type CardStatus = 'generating' | 'ready' | 'revealing' | 'revealed' | 'error'
type PackPhase  = 'pack' | 'ripping' | 'opening' | 'complete'

interface PackCard {
  index: number
  status: CardStatus
  card:   CollectionCard | null
  error:  string | null
}

interface Props {
  element:      Element
  petName:      string
  petFile:      File
  onAllComplete:(cards: CollectionCard[]) => void
}

// ─── Themes ───────────────────────────────────────────────────────────────────

const THEME = {
  fire:  { bg: 'radial-gradient(ellipse at 42% 32%,#7c1a00 0%,#3d0900 55%,#080201 100%)', border: '#f97316', glow: 'rgba(249,115,22,.65)', accent: '#fb923c', particles: ['#f97316','#ef4444','#fbbf24','#fde68a','#ff6b35'] },
  water: { bg: 'radial-gradient(ellipse at 42% 32%,#003b6e 0%,#001535 55%,#000710 100%)', border: '#0ea5e9', glow: 'rgba(14,165,233,.65)',  accent: '#38bdf8', particles: ['#0ea5e9','#38bdf8','#7dd3fc','#bae6fd','#00c8ff'] },
  wind:  { bg: 'radial-gradient(ellipse at 42% 32%,#003320 0%,#001510 55%,#000704 100%)', border: '#22c55e', glow: 'rgba(34,197,94,.65)',   accent: '#4ade80', particles: ['#22c55e','#4ade80','#86efac','#bbf7d0','#00ff88'] },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

function getRaritySummary(cards: PackCard[]) {
  const c: Record<EvolutionTier, number> = { starter: 0, evolved: 0, champion: 0, legendary: 0 }
  cards.forEach(p => { if (p.card) c[p.card.tier]++ })
  return [
    c.legendary && `${c.legendary}× 👑 Legendary`,
    c.champion  && `${c.champion}× ⚡ Epic`,
    c.evolved   && `${c.evolved}× 💫 Rare`,
    c.starter   && `${c.starter}× ✨ Common`,
  ].filter(Boolean).join('  ·  ')
}

function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim }
        else                { width = Math.round(width * maxDim / height); height = maxDim }
      }
      const c = document.createElement('canvas')
      c.width = width; c.height = height
      c.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(c.toDataURL('image/jpeg', quality).split(',')[1])
    }
    img.onerror = reject
    img.src = url
  })
}

// Fallback for mobile/HEIC: read file directly without canvas resize
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function getImageBase64(file: File, mobile: boolean): Promise<string> {
  try {
    return await compressImage(file, mobile ? 640 : 1024, mobile ? 0.7 : 0.82)
  } catch {
    // Canvas failed (common on iOS HEIC) — fall back to direct file read
    try {
      return await compressImage(file, 480, 0.65)
    } catch {
      return await readFileAsBase64(file)
    }
  }
}

// ─── Pack visual ──────────────────────────────────────────────────────────────

function PackFace({ element, shimmer }: { element: Element; shimmer?: boolean }) {
  const el = ELEMENTS[element]
  const t  = THEME[element]
  return (
    <div style={{
      width: 280, height: 392, borderRadius: 16, overflow: 'hidden',
      background: t.bg, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {shimmer && (
        <motion.div
          animate={{ x: [-280, 420] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
          style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
            background: 'linear-gradient(108deg, transparent 28%, rgba(255,255,255,.1) 50%, transparent 72%)' }}
        />
      )}
      <div style={{ width: '100%', padding: '14px 16px 10px', zIndex: 2, textAlign: 'center',
        background: 'rgba(0,0,0,.45)', borderBottom: `1px solid ${t.border}44` }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.26em', textTransform: 'uppercase', color: t.accent }}>
          ✦ POKE-PET ✦
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 2 }}>
        <motion.div
          animate={{ scale: [1, 1.09, 1], filter: [`drop-shadow(0 0 14px ${t.glow})`, `drop-shadow(0 0 36px ${t.glow})`, `drop-shadow(0 0 14px ${t.glow})`] }}
          transition={{ duration: 2.1, repeat: Infinity }}
          style={{ fontSize: 80 }}
        >
          {el.emoji}
        </motion.div>
        <div style={{ fontWeight: 900, fontSize: 20, color: 'white', textAlign: 'center', lineHeight: 1.2,
          textShadow: `0 0 22px ${t.glow}` }}>
          10-CARD<br />EVOLUTION PACK
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.accent }}>
          {el.label} TYPE
        </div>
      </div>
      <div style={{ width: '100%', padding: '12px 16px 14px', zIndex: 2, textAlign: 'center',
        background: 'rgba(0,0,0,.5)', borderTop: `1px solid ${t.border}44` }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 5 }}>
          {[...Array(5)].map((_, i) => (
            <motion.div key={i}
              animate={{ opacity: [.2, .85, .2] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.18 }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent }}
            />
          ))}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,.22)', letterSpacing: '0.1em' }}>CONTAINS 10 CARDS</div>
      </div>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none', zIndex: 1,
        boxShadow: `inset 0 0 48px ${t.glow}28` }} />
    </div>
  )
}

// ─── Face-down grid card ──────────────────────────────────────────────────────

function FaceDownCard({ element, status, tier }: { element: Element; status: CardStatus; tier?: EvolutionTier | null }) {
  const t  = THEME[element]
  const tc = tier ? TIERS[tier] : null
  const isReady     = status === 'ready'
  const isRevealing = status === 'revealing'
  return (
    <div style={{
      width: '100%', aspectRatio: '5/7', borderRadius: 8, overflow: 'hidden',
      background: t.bg,
      border: `1.5px solid ${tc && isReady ? tc.color + '99' : t.border + '33'}`,
      boxShadow: isReady ? `0 0 14px ${tc ? tc.glowColor : t.glow}` : 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', gap: 4,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${t.accent}0e 1px,transparent 1px),linear-gradient(90deg,${t.accent}0e 1px,transparent 1px)`,
        backgroundSize: '18px 18px',
      }} />
      <motion.div
        animate={status === 'error' ? {} : {
          opacity: isReady ? [.7, 1, .7] : [.25, .65, .25],
          scale:   isReady ? [.95, 1.05, .95] : [.92, 1.02, .92],
        }}
        transition={{ duration: isReady ? 0.85 : 1.9, repeat: Infinity }}
        style={{ fontSize: 20, zIndex: 1 }}
      >
        {status === 'error' ? '❌' : isRevealing ? '🔄' : isReady ? '✨' : '⏳'}
      </motion.div>
      {status === 'error' && (
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,.3)', zIndex: 1, letterSpacing: '0.06em' }}>failed</div>
      )}
    </div>
  )
}

// ─── Full-screen reveal overlay ───────────────────────────────────────────────

const REVEAL_CFG: Record<EvolutionTier, { suspenseMs: number; preText: string | null; shake: boolean; flipDur: number }> = {
  starter:   { suspenseMs: 250,  preText: null,                    shake: false, flipDur: 0.35 },
  evolved:   { suspenseMs: 550,  preText: null,                    shake: false, flipDur: 0.45 },
  champion:  { suspenseMs: 1000, preText: '💜 EPIC PULL!',         shake: true,  flipDur: 0.65 },
  legendary: { suspenseMs: 2200, preText: '👑 LEGENDARY DETECTED', shake: true,  flipDur: 1.10 },
}

function RevealOverlay({
  card, cardNumber, totalCards, onDone, confettiFn,
}: {
  card: CollectionCard; cardNumber: number; totalCards: number
  onDone: () => void; confettiFn: (() => void) | null
}) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [shaking,   setShaking]   = useState(false)
  const [preText,   setPreText]   = useState<string | null>(null)
  const [isDone,    setIsDone]    = useState(false)
  const cfg = REVEAL_CFG[card.tier]

  useEffect(() => {
    async function sequence() {
      await sleep(cfg.suspenseMs)
      if (cfg.preText) { setPreText(cfg.preText); await sleep(card.tier === 'legendary' ? 900 : 400) }
      if (cfg.shake) { setShaking(true); setTimeout(() => setShaking(false), 650) }
      if (card.tier === 'legendary') confettiFn?.()
      setIsFlipped(true)
      await sleep(cfg.flipDur * 1000 + 250)
      if (card.tier === 'champion') confettiFn?.()
      setIsDone(true)
    }
    sequence()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance
  useEffect(() => {
    if (!isDone) return
    const t = setTimeout(onDone, AUTO_NEXT_MS)
    return () => clearTimeout(t)
  }, [isDone, onDone])

  const t = TIERS[card.tier]

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={isDone ? onDone : undefined}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20,
        padding: '20px 16px', cursor: isDone ? 'pointer' : 'default',
      }}
    >
      {/* Ambient rarity glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(circle at 50% 45%, ${t.glowColor} 0%, transparent 55%)`,
        opacity: isFlipped ? 0.45 : 0.14, transition: 'opacity .7s',
      }} />

      {/* Counter */}
      <motion.p
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', letterSpacing: '0.16em',
          textTransform: 'uppercase', margin: 0, zIndex: 5 }}
      >
        Card {cardNumber} of {totalCards}
      </motion.p>

      {/* Pre-flip text */}
      <AnimatePresence>
        {preText && (
          <motion.div key="pt"
            initial={{ opacity: 0, y: -12, scale: .85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: 56, textAlign: 'center', zIndex: 10 }}
          >
            <motion.span
              animate={{ scale: [1, 1.06, 1] }} transition={{ duration: .7, repeat: Infinity }}
              style={{
                fontSize: card.tier === 'legendary' ? 24 : 20, fontWeight: 900,
                color: t.color, textShadow: `0 0 30px ${t.glowColor}`,
              }}
            >
              {preText}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card flip */}
      <motion.div
        animate={shaking ? {
          x: [-7, 7, -5, 5, -3, 3, -1, 1, 0], y: [-4, 4, -3, 3, -2, 2, 0],
        } : { x: 0, y: 0 }}
        transition={{ duration: .55 }}
        style={{ position: 'relative', zIndex: 5 }}
      >
        {!isFlipped && (
          <motion.p
            animate={{ opacity: [.4, 1, .4] }} transition={{ duration: .9, repeat: Infinity }}
            style={{ textAlign: 'center', fontSize: 12, color: t.color,
              marginBottom: 10, letterSpacing: '0.06em' }}
          >
            {card.tier === 'legendary' ? '✨ Something legendary awaits...'
             : card.tier === 'champion' ? '⚡ Powerful energy building...'
             : card.tier === 'evolved'  ? '💫 Evolving...'
             : '🥚 Hatching...'}
          </motion.p>
        )}

        <div style={{ perspective: 1100 }}>
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: cfg.flipDur, ease: [.15, 0, 0, 1] }}
            style={{ transformStyle: 'preserve-3d', position: 'relative' }}
          >
            {/* Back */}
            <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
              <div style={{
                width: 'min(300px, calc(100vw - 40px))', aspectRatio: '5/7',
                borderRadius: 14, background: THEME[card.element].bg,
                border: `2px solid ${t.color}88`,
                boxShadow: `0 0 32px ${t.glowColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <motion.div
                  animate={{ opacity: [.5, 1, .5] }} transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ fontSize: 56 }}
                >🥚</motion.div>
              </div>
            </div>
            {/* Front */}
            <div style={{
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              position: 'absolute', top: 0, left: 0,
            }}>
              <JokeMonCard card={card} interactive={isFlipped} />
            </div>
          </motion.div>
        </div>

        {isDone && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.35)',
              marginTop: 14, letterSpacing: '0.06em' }}
          >
            Tap to continue →
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PackOpeningFull({ element, petName, petFile, onAllComplete }: Props) {
  const [phase,        setPhase]        = useState<PackPhase>('pack')
  const [packCards,    setPackCards]    = useState<PackCard[]>(
    () => Array.from({ length: PACK_COUNT }, (_, i) => ({ index: i, status: 'generating', card: null, error: null }))
  )
  const [revealingIdx, setRevealingIdx] = useState<number | null>(null)
  const [revealedCount, setRevealedCount] = useState(0)
  const [viewing3D,    setViewing3D]    = useState<CollectionCard | null>(null)

  const confRef      = useRef<(() => void) | null>(null)
  const readyQueue   = useRef<number[]>([])
  const isRevealingR = useRef(false)
  const openedRef    = useRef(false)  // has pack been opened?

  // ── Load confetti ─────────────────────────────────────────────────────────
  useEffect(() => {
    import('canvas-confetti').then(m => {
      const fire = m.default
      confRef.current = () => {
        const o = { particleCount: 150, spread: 90, origin: { y: .55 },
          colors: ['#fbbf24','#a855f7','#38bdf8','#f472b6','#34d399'] }
        fire({ ...o, angle: 60,  origin: { x: 0,  y: .6 } })
        fire({ ...o, angle: 120, origin: { x: 1,  y: .6 } })
        setTimeout(() => fire({ ...o, particleCount: 80, spread: 130, origin: { y: .4 } }), 400)
      }
    })
  }, [])

  // ── Start 10 staggered generations on mount ───────────────────────────────
  useEffect(() => {
    let active = true
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    async function generate() {
      let base64: string
      try {
        base64 = await getImageBase64(petFile, mobile)
      } catch {
        // All compression attempts failed — mark all cards as error
        setPackCards(prev => prev.map((c) => ({ ...c, status: 'error' as const, error: 'Image failed' })))
        return
      }

      // ── Analyze image ONCE and use for all 10 cards ───────────────────────
      // This gives the AI a text description of the uploaded image so it can
      // preserve colors, body shape, and distinctive features in every card.
      // Non-fatal: generation continues even if analysis fails or is unavailable.
      let imageDescription = ''
      try {
        const analyzeRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        })
        if (analyzeRes.ok) {
          const analyzeData = await analyzeRes.json()
          imageDescription = analyzeData.description ?? ''
        }
      } catch {
        // Silently skip — cards will still generate without description
      }

      for (let i = 0; i < PACK_COUNT; i++) {
        const idx = i
        await sleep(idx * STAGGER_MS)
        if (!active) return

        ;(async () => {
          try {
            const res  = await fetch('/api/evolve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageBase64: base64,
                element,
                petName: petName.trim() || 'Fluffy',
                imageDescription,
              }),
            })
            const data = await res.json()
            if (!res.ok || data.error) throw new Error(data.error || 'Failed')

            const stats = generateStats(data.tier)
            const card  = addCard({
              tier: data.tier, element, petName: petName.trim() || 'Fluffy',
              joKemonImageUrl: data.joKemonImageUrl, ...stats,
            })
            addXP(data.tier as EvolutionTier)
            window.dispatchEvent(new Event('pokepet-xp'))

            if (!active) return
            setPackCards(prev => {
              const next = [...prev]
              next[idx] = { index: idx, status: 'ready', card, error: null }
              return next
            })

            // Enqueue for reveal only if pack is already open
            if (openedRef.current) {
              readyQueue.current.push(idx)
              tryStartReveal()
            }

          } catch {
            if (!active) return
            setPackCards(prev => {
              const next = [...prev]
              next[idx] = { index: idx, status: 'error', card: null, error: 'failed' }
              return next
            })
          }
        })()
      }
    }

    generate()
    return () => { active = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start next reveal if available ───────────────────────────────────────
  function tryStartReveal() {
    if (isRevealingR.current) return
    if (readyQueue.current.length === 0) return
    const idx = readyQueue.current.shift()!
    isRevealingR.current = true
    setRevealingIdx(idx)
    setPackCards(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], status: 'revealing' }
      return next
    })
  }

  // ── When a reveal completes ───────────────────────────────────────────────
  function handleRevealDone() {
    const idx = revealingIdx
    if (idx === null) return

    setPackCards(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], status: 'revealed' }
      return next
    })

    setRevealedCount(c => {
      const newC = c + 1
      if (newC >= PACK_COUNT) setTimeout(() => setPhase('complete'), 500)
      return newC
    })

    setRevealingIdx(null)
    isRevealingR.current = false
    setTimeout(tryStartReveal, 480)
  }

  // ── Open the pack ─────────────────────────────────────────────────────────
  function handleOpenPack() {
    setPhase('ripping')
    openedRef.current = true

    // Enqueue any cards that already finished generating
    setPackCards(prev => {
      const readyNow = prev.filter(c => c.status === 'ready').map(c => c.index)
      readyQueue.current.push(...readyNow)
      return prev
    })

    setTimeout(() => {
      setPhase('opening')
      setTimeout(tryStartReveal, 300)
    }, 650)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const theme       = THEME[element]
  const revealCard  = revealingIdx !== null ? packCards[revealingIdx]?.card : null
  const genCount    = packCards.filter(c => c.status !== 'generating').length
  const allRevealed = packCards.filter(c => c.status === 'revealed')

  // Responsive: detect narrow viewport for layout adjustments
  const [vw, setVw] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 420)
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const isMobile = vw < 480
  const packSize = isMobile ? Math.min(vw - 48, 240) : 280
  const gridCols = isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 24, padding: '16px 0', position: 'relative' }}>

      <AnimatePresence mode="wait">

        {/* ── Pack stage ── */}
        {(phase === 'pack' || phase === 'ripping') && (
          <motion.div key="packstage"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, transition: { duration: .2 } }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
          >
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', letterSpacing: '0.14em',
              textTransform: 'uppercase', margin: 0 }}>
              {genCount}/{PACK_COUNT} cards ready · {petName ? `${petName}'s pack` : 'evolution pack'}
            </p>

            {/* Pack art — two halves split on rip */}
            <div style={{ position: 'relative', width: packSize, height: Math.round(packSize * 1.4) }}>
              {phase === 'pack' && (
                <>
                  <motion.div
                    style={{ position: 'absolute', inset: 0, filter: `drop-shadow(0 4px 28px ${theme.glow})` }}>
                    <PackFace element={element} shimmer />
                  </motion.div>
                  <motion.div
                    animate={{ boxShadow: [`0 0 20px ${theme.glow}`, `0 0 52px ${theme.glow}`, `0 0 20px ${theme.glow}`] }}
                    transition={{ duration: 1.9, repeat: Infinity }}
                    style={{ position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
                      border: `2px solid ${theme.border}` }}
                  />
                </>
              )}

              {phase === 'ripping' && (
                <>
                  {/* Left half flies top-left */}
                  <motion.div
                    initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                    animate={{ x: -220, y: -200, rotate: -38, opacity: 0 }}
                    transition={{ duration: .58, ease: [.15, 0, .85, 1] }}
                    style={{ position: 'absolute', inset: 0,
                      clipPath: 'polygon(0 0,51% 0,49% 100%,0 100%)',
                      filter: `drop-shadow(0 0 18px ${theme.glow})` }}
                  >
                    <PackFace element={element} />
                  </motion.div>

                  {/* Right half flies top-right */}
                  <motion.div
                    initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                    animate={{ x: 220, y: -200, rotate: 38, opacity: 0 }}
                    transition={{ duration: .58, ease: [.15, 0, .85, 1] }}
                    style={{ position: 'absolute', inset: 0,
                      clipPath: 'polygon(49% 0,100% 0,100% 100%,51% 100%)',
                      filter: `drop-shadow(0 0 18px ${theme.glow})` }}
                  >
                    <PackFace element={element} />
                  </motion.div>

                  {/* Burst flash */}
                  <motion.div
                    initial={{ opacity: 1, scale: .3 }}
                    animate={{ opacity: 0, scale: 2.4 }}
                    transition={{ duration: .5 }}
                    style={{ position: 'absolute', inset: -60, borderRadius: '50%', zIndex: 10, pointerEvents: 'none',
                      background: `radial-gradient(circle, ${theme.accent}cc 0%, transparent 65%)` }}
                  />
                </>
              )}
            </div>

            {/* Open button */}
            {phase === 'pack' && (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .2 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
              >
                <motion.button
                  onClick={handleOpenPack}
                  animate={{
                    scale: [1, 1.035, 1],
                    boxShadow: [`0 0 22px ${theme.glow}`, `0 0 55px ${theme.glow}`, `0 0 22px ${theme.glow}`],
                  }}
                  transition={{ duration: 1.7, repeat: Infinity }}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: .92 }}
                  style={{
                    padding: isMobile ? '16px 28px' : '18px 52px', borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: `linear-gradient(135deg, ${theme.border}, ${theme.accent})`,
                    color: '#000', fontWeight: 900, fontSize: isMobile ? 15 : 18,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}
                >
                  🎴 OPEN 10-CARD PACK
                </motion.button>
                <motion.p
                  animate={{ opacity: [.3, .65, .3] }} transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', margin: 0, letterSpacing: '0.08em' }}
                >
                  Cards generating in background
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Opening / Complete: card grid ── */}
        {(phase === 'opening' || phase === 'complete') && (
          <motion.div key="gridstage"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ width: '100%', maxWidth: 520, padding: '0 4px' }}
          >
            {/* Progress bar (opening) */}
            {phase === 'opening' && (
              <motion.div style={{ marginBottom: 16, padding: '0 4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>
                    {revealedCount} / {PACK_COUNT} revealed
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
                    {genCount}/{PACK_COUNT} generated
                  </span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,.07)', borderRadius: 999, overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${(revealedCount / PACK_COUNT) * 100}%` }}
                    transition={{ duration: .4 }}
                    style={{ height: '100%', borderRadius: 999,
                      background: `linear-gradient(90deg, ${theme.border}, ${theme.accent})` }}
                  />
                </div>
              </motion.div>
            )}

            {/* Complete header */}
            {phase === 'complete' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: 20 }}
              >
                <motion.p
                  animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ fontSize: 22, fontWeight: 900, margin: '0 0 6px' }}
                >
                  Pack Complete! 🎉
                </motion.p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', margin: 0 }}>
                  {getRaritySummary(packCards)}
                </p>
              </motion.div>
            )}

            {/* Card grid — 5 cols desktop, 2 cols mobile */}
            <div style={{
              display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? 10 : 6,
            }}>
              {packCards.map((pc, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 16, scale: .85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 320, damping: 22 }}
                >
                  {pc.status === 'revealed' && pc.card ? (
                    <motion.div
                      whileHover={{ scale: 1.1, y: -4, zIndex: 10 }}
                      whileTap={{ scale: .95 }}
                      style={{ position: 'relative', cursor: 'pointer' }}
                      onClick={() => pc.card && setViewing3D(pc.card)}
                    >
                      <JokeMonCard card={pc.card} compact />
                    </motion.div>
                  ) : (
                    <FaceDownCard element={element} status={pc.status} tier={pc.card?.tier} />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Complete actions */}
            {phase === 'complete' && (
              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: .3 }}
                style={{ padding: '20px 4px 0', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <motion.button
                  onClick={() => onAllComplete(allRevealed.map(c => c.card!))}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: .97 }}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: `linear-gradient(135deg, ${theme.border}, ${theme.accent})`,
                    color: '#000', fontWeight: 900, fontSize: 15, letterSpacing: '0.05em',
                  }}
                >
                  🏆 View Full Collection →
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Individual card reveal overlay ── */}
      <AnimatePresence>
        {revealCard && (
          <RevealOverlay
            key={`reveal-${revealingIdx}`}
            card={revealCard}
            cardNumber={revealedCount + 1}
            totalCards={PACK_COUNT}
            onDone={handleRevealDone}
            confettiFn={confRef.current}
          />
        )}
      </AnimatePresence>

      {/* ── 3D Viewer ── */}
      {viewing3D && <Card3DViewer card={viewing3D} onClose={() => setViewing3D(null)} />}
    </div>
  )
}

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ELEMENTS, TIERS, type Element, type EvolutionTier } from '@/lib/evolution'
import { addCard, addXP, generateStats, getCollection, type CollectionCard } from '@/lib/collection'
import JokeMonCard from '@/components/JokeMonCard'
import ShareButton from '@/components/ShareButton'

// Dynamic imports — keeps heavy modules out of the main bundle
const Card3DViewer = dynamic(() => import('@/components/Card3DViewer'), { ssr: false })
const PackOpening  = dynamic(() => import('@/components/PackOpening'),  { ssr: false })

type Phase = 'upload' | 'element' | 'pack' | 'reveal'

const PHASE_TOASTS: Record<EvolutionTier, { icon: string; message: string }> = {
  starter:   { icon: '🥚', message: 'A Starter JokeMon has hatched!' },
  evolved:   { icon: '✨', message: 'An Evolved JokeMon emerged!' },
  champion:  { icon: '💜', message: 'EPIC! An Champion-class JokeMon appeared!' },
  legendary: { icon: '🌟', message: 'LEGENDARY! An ancient JokeMon has awakened!' },
}

// ─── Element Orb ─────────────────────────────────────────────────────────────

function ElementOrb({ element, selected, onClick }: { element: Element; selected: boolean; onClick: () => void }) {
  const cfg = ELEMENTS[element]
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.07, y: -4 }}
      whileTap={{ scale: 0.95 }}
      animate={selected ? {
        boxShadow: [`0 0 20px ${cfg.glowColor}`, `0 0 40px ${cfg.glowColor}`, `0 0 20px ${cfg.glowColor}`],
      } : { boxShadow: 'none' }}
      transition={{ boxShadow: { duration: 1.6, repeat: Infinity } }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        padding: '20px 16px', borderRadius: 16, cursor: 'pointer',
        border: selected ? `2px solid ${cfg.color}` : '2px solid rgba(255,255,255,0.1)',
        background: selected
          ? `linear-gradient(135deg, ${cfg.color}28, ${cfg.color}14)`
          : 'rgba(255,255,255,0.04)',
        transition: 'border 0.2s, background 0.2s',
        position: 'relative', overflow: 'hidden',
      }}
      aria-pressed={selected}
    >
      {selected && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(circle at center, ${cfg.color}18, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )}
      <motion.span
        animate={selected ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
        transition={{ duration: 1.8, repeat: Infinity }}
        style={{ fontSize: 40, display: 'block' }}
      >
        {cfg.emoji}
      </motion.span>
      <span style={{ fontWeight: 900, letterSpacing: '0.12em', fontSize: 14, color: selected ? cfg.color : 'white' }}>
        {cfg.label}
      </span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.4 }}>
        {cfg.description}
      </span>
      {selected && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 18, height: 18, borderRadius: '50%',
            background: cfg.color, color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900,
          }}
        >✓</motion.div>
      )}
    </motion.button>
  )
}

// ─── Evolving State ───────────────────────────────────────────────────────────

function EvolvingState({ element }: { element: Element }) {
  const cfg = ELEMENTS[element]
  const [dots, setDots] = useState(0)
  const [particles, setParticles] = useState<{ id: number; x: number }[]>([])

  useEffect(() => {
    const d = setInterval(() => setDots(n => (n + 1) % 4), 400)
    const p = setInterval(() => {
      setParticles(prev => [...prev.slice(-8), { id: Date.now(), x: Math.random() * 80 + 10 }])
    }, 300)
    return () => { clearInterval(d); clearInterval(p) }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, padding: '48px 0' }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: cfg.color }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', inset: 16, borderRadius: '50%',
            background: `radial-gradient(circle, ${cfg.color}, transparent)`,
            boxShadow: `0 0 40px ${cfg.glowColor}`,
          }}
        />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}
        >
          {cfg.emoji}
        </motion.div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 22, fontWeight: 900, color: cfg.color, margin: 0 }}>
          EVOLVING{'.'.repeat(dots)}
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          The fates are deciding your JokeMon's destiny
        </p>
      </div>

      <div style={{ width: 260, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: ['0%', '30%', '65%', '88%', '95%'] }}
          transition={{ duration: 28, times: [0, 0.15, 0.5, 0.8, 1], ease: 'easeInOut' }}
          style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})` }}
        />
      </div>

      <div style={{ position: 'relative', width: 260, height: 60, overflow: 'hidden' }}>
        {particles.map(p => (
          <span key={p.id} className="particle"
            style={{ position: 'absolute', left: `${p.x}%`, bottom: 0, fontSize: 20 }}>
            {cfg.particle}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Rarity Guide ────────────────────────────────────────────────────────────

function RarityGuide() {
  const tiers: [EvolutionTier, number][] = [
    ['starter', 40], ['evolved', 35], ['champion', 18], ['legendary', 7],
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      style={{
        borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)', padding: 20,
      }}
    >
      <h3 style={{
        textAlign: 'center', fontSize: 11, fontWeight: 700,
        color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
        letterSpacing: '0.15em', margin: '0 0 16px',
      }}>
        Evolution Rarity
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {tiers.map(([key, pct], i) => {
          const cfg = TIERS[key]
          return (
            <motion.div key={key}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, background: `${cfg.color}0e`, border: `1px solid ${cfg.color}28`,
              }}>
              <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.rarity}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{pct}% chance</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: cfg.color }}>
                {'★'.repeat(cfg.stars)}
              </span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [phase, setPhase] = useState<Phase>('upload')
  const [petFile, setPetFile] = useState<File | null>(null)
  const [petPreviewUrl, setPetPreviewUrl] = useState<string | null>(null)
  const [petName, setPetName] = useState('')
  const [element, setElement] = useState<Element | null>(null)
  const [result, setResult] = useState<CollectionCard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [collectionCount, setCollectionCount] = useState(0)
  const [show3D, setShow3D] = useState(false)
  const confettiRef = useRef<(() => void) | null>(null)
  // Card generation promise — starts immediately when Evolve is clicked
  const cardPromiseRef = useRef<Promise<CollectionCard> | null>(null)
  // Level-up data stored for the onComplete toast
  const levelUpRef = useRef<{ leveledUp: boolean; newLevel: number } | null>(null)

  useEffect(() => { setCollectionCount(getCollection().length) }, [])

  // Lazy-load canvas-confetti
  useEffect(() => {
    import('canvas-confetti').then(mod => {
      const fire = mod.default
      confettiRef.current = () => {
        const opts = {
          particleCount: 180, spread: 90, origin: { y: 0.55 },
          colors: ['#fbbf24', '#a855f7', '#38bdf8', '#f472b6', '#34d399'],
        }
        fire({ ...opts, angle: 60, origin: { x: 0, y: 0.6 } })
        fire({ ...opts, angle: 120, origin: { x: 1, y: 0.6 } })
        setTimeout(() => fire({ ...opts, particleCount: 80, spread: 120, origin: { y: 0.4 } }), 300)
      }
    })
  }, [])

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setPetFile(file)
    setPetPreviewUrl(URL.createObjectURL(file))
    setPhase('element')
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const handleEvolve = () => {
    if (!petFile || !element) return
    setError(null)

    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    // Start generation immediately as a background promise — pack opening
    // plays while this resolves (avg 15-30s, pack animation fills the wait).
    const promise: Promise<CollectionCard> = (async () => {
      const base64 = await compressImage(petFile, mobile ? 640 : 1024, mobile ? 0.7 : 0.82)
      const res = await fetch('/api/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, element, petName: petName.trim() || 'Fluffy' }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Evolution failed')

      const stats = generateStats(data.tier)
      const card  = addCard({ tier: data.tier, element, petName: petName.trim() || 'Fluffy', joKemonImageUrl: data.joKemonImageUrl, ...stats })

      const { leveledUp, newLevel } = addXP(data.tier as EvolutionTier)
      window.dispatchEvent(new Event('pokepet-xp'))
      setCollectionCount(c => c + 1)
      levelUpRef.current = { leveledUp, newLevel }

      return card
    })()

    cardPromiseRef.current = promise
    setPhase('pack')
  }

  // Called by PackOpening once the reveal animation completes
  const handlePackComplete = (card: CollectionCard) => {
    setResult(card)
    setPhase('reveal')

    const t = PHASE_TOASTS[card.tier]
    toast(t.message, {
      icon: t.icon,
      duration: card.tier === 'legendary' || card.tier === 'champion' ? 5000 : 3000,
      style: card.tier === 'legendary'
        ? { border: '1px solid rgba(251,191,36,0.5)', background: '#1a0a00', color: '#fbbf24' }
        : card.tier === 'champion'
        ? { border: '1px solid rgba(168,85,247,0.5)', background: '#0d0618', color: '#c084fc' }
        : undefined,
    })

    const lu = levelUpRef.current
    levelUpRef.current = null
    if (lu?.leveledUp) {
      setTimeout(() => toast(`⬆ Level Up! You're now Lab Level ${lu.newLevel}!`, {
        icon: '🏆', duration: 4000,
        style: { border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24' },
      }), 800)
    }
  }

  const handlePackError = (msg: string) => {
    toast(`Evolution failed: ${msg}`, { icon: '⚠️', duration: 6000 })
    setError(msg)
    setPhase('element')
  }

  const handleReset = () => {
    setPhase('upload')
    setPetFile(null)
    setPetPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    setPetName('')
    setElement(null)
    setResult(null)
    setError(null)
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', zIndex: 1 }}>
      <main style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px 80px' }}>
        <AnimatePresence mode="wait">

          {/* ── Upload ── */}
          {phase === 'upload' && (
            <motion.div key="upload"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}
            >
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <motion.h1
                  initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}
                >
                  Evolve Your{' '}
                  <span className="shimmer-text">Pet</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, marginTop: 8 }}
                >
                  Upload a photo · choose an element · collect your JokeMon card
                </motion.p>
              </div>

              <motion.div
                {...(getRootProps() as object)}
                whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.45)' }}
                whileTap={{ scale: 0.99 }}
                style={{
                  borderRadius: 20,
                  border: `2px dashed ${isDragActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'}`,
                  padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
                  background: isDragActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                  transition: 'background 0.2s',
                  marginBottom: 24,
                }}
              >
                <input {...getInputProps()} />
                <motion.div
                  animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: 56 }}
                >
                  📸
                </motion.div>
                <p style={{ fontSize: 18, fontWeight: 600, margin: '12px 0 4px' }}>
                  {isDragActive ? 'Drop your pet here!' : 'Upload your pet photo'}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                  Drag & drop or tap · JPG, PNG, WebP · Max 10 MB
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16,
                  background: 'rgba(255,255,255,0.1)', borderRadius: 999,
                  padding: '8px 20px', fontSize: 14, fontWeight: 600,
                }}>
                  Choose Photo →
                </div>
              </motion.div>

              <RarityGuide />
            </motion.div>
          )}

          {/* ── Element Picker ── */}
          {phase === 'element' && (
            <motion.div key="element"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35 }}
            >
              {petPreviewUrl && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: 14,
                    borderRadius: 14, background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24,
                  }}>
                  <div style={{ position: 'relative', width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={petPreviewUrl} alt="Your pet" fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{petFile?.name ?? 'Your pet'}</p>
                    <button onClick={handleReset} style={{
                      fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'none',
                      border: 'none', cursor: 'pointer', padding: 0, marginTop: 2,
                    }}>← Change photo</button>
                  </div>
                </motion.div>
              )}

              {/* Pet Name Input */}
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                style={{ marginBottom: 18 }}
              >
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                  letterSpacing: '0.12em', marginBottom: 8,
                }}>
                  Pet Name <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={petName}
                  onChange={e => setPetName(e.target.value)}
                  placeholder="e.g. Fluffy, Max, Sir Biscuit..."
                  maxLength={24}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 16,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white', outline: 'none', boxSizing: 'border-box',
                    transition: 'border 0.2s',
                  }}
                  onFocus={e => (e.target.style.border = '1px solid rgba(255,255,255,0.4)')}
                  onBlur={e => (e.target.style.border = '1px solid rgba(255,255,255,0.15)')}
                />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                style={{ textAlign: 'center', fontSize: 22, fontWeight: 900, marginBottom: 16 }}
              >
                Choose Your Element
              </motion.h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {(['water', 'fire', 'wind'] as Element[]).map((el, i) => (
                  <motion.div key={el} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}>
                    <ElementOrb element={el} selected={element === el} onClick={() => setElement(el)} />
                  </motion.div>
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '12px 16px', borderRadius: 12, marginBottom: 16,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', fontSize: 13, textAlign: 'center',
                  }}
                >
                  ⚠️ {error}
                </motion.div>
              )}

              <motion.button
                onClick={handleEvolve}
                disabled={!element}
                whileHover={element ? { scale: 1.03 } : {}}
                whileTap={element ? { scale: 0.97 } : {}}
                animate={element ? {
                  boxShadow: [
                    `0 0 20px ${ELEMENTS[element].glowColor}`,
                    `0 0 40px ${ELEMENTS[element].glowColor}`,
                    `0 0 20px ${ELEMENTS[element].glowColor}`,
                  ],
                } : {}}
                transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
                style={{
                  width: '100%', padding: '18px', borderRadius: 16,
                  fontSize: 18, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                  border: 'none', cursor: element ? 'pointer' : 'not-allowed',
                  color: element ? '#000' : 'rgba(255,255,255,0.3)',
                  background: element
                    ? `linear-gradient(135deg, ${ELEMENTS[element].color}, ${ELEMENTS[element].color}cc)`
                    : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {element ? '⚡ EVOLVE! ⚡' : 'Choose an element first'}
              </motion.button>
            </motion.div>
          )}

          {/* ── Pack Opening ── */}
          {phase === 'pack' && element && cardPromiseRef.current && (
            <motion.div key="pack"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            >
              <PackOpening
                element={element}
                petName={petName}
                cardPromise={cardPromiseRef.current}
                onComplete={handlePackComplete}
                onError={handlePackError}
              />
            </motion.div>
          )}

          {/* ── Reveal ── */}
          {phase === 'reveal' && result && element && (
            <motion.div key="reveal"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center' }}
              >
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
                  Evolution Complete!
                </p>
                {result.tier === 'legendary' && (
                  <motion.p
                    animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24', margin: '6px 0 0' }}
                  >
                    🎉 LEGENDARY PULL! 🎉
                  </motion.p>
                )}
                {result.tier === 'champion' && (
                  <motion.p
                    animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.4, repeat: Infinity }}
                    style={{ fontSize: 17, fontWeight: 900, color: '#c084fc', margin: '6px 0 0' }}
                  >
                    💜 EPIC CHAMPION! 💜
                  </motion.p>
                )}
              </motion.div>

              <div className="animate-card-reveal">
                <JokeMonCard card={result} interactive />
              </div>
              {result.tier !== 'starter' && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '-8px 0 0', letterSpacing: '0.08em' }}>
                  ↕ Drag to rotate • holo shifts with angle
                </p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}
              >
                {/* Share CTA — the big viral button */}
                <ShareButton card={result} />

                <motion.button
                  onClick={() => setShow3D(true)}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 12, textAlign: 'center',
                    border: `1px solid ${TIERS[result.tier].color}55`,
                    background: `${TIERS[result.tier].color}15`,
                    color: TIERS[result.tier].color,
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  🌀 View in 3D
                </motion.button>

                <Link href="/collection" style={{
                  display: 'block', padding: '12px', borderRadius: 12, textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.65)',
                  textDecoration: 'none', fontWeight: 600, fontSize: 14,
                }}>
                  🏆 View Collection ({collectionCount})
                </Link>

                <button onClick={handleReset} style={{
                  padding: '12px', borderRadius: 12, textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)',
                  background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                }}>
                  🔄 Evolve Another Pet
                </button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 3D Viewer modal */}
      {show3D && result && (
        <Card3DViewer card={result} onClose={() => setShow3D(false)} />
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim }
        else { width = Math.round(width * maxDim / height); height = maxDim }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1])
    }
    img.onerror = reject
    img.src = url
  })
}

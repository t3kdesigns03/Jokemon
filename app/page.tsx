'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import Link from 'next/link'
import { ELEMENTS, TIERS, type Element, type EvolutionTier } from '@/lib/evolution'
import { addCard, generateStats, getCollection, type CollectionCard } from '@/lib/collection'
import JokeMonCard from '@/components/JokeMonCard'

type Phase = 'upload' | 'element' | 'evolving' | 'reveal'

// ─── Element Card ─────────────────────────────────────────────────────────────

function ElementCard({ element, selected, onClick }: { element: Element; selected: boolean; onClick: () => void }) {
  const cfg = ELEMENTS[element]
  return (
    <button
      onClick={onClick}
      className="card-lift"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        padding: '20px 16px', borderRadius: 16, cursor: 'pointer',
        border: selected ? `2px solid ${cfg.color}` : '2px solid rgba(255,255,255,0.1)',
        background: selected
          ? `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`
          : 'rgba(255,255,255,0.04)',
        boxShadow: selected ? `0 0 28px ${cfg.glowColor}` : 'none',
        transform: selected ? 'scale(1.04)' : 'scale(1)',
        transition: 'all 0.25s ease',
        position: 'relative', overflow: 'hidden',
      }}
      aria-pressed={selected}
    >
      {selected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at center, ${cfg.color}18, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}
      <span style={{ fontSize: 40 }}>{cfg.emoji}</span>
      <span style={{ fontWeight: 900, letterSpacing: '0.12em', fontSize: 14, color: selected ? cfg.color : 'white' }}>
        {cfg.label}
      </span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.4 }}>
        {cfg.description}
      </span>
      {selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 18, height: 18, borderRadius: '50%',
          background: cfg.color, color: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 900,
        }}>✓</div>
      )}
    </button>
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
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%', opacity: 0.3,
          background: cfg.color, animation: 'evolve-ping 1s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 16, borderRadius: '50%',
          background: `radial-gradient(circle, ${cfg.color}, transparent)`,
          boxShadow: `0 0 40px ${cfg.glowColor}`,
          animation: 'evolve-spin 1s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 56,
          animation: 'float 3s ease-in-out infinite',
        }}>
          {cfg.emoji}
        </div>
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
        <div style={{
          height: '100%', borderRadius: 999,
          background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
          animation: 'progress-fill 30s ease-in-out forwards',
        }} />
      </div>

      <div style={{ position: 'relative', width: 260, height: 60, overflow: 'hidden' }}>
        {particles.map(p => (
          <span key={p.id} className="particle"
            style={{ position: 'absolute', left: `${p.x}%`, bottom: 0, fontSize: 20 }}>
            {cfg.particle}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes evolve-ping {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.1; }
        }
        @keyframes progress-fill {
          0%  { width: 0%; }   20% { width: 30%; }
          55% { width: 65%; }  85% { width: 88%; }
          100% { width: 95%; }
        }
      `}</style>
    </div>
  )
}

// ─── Rarity Guide ────────────────────────────────────────────────────────────

function RarityGuide() {
  const tiers: [EvolutionTier, number][] = [
    ['starter', 40], ['evolved', 35], ['champion', 18], ['legendary', 7],
  ]
  return (
    <div style={{
      borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.02)', padding: 20,
    }}>
      <h3 style={{
        textAlign: 'center', fontSize: 11, fontWeight: 700,
        color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
        letterSpacing: '0.15em', margin: '0 0 16px',
      }}>
        Evolution Rarity
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {tiers.map(([key, pct]) => {
          const cfg = TIERS[key]
          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 10,
              background: `${cfg.color}0e`,
              border: `1px solid ${cfg.color}28`,
            }}>
              <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.rarity}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{pct}% chance</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: cfg.color }}>
                {'★'.repeat(cfg.stars)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [phase, setPhase] = useState<Phase>('upload')
  const [petFile, setPetFile] = useState<File | null>(null)
  const [petPreviewUrl, setPetPreviewUrl] = useState<string | null>(null)
  const [element, setElement] = useState<Element | null>(null)
  const [result, setResult] = useState<CollectionCard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [collectionCount, setCollectionCount] = useState(0)

  useEffect(() => { setCollectionCount(getCollection().length) }, [])

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

  const handleEvolve = async () => {
    if (!petFile || !element) return
    setPhase('evolving')
    setError(null)

    try {
      const base64 = await compressImage(petFile, 1024, 0.85)

      const res = await fetch('/api/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, element }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Evolution failed')

      // Generate persistent stats and save to collection
      const stats = generateStats(data.tier)
      const card = addCard({
        tier: data.tier,
        element,
        joKemonImageUrl: data.joKemonImageUrl,
        ...stats,
      })

      setResult(card)
      setCollectionCount(c => c + 1)
      setPhase('reveal')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('element')
    }
  }

  const handleReset = () => {
    setPhase('upload')
    setPetFile(null)
    setPetPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    setElement(null)
    setResult(null)
    setError(null)
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', zIndex: 1 }}>
      <main style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Hero */}
        {phase === 'upload' && (
          <div style={{ textAlign: 'center', marginBottom: 28, animation: 'reveal 0.6s ease-out' }}>
            <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
              Evolve Your{' '}
              <span className="shimmer-text">Pet</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, marginTop: 8 }}>
              Upload a photo · choose an element · collect your JokeMon card
            </p>
          </div>
        )}

        {/* Upload Zone */}
        {phase === 'upload' && (
          <div
            {...getRootProps()}
            style={{
              borderRadius: 20, border: `2px dashed ${isDragActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'}`,
              padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
              background: isDragActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s ease', marginBottom: 24,
            }}
          >
            <input {...getInputProps()} />
            <div style={{ fontSize: 56, animation: 'float 3s ease-in-out infinite' }}>📸</div>
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
          </div>
        )}

        {/* Element Picker */}
        {phase === 'element' && (
          <div style={{ animation: 'reveal 0.5s ease-out' }}>
            {/* Pet preview */}
            {petPreviewUrl && (
              <div style={{
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
              </div>
            )}

            <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 900, marginBottom: 16 }}>
              Choose Your Element
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {(['water', 'fire', 'wind'] as Element[]).map(el => (
                <ElementCard key={el} element={el} selected={element === el} onClick={() => setElement(el)} />
              ))}
            </div>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 12, marginBottom: 16,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171', fontSize: 13, textAlign: 'center',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleEvolve}
              disabled={!element}
              style={{
                width: '100%', padding: '18px', borderRadius: 16,
                fontSize: 18, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                border: 'none', cursor: element ? 'pointer' : 'not-allowed',
                color: element ? '#000' : 'rgba(255,255,255,0.3)',
                background: element
                  ? `linear-gradient(135deg, ${ELEMENTS[element].color}, ${ELEMENTS[element].color}cc)`
                  : 'rgba(255,255,255,0.08)',
                boxShadow: element ? `0 0 28px ${ELEMENTS[element].glowColor}` : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {element ? '⚡ EVOLVE! ⚡' : 'Choose an element first'}
            </button>
          </div>
        )}

        {/* Evolving */}
        {phase === 'evolving' && element && (
          <div style={{ animation: 'reveal 0.4s ease-out' }}>
            <EvolvingState element={element} />
          </div>
        )}

        {/* Reveal */}
        {phase === 'reveal' && result && element && (
          <div style={{ animation: 'reveal 0.6s ease-out', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
                Evolution Complete!
              </p>
              {result.tier === 'legendary' && (
                <p style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24', animation: 'shimmer 1.5s linear infinite', margin: '6px 0 0' }}>
                  🎉 LEGENDARY PULL! 🎉
                </p>
              )}
            </div>

            {/* The Card */}
            <div className="animate-card-reveal">
              <JokeMonCard card={result} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
              <a
                href={`/api/proxy-image?url=${encodeURIComponent(result.joKemonImageUrl)}`}
                download="my-jokemon.jpg" target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'block', padding: '12px', borderRadius: 12, textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.65)',
                  textDecoration: 'none', fontWeight: 600, fontSize: 14,
                }}
              >
                ⬇ Download JokeMon
              </a>

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
            </div>
          </div>
        )}

        {/* Rarity guide on home */}
        {phase === 'upload' && <RarityGuide />}

      </main>
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

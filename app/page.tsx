'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { ELEMENTS, TIERS, type Element, type EvolutionTier } from '@/lib/evolution'

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = 'upload' | 'element' | 'evolving' | 'reveal'

interface EvolutionResult {
  tier: EvolutionTier
  joKemonImageUrl: string
}

// ─── Particle System ─────────────────────────────────────────────────────────

function Particle({ emoji, style }: { emoji: string; style: React.CSSProperties }) {
  return (
    <span className="pointer-events-none absolute text-2xl particle select-none" style={style}>
      {emoji}
    </span>
  )
}

// ─── Element Card ─────────────────────────────────────────────────────────────

function ElementCard({ element, selected, onClick }: { element: Element; selected: boolean; onClick: () => void }) {
  const cfg = ELEMENTS[element]
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer card-lift
        ${selected
          ? `border-2 scale-105 shadow-2xl ${cfg.bgFrom} bg-gradient-to-br ${cfg.bgTo}`
          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
        }`}
      style={selected ? { borderColor: cfg.color, boxShadow: `0 0 30px ${cfg.glowColor}` } : {}}
      aria-label={`Choose ${cfg.label} element`}
      aria-pressed={selected}
    >
      {selected && (
        <div className="absolute inset-0 rounded-2xl opacity-20"
          style={{ background: `radial-gradient(circle at center, ${cfg.color}, transparent 70%)` }} />
      )}
      <span className="text-5xl drop-shadow-lg">{cfg.emoji}</span>
      <span className="text-xl font-black tracking-widest" style={{ color: selected ? cfg.color : 'white' }}>
        {cfg.label}
      </span>
      <span className="text-xs text-white/50 text-center leading-snug">{cfg.description}</span>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-black"
          style={{ backgroundColor: cfg.color }}>✓</div>
      )}
    </button>
  )
}

// ─── Evolution Progress ───────────────────────────────────────────────────────

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
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="relative w-40 h-40">
        <div className="absolute inset-0 rounded-full opacity-30 animate-ping" style={{ background: cfg.color }} />
        <div className="absolute inset-4 rounded-full animate-[evolve-spin_1s_ease-in-out_infinite]"
          style={{ background: `radial-gradient(circle, ${cfg.color}, transparent)`, boxShadow: `0 0 40px ${cfg.glowColor}` }} />
        <div className="absolute inset-0 flex items-center justify-center text-6xl animate-[float_3s_ease-in-out_infinite]">
          {cfg.emoji}
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-2xl font-black" style={{ color: cfg.color }}>
          EVOLVING{'.'.repeat(dots)}
        </p>
        <p className="text-white/50 text-sm">The fates are deciding your JokeMon's destiny</p>
      </div>
      <div className="w-64 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{
          background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
          animation: 'progress-fill 30s ease-in-out forwards',
        }} />
      </div>
      <div className="relative w-64 h-16 overflow-hidden">
        {particles.map(p => (
          <Particle key={p.id} emoji={cfg.particle} style={{ left: `${p.x}%`, bottom: 0 }} />
        ))}
      </div>
      <style>{`
        @keyframes progress-fill {
          0%   { width: 0%; }
          20%  { width: 35%; }
          50%  { width: 65%; }
          80%  { width: 88%; }
          100% { width: 95%; }
        }
      `}</style>
    </div>
  )
}

// ─── JokeMon Card ─────────────────────────────────────────────────────────────

function JokeMonCard({ imageUrl, tier, element }: { imageUrl: string; tier: EvolutionTier; element: Element }) {
  const tierCfg = TIERS[tier]
  const elementCfg = ELEMENTS[element]
  const isLegendary = tier === 'legendary'

  // Deterministic-ish stats based on tier
  const baseHp  = { starter: 45, evolved: 80, champion: 120, legendary: 200 }[tier]
  const baseAtk = { starter: 30, evolved: 60, champion: 95,  legendary: 155 }[tier]
  const baseDef = { starter: 25, evolved: 50, champion: 80,  legendary: 130 }[tier]
  const baseSpd = { starter: 35, evolved: 65, champion: 100, legendary: 145 }[tier]

  const cardBorder = isLegendary
    ? 'linear-gradient(135deg, #fbbf24, #f97316, #a855f7, #fbbf24)'
    : `linear-gradient(135deg, ${tierCfg.color}, ${tierCfg.color}88, ${tierCfg.color})`

  return (
    <div className="relative mx-auto" style={{ width: '100%', maxWidth: 340 }}>
      {/* Legendary glow */}
      {isLegendary && (
        <div className="absolute -inset-3 rounded-3xl opacity-60 blur-xl animate-pulse"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316, #a855f7)' }} />
      )}

      {/* Card frame */}
      <div className="relative rounded-2xl overflow-hidden" style={{
        background: cardBorder,
        padding: 3,
        boxShadow: `0 0 40px ${tierCfg.glowColor}, 0 20px 60px rgba(0,0,0,0.5)`,
      }}>
        <div className="rounded-[13px] overflow-hidden" style={{
          background: 'linear-gradient(160deg, #0f0f1a 0%, #1a1a2e 50%, #0d0d1a 100%)',
        }}>

          {/* Card header */}
          <div className="flex items-center justify-between px-4 py-2.5"
            style={{ background: `linear-gradient(90deg, ${elementCfg.color}33, transparent)` }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{elementCfg.emoji}</span>
              <span className="text-xs font-black tracking-widest uppercase" style={{ color: elementCfg.color }}>
                {elementCfg.label} Type
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">HP</span>
              <span className="text-sm font-black" style={{ color: tierCfg.color }}>{baseHp}</span>
            </div>
          </div>

          {/* JokeMon image */}
          <div className="relative mx-3 mb-3 rounded-xl overflow-hidden" style={{
            aspectRatio: '1',
            border: `1px solid ${tierCfg.color}44`,
            boxShadow: `inset 0 0 30px ${elementCfg.color}22`,
          }}>
            <Image src={imageUrl} alt="Your JokeMon" fill className="object-cover" />
            {/* Holographic sheen for legendary */}
            {isLegendary && (
              <div className="absolute inset-0 shimmer-overlay" style={{
                background: 'linear-gradient(135deg, transparent 30%, rgba(255,215,0,0.15) 50%, transparent 70%)',
                animation: 'shimmer-move 3s ease-in-out infinite',
              }} />
            )}
          </div>

          {/* Tier badge */}
          <div className="flex justify-center mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
              style={{
                background: isLegendary
                  ? 'linear-gradient(135deg, #fbbf24, #f97316)'
                  : `${tierCfg.color}22`,
                border: `1px solid ${tierCfg.color}`,
                color: isLegendary ? '#000' : tierCfg.color,
              }}>
              <span>{tierCfg.emoji}</span>
              <span>{tierCfg.rarity}</span>
              <span>{'★'.repeat(tierCfg.stars)}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="px-4 pb-4 space-y-1.5">
            {[
              { label: 'ATK', value: baseAtk, max: 200 },
              { label: 'DEF', value: baseDef, max: 200 },
              { label: 'SPD', value: baseSpd, max: 200 },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/40 w-7">{stat.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${(stat.value / stat.max) * 100}%`,
                      background: `linear-gradient(90deg, ${elementCfg.color}88, ${elementCfg.color})`,
                    }} />
                </div>
                <span className="text-[10px] font-bold w-6 text-right" style={{ color: elementCfg.color }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Card footer */}
          <div className="border-t border-white/5 px-4 py-2 flex items-center justify-between">
            <span className="text-[9px] text-white/20 uppercase tracking-widest">PokePet Evolution Lab</span>
            <span className="text-[9px] text-white/20">No. {Math.floor(Math.random() * 900 + 100)}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer-move {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [phase, setPhase] = useState<Phase>('upload')
  const [petFile, setPetFile] = useState<File | null>(null)
  const [petPreviewUrl, setPetPreviewUrl] = useState<string | null>(null)
  const [element, setElement] = useState<Element | null>(null)
  const [result, setResult] = useState<EvolutionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      // Compress to max 1024px before sending — keeps payload small
      const base64 = await compressImage(petFile, 1024, 0.85)

      const res = await fetch('/api/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, element }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Evolution failed')

      // Synchronous — result is directly in the response
      setResult({ tier: data.tier, joKemonImageUrl: data.joKemonImageUrl })
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
    <div className="relative min-h-screen z-10">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <button onClick={handleReset} className="flex items-center gap-2 group">
          <span className="text-3xl group-hover:animate-[float_1s_ease-in-out_infinite]">🥚</span>
          <div>
            <div className="text-xl font-black tracking-tight text-white leading-none">POKE-PET</div>
            <div className="text-[10px] text-white/40 tracking-widest uppercase">AI Evolution Lab</div>
          </div>
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* Hero */}
        {phase === 'upload' && (
          <div className="text-center space-y-3 animate-[reveal_0.6s_ease-out]">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              Evolve Your <span className="shimmer-text">Pet</span>
            </h1>
            <p className="text-white/50 text-lg">
              Upload a photo → choose an element → collect your JokeMon card
            </p>
          </div>
        )}

        {/* Upload Zone */}
        {phase === 'upload' && (
          <div {...getRootProps()} className={`relative rounded-3xl border-2 border-dashed p-10 sm:p-16 text-center cursor-pointer transition-all duration-300
            ${isDragActive ? 'border-white/60 bg-white/10 scale-[1.02]' : 'border-white/20 bg-white/3 hover:border-white/40 hover:bg-white/5'}`}>
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="text-6xl animate-[float_3s_ease-in-out_infinite]">📸</div>
              <div>
                <p className="text-xl font-semibold text-white">
                  {isDragActive ? 'Drop your pet here!' : 'Upload your pet photo'}
                </p>
                <p className="text-white/40 text-sm mt-1">Drag & drop or tap to browse · JPG, PNG, WebP · Max 10 MB</p>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-white/20 transition-colors">
                <span>Choose Photo</span><span>→</span>
              </div>
            </div>
          </div>
        )}

        {/* Element Picker */}
        {phase === 'element' && (
          <div className="space-y-6 animate-[reveal_0.5s_ease-out]">
            {petPreviewUrl && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={petPreviewUrl} alt="Your pet" fill className="object-cover" />
                </div>
                <div>
                  <p className="text-white font-semibold">{petFile?.name ?? 'Your pet'}</p>
                  <button onClick={handleReset} className="text-xs text-white/40 hover:text-white/70 transition-colors">
                    ← Change photo
                  </button>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-black text-center mb-6">Choose Your Element</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['water', 'fire', 'wind'] as Element[]).map(el => (
                  <ElementCard key={el} element={el} selected={element === el} onClick={() => setElement(el)} />
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-400 text-sm text-center">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleEvolve}
              disabled={!element}
              className={`w-full py-5 rounded-2xl text-xl font-black tracking-wider uppercase transition-all duration-300
                ${element ? 'text-black cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
              style={element ? {
                background: `linear-gradient(135deg, ${ELEMENTS[element].color}, ${ELEMENTS[element].color}cc)`,
                boxShadow: `0 0 30px ${ELEMENTS[element].glowColor}`,
              } : {}}
            >
              {element ? `⚡ EVOLVE! ⚡` : 'Choose an element first'}
            </button>
          </div>
        )}

        {/* Evolving */}
        {phase === 'evolving' && element && (
          <div className="animate-[reveal_0.4s_ease-out]">
            <EvolvingState element={element} />
          </div>
        )}

        {/* Reveal — card style */}
        {phase === 'reveal' && result && element && (
          <div className="space-y-6 animate-[reveal_0.6s_ease-out]">

            <div className="text-center space-y-1">
              <p className="text-white/40 text-xs uppercase tracking-widest">Evolution Complete!</p>
              {result.tier === 'legendary' && (
                <p className="text-yellow-400 font-black text-lg animate-pulse">🎉 LEGENDARY! 🎉</p>
              )}
            </div>

            {/* THE CARD */}
            <JokeMonCard imageUrl={result.joKemonImageUrl} tier={result.tier} element={element} />

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <a href={result.joKemonImageUrl} download="my-jokemon.jpg" target="_blank" rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl font-semibold text-center transition-all hover:bg-white/10 border border-white/20 text-white/70 hover:text-white">
                ⬇ Download JokeMon
              </a>
              <button
                onClick={() => {
                  const tierCfg = TIERS[result.tier]
                  const elementCfg = ELEMENTS[element]
                  const text = `My pet just evolved into a ${tierCfg.rarity} ${elementCfg.label} JokeMon! ${tierCfg.emoji}\n\nCreate yours at PokePet!`
                  if (navigator.share) {
                    navigator.share({ title: 'My JokeMon Card!', text, url: window.location.href })
                  } else {
                    navigator.clipboard.writeText(text)
                    alert('Copied to clipboard!')
                  }
                }}
                className="w-full py-3 rounded-2xl font-semibold text-center transition-all hover:bg-white/10 border border-white/20 text-white/70 hover:text-white">
                📤 Share My JokeMon
              </button>
              <button onClick={handleReset}
                className="w-full py-3 rounded-2xl font-semibold text-center transition-all hover:bg-white/10 border border-white/20 text-white/50 hover:text-white text-sm">
                🔄 Evolve Another Pet
              </button>
            </div>
          </div>
        )}

        {/* Rarity Guide */}
        {phase === 'upload' && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-6 space-y-4">
            <h3 className="text-center text-sm font-bold text-white/60 uppercase tracking-widest">Evolution Rarity</h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(TIERS) as [EvolutionTier, typeof TIERS[EvolutionTier]][]).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: `${cfg.color}11`, border: `1px solid ${cfg.color}33` }}>
                  <span className="text-2xl">{cfg.emoji}</span>
                  <div>
                    <div className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.rarity}</div>
                    <div className="text-[10px] text-white/30">
                      {key === 'starter' ? '40' : key === 'evolved' ? '35' : key === 'champion' ? '18' : '7'}% chance
                    </div>
                  </div>
                  <span className="ml-auto text-xs" style={{ color: cfg.color }}>{'★'.repeat(cfg.stars)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-white/20 text-xs">
        Powered by fal.ai · Every evolution is unique
      </footer>
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
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(dataUrl.split(',')[1])
    }
    img.onerror = reject
    img.src = url
  })
}

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { ELEMENTS, TIERS, type Element, type EvolutionTier } from '@/lib/evolution'
import { uploadPetImage, saveEvolution } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase =
  | 'upload'       // awaiting pet photo
  | 'element'      // picking element
  | 'evolving'     // AI generating
  | 'reveal'       // showing result
  | 'animating'    // video generating
  | 'done'         // final state with video

interface EvolutionResult {
  tier: EvolutionTier
  joKemonImageUrl: string
  videoUrl?: string
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

function ElementCard({
  element,
  selected,
  onClick,
}: {
  element: Element
  selected: boolean
  onClick: () => void
}) {
  const cfg = ELEMENTS[element]
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer card-lift
        ${selected
          ? `border-2 scale-105 shadow-2xl ${cfg.bgFrom} bg-gradient-to-br ${cfg.bgTo}`
          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
        }
      `}
      style={selected ? { borderColor: cfg.color, boxShadow: `0 0 30px ${cfg.glowColor}` } : {}}
      aria-label={`Choose ${cfg.label} element`}
      aria-pressed={selected}
    >
      {selected && (
        <div
          className="absolute inset-0 rounded-2xl opacity-20"
          style={{ background: `radial-gradient(circle at center, ${cfg.color}, transparent 70%)` }}
        />
      )}
      <span className="text-5xl drop-shadow-lg">{cfg.emoji}</span>
      <span
        className="text-xl font-black tracking-widest"
        style={{ color: selected ? cfg.color : 'white' }}
      >
        {cfg.label}
      </span>
      <span className="text-xs text-white/50 text-center leading-snug">{cfg.description}</span>
      {selected && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-black"
          style={{ backgroundColor: cfg.color }}
        >
          ✓
        </div>
      )}
    </button>
  )
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: EvolutionTier }) {
  const cfg = TIERS[tier]
  const isLegendary = tier === 'legendary'
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm uppercase tracking-widest animate-[tier-pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards]`}
      style={{
        background: isLegendary
          ? 'linear-gradient(135deg, #fbbf24, #f97316, #fbbf24)'
          : `linear-gradient(135deg, ${cfg.color}33, ${cfg.color}66)`,
        border: `2px solid ${cfg.color}`,
        color: isLegendary ? '#000' : cfg.color,
        boxShadow: `0 0 20px ${cfg.glowColor}`,
      }}
    >
      <span>{cfg.emoji}</span>
      <span>{cfg.label}</span>
      <span>{'★'.repeat(cfg.stars)}</span>
    </div>
  )
}

// ─── Evolution Progress ───────────────────────────────────────────────────────

function EvolvingState({ element }: { element: Element }) {
  const cfg = ELEMENTS[element]
  const [dots, setDots] = useState(0)
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number }[]>([])

  useEffect(() => {
    const d = setInterval(() => setDots(n => (n + 1) % 4), 400)
    const p = setInterval(() => {
      setParticles(prev => [
        ...prev.slice(-8),
        { id: Date.now(), x: Math.random() * 80 + 10, delay: 0 },
      ])
    }, 300)
    return () => { clearInterval(d); clearInterval(p) }
  }, [])

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      {/* Spinning orb */}
      <div className="relative w-40 h-40">
        <div
          className="absolute inset-0 rounded-full opacity-30 animate-ping"
          style={{ background: cfg.color }}
        />
        <div
          className="absolute inset-4 rounded-full animate-[evolve-spin_1s_ease-in-out_infinite]"
          style={{
            background: `radial-gradient(circle, ${cfg.color}, transparent)`,
            boxShadow: `0 0 40px ${cfg.glowColor}`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-6xl animate-[float_3s_ease-in-out_infinite]">
          {cfg.emoji}
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-2xl font-black" style={{ color: cfg.color }}>
          EVOLVING{'.'.repeat(dots)}
        </p>
        <p className="text-white/50 text-sm">
          The fates are deciding your JokeMon's destiny
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-2 rounded-full bg-white/10 overflow-hidden relative">
        <div
          className="h-full rounded-full progress-shine relative"
          style={{
            background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
            animation: 'progress-fill 8s ease-in-out forwards',
            width: '0%',
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="relative w-64 h-16 overflow-hidden">
        {particles.map(p => (
          <Particle
            key={p.id}
            emoji={cfg.particle}
            style={{ left: `${p.x}%`, bottom: 0, animationDelay: `${p.delay}s` }}
          />
        ))}
      </div>

      <style>{`
        @keyframes progress-fill {
          0%   { width: 0%; }
          30%  { width: 40%; }
          60%  { width: 65%; }
          85%  { width: 85%; }
          100% { width: 95%; }
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
  const [videoLoading, setVideoLoading] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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
    maxSize: 10 * 1024 * 1024, // 10 MB
  })

  const handleEvolve = async () => {
    if (!petFile || !element) return
    setPhase('evolving')
    setError(null)

    try {
      const base64 = await fileToBase64(petFile)

      // Submit job
      const res = await fetch('/api/evolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, element }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Evolution failed')

      setResult({ tier: data.tier, joKemonImageUrl: data.joKemonImageUrl })
      setPhase('reveal')

      // Try to persist to Supabase (non-blocking)
      try {
        const petImageUrl = await uploadPetImage(petFile)
        await saveEvolution({
          element,
          tier: data.tier,
          pet_image_url: petImageUrl,
          joKemon_image_url: data.joKemonImageUrl,
        })
      } catch {
        // Supabase save is optional
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('element')
    }
  }

  const handleAnimate = async () => {
    if (!result || !element) return
    setVideoLoading(true)

    try {
      const res = await fetch('/api/animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joKemonImageUrl: result.joKemonImageUrl,
          element,
          tier: result.tier,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Animation failed')

      const videoUrl = await pollForResult(data.requestId, 'fal-ai/kling-video/v1.6/standard/image-to-video', 'videoUrl')

      setResult(prev => prev ? { ...prev, videoUrl } : prev)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video generation failed')
    } finally {
      setVideoLoading(false)
    }
  }

  const handleReset = () => {
    setPhase('upload')
    setPetFile(null)
    setPetPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    setElement(null)
    setResult(null)
    setError(null)
    setVideoLoading(false)
  }

  const tierCfg = result ? TIERS[result.tier] : null
  const elementCfg = element ? ELEMENTS[element] : null

  return (
    <div className="relative min-h-screen z-10">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <button onClick={handleReset} className="flex items-center gap-2 group">
          <span className="text-3xl group-hover:animate-[float_1s_ease-in-out_infinite]">🥚</span>
          <div>
            <div className="text-xl font-black tracking-tight text-white leading-none">POKE-PET</div>
            <div className="text-[10px] text-white/40 tracking-widest uppercase">AI Evolution Lab</div>
          </div>
        </button>
        <button
          onClick={() => setShowGallery(g => !g)}
          className="text-sm text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30"
        >
          🏆 Gallery
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* ── Hero ── */}
        {phase === 'upload' && (
          <div className="text-center space-y-3 animate-[reveal_0.6s_ease-out]">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              Evolve Your{' '}
              <span className="shimmer-text">Pet</span>
            </h1>
            <p className="text-white/50 text-lg">
              Upload a photo → choose an element → discover your JokeMon destiny
            </p>
          </div>
        )}

        {/* ── Upload Zone ── */}
        {phase === 'upload' && (
          <div
            {...getRootProps()}
            className={`
              relative rounded-3xl border-2 border-dashed p-10 sm:p-16 text-center cursor-pointer transition-all duration-300
              ${isDragActive
                ? 'border-white/60 bg-white/10 scale-[1.02]'
                : 'border-white/20 bg-white/3 hover:border-white/40 hover:bg-white/5'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="text-6xl animate-[float_3s_ease-in-out_infinite]">📸</div>
              <div>
                <p className="text-xl font-semibold text-white">
                  {isDragActive ? 'Drop your pet here!' : 'Upload your pet photo'}
                </p>
                <p className="text-white/40 text-sm mt-1">
                  Drag & drop or tap to browse · JPG, PNG, WebP · Max 10 MB
                </p>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-white/20 transition-colors">
                <span>Choose Photo</span>
                <span>→</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Element Picker ── */}
        {(phase === 'element') && (
          <div className="space-y-6 animate-[reveal_0.5s_ease-out]">
            {/* Pet preview */}
            {petPreviewUrl && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={petPreviewUrl} alt="Your pet" fill className="object-cover" />
                </div>
                <div>
                  <p className="text-white font-semibold">{petFile?.name ?? 'Your pet'}</p>
                  <button
                    onClick={handleReset}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    ← Change photo
                  </button>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-black text-center mb-6">Choose Your Element</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['water', 'fire', 'wind'] as Element[]).map(el => (
                  <ElementCard
                    key={el}
                    element={el}
                    selected={element === el}
                    onClick={() => setElement(el)}
                  />
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
              className={`
                w-full py-5 rounded-2xl text-xl font-black tracking-wider uppercase transition-all duration-300 relative overflow-hidden
                ${element
                  ? 'text-black cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }
              `}
              style={element ? {
                background: `linear-gradient(135deg, ${ELEMENTS[element].color}, ${ELEMENTS[element].color}cc)`,
                boxShadow: `0 0 30px ${ELEMENTS[element].glowColor}`,
              } : {}}
            >
              {element ? `⚡ EVOLVE! ⚡` : 'Choose an element first'}
            </button>
          </div>
        )}

        {/* ── Evolving State ── */}
        {phase === 'evolving' && element && (
          <div className="animate-[reveal_0.4s_ease-out]">
            <EvolvingState element={element} />
          </div>
        )}

        {/* ── Reveal / Done ── */}
        {(phase === 'reveal' || phase === 'done' || phase === 'animating') && result && element && tierCfg && elementCfg && (
          <div className="space-y-6 animate-[reveal_0.6s_ease-out]">

            {/* Tier announcement */}
            <div className="text-center space-y-2">
              <p className="text-white/50 text-sm uppercase tracking-widest">Evolution Complete!</p>
              <div className="flex justify-center">
                <TierBadge tier={result.tier} />
              </div>
              {result.tier === 'legendary' && (
                <p className="text-yellow-400 font-black text-lg animate-[pulse_1s_ease-in-out_infinite]">
                  🎉 HOLY SMOKES — A LEGENDARY! 🎉
                </p>
              )}
            </div>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-center text-xs text-white/40 uppercase tracking-widest">Before</p>
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10">
                  {petPreviewUrl && (
                    <Image src={petPreviewUrl} alt="Original pet" fill className="object-cover" />
                  )}
                </div>
                <p className="text-center text-xs text-white/30">Your Pet</p>
              </div>
              <div className="space-y-2">
                <p className="text-center text-xs text-white/40 uppercase tracking-widest">After</p>
                <div
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 ${result.tier === 'legendary' ? 'glow-legendary' : ''}`}
                  style={{
                    borderColor: tierCfg.color,
                    boxShadow: result.tier !== 'legendary' ? `0 0 20px ${tierCfg.glowColor}` : undefined,
                  }}
                >
                  <Image
                    src={result.joKemonImageUrl}
                    alt="Your JokeMon"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-center text-xs font-semibold" style={{ color: elementCfg.color }}>
                  {elementCfg.emoji} {elementCfg.label} JokeMon
                </p>
              </div>
            </div>

            {/* Video result */}
            {result.videoUrl && (
              <div className="space-y-2">
                <p className="text-center text-xs text-white/40 uppercase tracking-widest">Evolution Video</p>
                <video
                  src={result.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="w-full rounded-2xl border-2"
                  style={{ borderColor: tierCfg.color }}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              {/* Animate button */}
              {!result.videoUrl && (
                <button
                  onClick={handleAnimate}
                  disabled={videoLoading}
                  className="w-full py-4 rounded-2xl font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2"
                  style={{
                    background: videoLoading
                      ? 'rgba(255,255,255,0.1)'
                      : `linear-gradient(135deg, ${elementCfg.color}44, ${elementCfg.color}22)`,
                    border: `2px solid ${elementCfg.color}`,
                    color: videoLoading ? 'rgba(255,255,255,0.3)' : elementCfg.color,
                  }}
                >
                  {videoLoading ? (
                    <>
                      <span className="animate-spin">⚡</span>
                      Generating Evolution Video...
                    </>
                  ) : (
                    <>🎬 Animate Evolution Video</>
                  )}
                </button>
              )}

              {/* Download */}
              <a
                href={result.joKemonImageUrl}
                download="my-jokemon.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl font-semibold text-center transition-all hover:bg-white/10 border border-white/20 text-white/70 hover:text-white"
              >
                ⬇ Download JokeMon Image
              </a>

              {/* Share */}
              <button
                onClick={() => {
                  const text = `My pet just evolved into a ${tierCfg.rarity} ${elementCfg.label} JokeMon! ${tierCfg.emoji}\n\nCreate yours at PokePet!`
                  if (navigator.share) {
                    navigator.share({ title: 'My JokeMon!', text, url: window.location.href })
                  } else {
                    navigator.clipboard.writeText(text)
                    alert('Copied to clipboard!')
                  }
                }}
                className="w-full py-3 rounded-2xl font-semibold text-center transition-all hover:bg-white/10 border border-white/20 text-white/70 hover:text-white"
              >
                📤 Share My JokeMon
              </button>

              {error && (
                <div className="p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-400 text-sm text-center">
                  ⚠️ {error}
                </div>
              )}

              {/* Evolve again */}
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-2xl font-semibold text-center transition-all hover:bg-white/10 border border-white/20 text-white/50 hover:text-white text-sm"
              >
                🔄 Evolve Another Pet
              </button>
            </div>
          </div>
        )}

        {/* ── Rarity Guide ── */}
        {phase === 'upload' && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-6 space-y-4">
            <h3 className="text-center text-sm font-bold text-white/60 uppercase tracking-widest">
              Evolution Rarity
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(TIERS) as [EvolutionTier, typeof TIERS[EvolutionTier]][]).map(([key, cfg]) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: `${cfg.color}11`, border: `1px solid ${cfg.color}33` }}
                >
                  <span className="text-2xl">{cfg.emoji}</span>
                  <div>
                    <div className="text-xs font-bold" style={{ color: cfg.color }}>
                      {cfg.rarity}
                    </div>
                    <div className="text-[10px] text-white/30">
                      {Math.round(
                        key === 'starter' ? cfg.chance * 100
                        : key === 'evolved' ? (cfg.chance - TIERS.starter.chance) * 100
                        : key === 'champion' ? (cfg.chance - TIERS.evolved.chance) * 100
                        : (1 - TIERS.champion.chance) * 100
                      )}% chance
                    </div>
                  </div>
                  <span className="ml-auto text-xs" style={{ color: cfg.color }}>
                    {'★'.repeat(cfg.stars)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-8 text-white/20 text-xs">
        Powered by fal.ai · Every evolution is unique
      </footer>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function pollForResult(requestId: string, model: string, resultKey: 'imageUrl' | 'videoUrl'): Promise<string> {
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const res = await fetch(`/api/status?requestId=${requestId}&model=${encodeURIComponent(model)}`)
    if (!res.ok) continue
    const data = await res.json()
    if (data.status === 'COMPLETED') {
      const url = data[resultKey]
      if (url) return url
      throw new Error('No result URL in completed response')
    }
    if (data.status === 'FAILED') throw new Error(data.error ?? 'Generation failed')
  }
  throw new Error('Timed out waiting for result')
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Strip data URI prefix: "data:image/jpeg;base64,"
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
  })
}

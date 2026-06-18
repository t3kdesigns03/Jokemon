'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Sparkles, Environment, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import type { CollectionCard } from '@/lib/collection'
import { TIERS, ELEMENTS } from '@/lib/evolution'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => res(img)
    img.onerror = rej
    img.src = url
  })
}

// ─── Full card → canvas texture ───────────────────────────────────────────────

async function buildCardTexture(card: CollectionCard): Promise<THREE.CanvasTexture> {
  const W = 512, H = 716
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  const tier = card.tier
  const el = card.element

  // ── Background ──
  const bgGrad: Record<string, [string, string]> = {
    starter:   ['#111827', '#1f2937'],
    evolved:   ['#0f172a', '#1e293b'],
    champion:  ['#0d0618', '#1a0533'],
    legendary: ['#1a0a00', '#2d1400'],
  }
  const [c1, c2] = bgGrad[tier]
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, c1); bg.addColorStop(1, c2)
  rRect(ctx, 0, 0, W, H, 22); ctx.fillStyle = bg; ctx.fill()

  // ── Outer border ──
  const borderCol: Record<string, string> = {
    starter: '#374151', evolved: '#94a3b8', champion: '#a855f7', legendary: '#fbbf24',
  }
  rRect(ctx, 2, 2, W - 4, H - 4, 21)
  ctx.strokeStyle = borderCol[tier]
  ctx.lineWidth = tier === 'legendary' ? 5 : tier === 'champion' ? 4 : 2.5
  ctx.stroke()

  // ── Legendary rainbow border shimmer (static gradient) ──
  if (tier === 'legendary') {
    const rainGrad = ctx.createLinearGradient(0, 0, W, H)
    rainGrad.addColorStop(0,    'rgba(255,0,128,0.6)')
    rainGrad.addColorStop(0.25, 'rgba(255,200,0,0.6)')
    rainGrad.addColorStop(0.5,  'rgba(0,255,128,0.6)')
    rainGrad.addColorStop(0.75, 'rgba(0,128,255,0.6)')
    rainGrad.addColorStop(1,    'rgba(255,0,128,0.6)')
    rRect(ctx, 2, 2, W - 4, H - 4, 21)
    ctx.strokeStyle = rainGrad; ctx.lineWidth = 4; ctx.stroke()
  }

  // ── Header bar ──
  const hdrCol: Record<string, string> = {
    starter: 'rgba(55,65,81,0.5)', evolved: 'rgba(148,163,184,0.1)',
    champion: 'rgba(168,85,247,0.22)', legendary: 'rgba(251,191,36,0.22)',
  }
  rRect(ctx, 3, 3, W - 6, 62, 19)
  ctx.fillStyle = hdrCol[tier]; ctx.fill()

  // ── Element emoji + label ──
  const elCol: Record<string, { color: string; emoji: string; label: string }> = {
    water: { color: '#0ea5e9', emoji: '💧', label: 'WATER TYPE' },
    fire:  { color: '#f97316', emoji: '🔥', label: 'FIRE TYPE'  },
    wind:  { color: '#22c55e', emoji: '🌪️', label: 'WIND TYPE'  },
  }
  const elD = elCol[el]
  ctx.font = 'bold 18px Arial, sans-serif'
  ctx.fillStyle = elD.color
  ctx.textAlign = 'left'
  ctx.fillText(`${elD.emoji} ${elD.label}`, 18, 40)

  // ── HP ──
  const tierCol: Record<string, string> = {
    starter: '#94a3b8', evolved: '#38bdf8', champion: '#a855f7', legendary: '#fbbf24',
  }
  ctx.fillStyle = tierCol[tier]
  ctx.font = 'bold 26px Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`HP  ${card.hp}`, W - 16, 41)

  // ── Pet name ──
  const nameCol: Record<string, string> = {
    starter: 'rgba(255,255,255,0.8)', evolved: '#e2e8f0',
    champion: '#e9d5ff', legendary: '#fbbf24',
  }
  ctx.textAlign = 'center'
  ctx.font = 'bold 34px Arial, sans-serif'
  ctx.fillStyle = nameCol[tier]
  if (tier === 'legendary') {
    ctx.shadowColor = 'rgba(251,191,36,0.7)'; ctx.shadowBlur = 14
  } else if (tier === 'champion') {
    ctx.shadowColor = 'rgba(168,85,247,0.7)'; ctx.shadowBlur = 10
  }
  ctx.fillText((card.petName || 'Fluffy').toUpperCase(), W / 2, 97)
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

  // ── Image ──
  const imgX = 18, imgY = 110, imgW = W - 36, imgH = imgW   // square
  ctx.fillStyle = '#000'
  rRect(ctx, imgX, imgY, imgW, imgH, 13); ctx.fill()

  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(card.joKemonImageUrl)}`
    const img = await loadImg(proxyUrl)
    ctx.save()
    rRect(ctx, imgX, imgY, imgW, imgH, 13); ctx.clip()

    // Boost artwork contrast/saturation for Rare+ — baked into the texture
    // so the Three.js card looks premium even without real-time CSS filters
    if (tier === 'legendary') ctx.filter = 'contrast(1.18) saturate(1.7) brightness(1.07)'
    else if (tier === 'champion') ctx.filter = 'contrast(1.13) saturate(1.5) brightness(1.04)'
    else if (tier === 'evolved') ctx.filter = 'contrast(1.08) saturate(1.25)'

    ctx.drawImage(img, imgX, imgY, imgW, imgH)
    ctx.filter = 'none'

    // ── Holo dot-grid overlay (Rare+) ─────────────────────────────────────
    // Classic TCG reverse-holo: fine dot grid baked onto the illustration.
    // The Three.js iridescence material animates on top, so this texture is
    // the "substrate" that makes the holo feel physically embedded in the art.
    if (tier !== 'starter') {
      const dotSpacing = tier === 'legendary' ? 7 : tier === 'champion' ? 8 : 10
      const dotAlpha   = tier === 'legendary' ? 0.22 : tier === 'champion' ? 0.18 : 0.12
      const dotColor   = tier === 'legendary' ? `rgba(251,191,36,${dotAlpha})`
                       : tier === 'champion'  ? `rgba(168,85,247,${dotAlpha})`
                       :                        `rgba(180,210,255,${dotAlpha})`

      for (let dx = imgX + dotSpacing / 2; dx < imgX + imgW; dx += dotSpacing) {
        for (let dy = imgY + dotSpacing / 2; dy < imgY + imgH; dy += dotSpacing) {
          ctx.beginPath()
          ctx.arc(dx, dy, 0.9, 0, Math.PI * 2)
          ctx.fillStyle = dotColor
          ctx.fill()
        }
      }

      // Rainbow shimmer gradient baked at a static 135° angle.
      // The Three.js Fresnel iridescence material makes it shift dynamically.
      const shimmerOp = tier === 'legendary' ? 0.28 : tier === 'champion' ? 0.20 : 0.10
      const shimGrad = ctx.createLinearGradient(imgX, imgY, imgX + imgW, imgY + imgH)
      shimGrad.addColorStop(0,    `rgba(255,0,128,${shimmerOp})`)
      shimGrad.addColorStop(0.18, `rgba(255,165,0,${shimmerOp})`)
      shimGrad.addColorStop(0.36, `rgba(255,255,0,${shimmerOp})`)
      shimGrad.addColorStop(0.54, `rgba(0,255,128,${shimmerOp})`)
      shimGrad.addColorStop(0.72, `rgba(0,128,255,${shimmerOp})`)
      shimGrad.addColorStop(0.90, `rgba(128,0,255,${shimmerOp})`)
      shimGrad.addColorStop(1,    `rgba(255,0,128,${shimmerOp})`)
      ctx.globalCompositeOperation = 'color-dodge'
      ctx.fillStyle = shimGrad
      ctx.fillRect(imgX, imgY, imgW, imgH)
      ctx.globalCompositeOperation = 'source-over'

      // Legendary: extra gold inner glow along illustration edges
      if (tier === 'legendary') {
        const edgeGlow = ctx.createRadialGradient(
          imgX + imgW / 2, imgY + imgH / 2, imgW * 0.3,
          imgX + imgW / 2, imgY + imgH / 2, imgW * 0.62
        )
        edgeGlow.addColorStop(0, 'transparent')
        edgeGlow.addColorStop(1, 'rgba(251,191,36,0.18)')
        ctx.fillStyle = edgeGlow
        ctx.fillRect(imgX, imgY, imgW, imgH)
      }
    }

    ctx.restore()
  } catch {
    ctx.font = '80px serif'; ctx.textAlign = 'center'
    ctx.fillStyle = elD.color
    ctx.fillText(elD.emoji, W / 2, imgY + imgH / 2 + 28)
  }

  // ── Image border ──
  const imgBorder: Record<string, string> = {
    starter: '#374151', evolved: 'rgba(148,163,184,0.5)',
    champion: 'rgba(168,85,247,0.65)', legendary: 'rgba(251,191,36,0.75)',
  }
  rRect(ctx, imgX, imgY, imgW, imgH, 13)
  ctx.strokeStyle = imgBorder[tier]; ctx.lineWidth = 2.5; ctx.stroke()

  // ── Rarity badge ──
  const badgeY = imgY + imgH + 14
  const badgeH = 34, badgeW = 210
  const badgeX = W / 2 - badgeW / 2
  const badgeDefs: Record<string, { fill: string; stroke: string; text: string; label: string }> = {
    starter:   { fill: '#1f2937',  stroke: '#4b5563', text: '#9ca3af', label: '✨  COMMON  ★'       },
    evolved:   { fill: '#1e293b',  stroke: '#94a3b8', text: '#e2e8f0', label: '💫  RARE  ★★'        },
    champion:  { fill: '#4c1d95',  stroke: '#c084fc', text: '#f3e8ff', label: '⚡  EPIC  ★★★'       },
    legendary: { fill: '#92400e',  stroke: '#fbbf24', text: '#000',    label: '👑  LEGENDARY  ★★★★' },
  }
  const bd = badgeDefs[tier]
  rRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2)
  ctx.fillStyle = bd.fill; ctx.fill()
  ctx.strokeStyle = bd.stroke; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.fillStyle = bd.text
  ctx.font = 'bold 14px Arial, sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(bd.label, W / 2, badgeY + badgeH / 2 + 5)

  // ── Stats ──
  const statsStartY = badgeY + badgeH + 14
  const statLabels = ['ATK', 'DEF', 'SPD']
  const statVals   = [card.atk, card.def, card.spd]
  const maxStat    = tier === 'legendary' ? 200 : tier === 'champion' ? 130 : tier === 'evolved' ? 90 : 60

  statLabels.forEach((lbl, i) => {
    const sy = statsStartY + i * 30
    const pct = Math.min(1, statVals[i] / maxStat)

    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = 'bold 13px Arial, sans-serif'; ctx.textAlign = 'left'
    ctx.fillText(lbl, 18, sy + 12)

    // bar bg
    rRect(ctx, 56, sy + 2, W - 88, 10, 5)
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill()

    // bar fill
    const fg = ctx.createLinearGradient(56, sy, 56 + (W - 88) * pct, sy)
    fg.addColorStop(0, tierCol[tier] + '77'); fg.addColorStop(1, tierCol[tier])
    rRect(ctx, 56, sy + 2, Math.max(8, (W - 88) * pct), 10, 5)
    ctx.fillStyle = fg; ctx.fill()

    // value
    ctx.fillStyle = tierCol[tier]
    ctx.font = 'bold 13px Arial, sans-serif'; ctx.textAlign = 'right'
    ctx.fillText(String(statVals[i]), W - 14, sy + 13)
  })

  // ── Footer ──
  const footY = H - 32
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  ctx.fillRect(0, footY, W, 32)
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.font = '11px Arial, sans-serif'; ctx.textAlign = 'left'
  ctx.fillText('POKEPET LAB', 18, footY + 20)
  ctx.textAlign = 'right'
  ctx.fillText(`No. ${String(card.cardNumber).padStart(3, '0')}`, W - 18, footY + 20)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// ─── Simple procedural card back ─────────────────────────────────────────────

function buildBackTexture(tier: string): THREE.CanvasTexture {
  const W = 256, H = 358
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#0a0a14'
  rRect(ctx, 0, 0, W, H, 16); ctx.fill()

  const col = { starter:'#374151', evolved:'#38bdf8', champion:'#a855f7', legendary:'#fbbf24' }[tier]!
  rRect(ctx, 2, 2, W - 4, H - 4, 15)
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke()

  // Grid pattern
  ctx.strokeStyle = `${col}22`; ctx.lineWidth = 1
  for (let x = 16; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke() }
  for (let y = 16; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() }

  ctx.font = '56px serif'; ctx.textAlign = 'center'; ctx.fillText('🥚', W/2, H/2 - 10)
  ctx.font = 'bold 16px Arial, sans-serif'; ctx.fillStyle = col
  ctx.fillText('POKE-PET', W/2, H/2 + 28)
  ctx.font = '11px Arial, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillText('EVOLUTION LAB', W/2, H/2 + 46)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// ─── Holo material — Fresnel-based rotation reaction ─────────────────────────

interface HoloProps {
  texture: THREE.CanvasTexture
  tier: string
  meshRef: React.RefObject<THREE.Mesh>
}

function HoloMaterial({ texture, tier, meshRef }: HoloProps) {
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null)
  // Holo strength per tier — increase these to make foil more dramatic
  const strength = { starter: 0, evolved: 0.45, champion: 0.88, legendary: 1.0 }[tier] ?? 0

  useFrame(({ camera }) => {
    if (!matRef.current || !meshRef.current || strength === 0) return
    const normal  = new THREE.Vector3(0, 0, 1).applyQuaternion(meshRef.current.quaternion)
    const toCam   = camera.position.clone().sub(meshRef.current.position).normalize()
    const dot     = Math.abs(normal.dot(toCam)) // 1 = face-on, 0 = edge-on
    // Fresnel: peaks at oblique view angles (like real TCG foil)
    // Exponent: higher = sharper falloff. 1.5 = wide holo zone, 2.5 = narrow peak
    const fresnel = Math.pow(1 - dot, 1.5)

    matRef.current.iridescence               = fresnel * strength
    // IOR range: 1.1 (subtle) → 2.2 (strong rainbow). Increase max for wilder color shifts
    matRef.current.iridescenceIOR            = 1.15 + fresnel * 1.05
    // Thickness range drives which colors show. Wider range = more color variety
    matRef.current.iridescenceThicknessRange = [60 + fresnel * 180, 300 + fresnel * 450]

    if (tier === 'legendary') {
      // Gold emissive glows stronger when seen at an angle
      matRef.current.emissiveIntensity = 0.08 + fresnel * 0.14
    } else if (tier === 'champion') {
      matRef.current.emissiveIntensity = 0.04 + fresnel * 0.08
    }
  })

  return (
    <meshPhysicalMaterial
      ref={matRef}
      map={texture}
      roughness={0.03}      // Lower = more mirror-like surface
      metalness={0.0}
      clearcoat={1.0}       // Full clearcoat = glass-like top coat (like real card laminate)
      clearcoatRoughness={0.03}
      iridescence={0}
      iridescenceIOR={1.5}
      iridescenceThicknessRange={[100, 400]}
      emissive={new THREE.Color(
        tier === 'legendary' ? '#fbbf24' :
        tier === 'champion'  ? '#a855f7' : '#000000'
      )}
      emissiveIntensity={0.06}
      // Higher envMapIntensity = more reflective (environment map reflections)
      envMapIntensity={tier === 'legendary' ? 2.4 : tier === 'champion' ? 1.5 : tier === 'evolved' ? 0.8 : 0.4}
    />
  )
}

// ─── Rarity light rig ─────────────────────────────────────────────────────────

function RarityLights({ tier, element }: { tier: string; element: string }) {
  const elColor = ELEMENTS[element as keyof typeof ELEMENTS].color
  const rarityColor = TIERS[tier as keyof typeof TIERS].color
  const intensity = { starter: 0.5, evolved: 1.0, champion: 2.2, legendary: 3.5 }[tier] ?? 1

  return (
    <>
      <pointLight color={elColor}     intensity={intensity}       position={[0, 0, 2.5]}  distance={7} />
      <pointLight color={rarityColor} intensity={intensity * 0.8} position={[2.5, -1, 1]} distance={6} />
      <pointLight color={rarityColor} intensity={intensity * 0.5} position={[-2, 2, 1]}   distance={5} />
      {tier === 'legendary' && (
        <>
          <pointLight color="#fbbf24" intensity={2} position={[0, 3, 0]}    distance={6} />
          <pointLight color="#f472b6" intensity={1} position={[-3, -2, 1]}  distance={5} />
        </>
      )}
    </>
  )
}

// ─── Card mesh ────────────────────────────────────────────────────────────────

function Card3DMesh({ card }: { card: CollectionCard }) {
  const [frontTex, setFrontTex] = useState<THREE.CanvasTexture | null>(null)
  const [backTex]  = useState(() => buildBackTexture(card.tier))
  const groupRef   = useRef<THREE.Group>(null)
  const frontMesh  = useRef<THREE.Mesh>(null)
  const tierCfg    = TIERS[card.tier as keyof typeof TIERS]
  const elCfg      = ELEMENTS[card.element as keyof typeof ELEMENTS]
  const thickness  = 0.026

  useEffect(() => {
    let disposed = false
    buildCardTexture(card).then(tex => { if (!disposed) setFrontTex(tex) })
    return () => { disposed = true; frontTex?.dispose() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id])

  // Gentle idle float
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.7) * 0.05
  })

  const rarityColor = new THREE.Color(tierCfg.color)

  return (
    <group ref={groupRef}>
      {/* Front face */}
      {frontTex && (
        <mesh ref={frontMesh} position={[0, 0, thickness / 2]}>
          <planeGeometry args={[2, 2.8]} />
          <HoloMaterial texture={frontTex} tier={card.tier} meshRef={frontMesh} />
        </mesh>
      )}

      {/* Back face */}
      <mesh position={[0, 0, -thickness / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2, 2.8]} />
        <meshStandardMaterial map={backTex} roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Card edge */}
      <RoundedBox args={[2.01, 2.81, thickness]} radius={0.016} smoothness={3}>
        <meshStandardMaterial
          color={rarityColor}
          roughness={0.15}
          metalness={card.tier === 'legendary' ? 0.9 : 0.5}
          emissive={rarityColor}
          emissiveIntensity={card.tier === 'legendary' ? 0.4 : card.tier === 'champion' ? 0.2 : 0.05}
        />
      </RoundedBox>

      {/* Rarity particle fx */}
      {/* Evolved gets subtle silver sparkles; Epic/Legendary get heavier particles */}
      {card.tier === 'evolved' && (
        <Sparkles count={12} scale={[2.6, 3.6, 1.5]} size={1.4} speed={0.2}
          color="#94a3b8" opacity={0.55} />
      )}
      {card.tier === 'champion' && (
        <Sparkles count={45} scale={[3.4, 4.6, 2]} size={3.2} speed={0.4}
          color="#a855f7" opacity={0.9} />
      )}
      {card.tier === 'legendary' && (
        <>
          {/* Primary gold particles */}
          <Sparkles count={80} scale={[3.6, 5.0, 2.2]} size={5.0} speed={0.45}
            color="#fbbf24" opacity={1.0} />
          {/* Secondary orange/pink scatter for depth */}
          <Sparkles count={30} scale={[4.0, 5.5, 2.5]} size={2.5} speed={0.25}
            color="#f97316" opacity={0.7} />
        </>
      )}

      {/* Lights */}
      <RarityLights tier={card.tier} element={card.element} />
    </group>
  )
}

// ─── Progress overlay ─────────────────────────────────────────────────────────

function LoadOverlay({ card }: { card: CollectionCard }) {
  const { progress } = useProgress()
  const elCfg = ELEMENTS[card.element as keyof typeof ELEMENTS]
  return (
    <Html center>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 48 }}>{elCfg.emoji}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          {progress < 100 ? `${Math.round(progress)}%` : 'Rendering card…'}
        </div>
      </div>
    </Html>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Card3DViewer({ card, onClose }: { card: CollectionCard; onClose: () => void }) {
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const cfg = TIERS[card.tier as keyof typeof TIERS]
  const displayName = (card.petName || 'Fluffy').toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #000 100%)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.14em', margin: 0 }}>
            3D CARD VIEWER
          </p>
          <p style={{ fontSize: 17, fontWeight: 900, color: cfg.color, margin: '2px 0 0', letterSpacing: '0.05em' }}>
            {displayName}
            <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>
              {cfg.rarity}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            {isMobile ? 'Drag · Pinch to zoom' : 'Drag · Scroll to zoom'}
          </span>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.08, background: 'rgba(255,255,255,0.12)' }}
            whileTap={{ scale: 0.93 }}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 8, color: 'white',
              padding: '7px 14px', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
            }}
          >
            ✕ Close
          </motion.button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <Canvas
          camera={{ position: [0, 0, 4.6], fov: 40 }}
          dpr={[1, isMobile ? 1.5 : 2]}
          gl={{ antialias: !isMobile, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={<LoadOverlay card={card} />}>
            <ambientLight intensity={0.55} />
            <directionalLight position={[3, 4, 3]}  intensity={1.5} />
            <directionalLight position={[-3, -2, 2]} intensity={0.5} color="#8080ff" />
            <Environment preset={card.tier === 'legendary' ? 'sunset' : 'city'} />
            <Card3DMesh card={card} />
            <OrbitControls
              enableZoom
              enablePan={false}
              minDistance={2.8}
              maxDistance={8}
              dampingFactor={0.1}
              enableDamping
              autoRotate
              autoRotateSpeed={isMobile ? 0.6 : 0.4}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* ── Stats bar ── */}
      <div style={{
        flexShrink: 0,
        padding: '12px 20px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex', justifyContent: 'center', gap: 36, alignItems: 'center',
      }}>
        {([['HP', card.hp], ['ATK', card.atk], ['DEF', card.def], ['SPD', card.spd]] as [string, number][]).map(([lbl, val]) => (
          <div key={lbl} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: cfg.color }}>{val}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{lbl}</div>
          </div>
        ))}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>
            {ELEMENTS[card.element as keyof typeof ELEMENTS].emoji}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {ELEMENTS[card.element as keyof typeof ELEMENTS].label}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

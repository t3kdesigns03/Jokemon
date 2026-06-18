'use client'

import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Sparkles, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { TextureLoader } from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import type { CollectionCard } from '@/lib/collection'
import { TIERS, ELEMENTS } from '@/lib/evolution'

interface Card3DViewerProps {
  card: CollectionCard
  onClose: () => void
}

// ─── Holo shader material for Epic/Legendary ──────────────────────────────────

function HoloMaterial({ map, tier }: { map: THREE.Texture; tier: string }) {
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const clock = useRef(0)

  useFrame((_, delta) => {
    if (!matRef.current) return
    clock.current += delta
    if (tier === 'legendary') {
      matRef.current.iridescence = 0.5 + Math.sin(clock.current * 1.5) * 0.5
      matRef.current.iridescenceIOR = 1.3 + Math.sin(clock.current * 0.8) * 0.3
    } else if (tier === 'champion') {
      matRef.current.iridescence = 0.3 + Math.sin(clock.current * 2) * 0.3
    }
  })

  return (
    <meshPhysicalMaterial
      ref={matRef}
      map={map}
      roughness={tier === 'legendary' ? 0.05 : tier === 'champion' ? 0.1 : 0.4}
      metalness={tier === 'legendary' ? 0.6 : tier === 'champion' ? 0.3 : 0.0}
      iridescence={tier === 'legendary' ? 0.8 : tier === 'champion' ? 0.4 : 0.0}
      iridescenceIOR={1.5}
      iridescenceThicknessRange={[100, 400]}
      clearcoat={tier === 'legendary' ? 1.0 : 0.5}
      clearcoatRoughness={0.1}
      envMapIntensity={tier === 'legendary' ? 2 : 1}
    />
  )
}

// ─── Card 3D Mesh ─────────────────────────────────────────────────────────────

function Card3DMesh({ card }: { card: CollectionCard }) {
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(card.joKemonImageUrl)}`
  const texture = useLoader(TextureLoader, proxyUrl)
  const groupRef = useRef<THREE.Group>(null)
  const cfg = TIERS[card.tier]
  const elCfg = ELEMENTS[card.element]

  // Gentle idle rotation when not being dragged
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.4) * 0.15
    groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.05
  })

  const elementColor = new THREE.Color(elCfg.color)
  const rarityColor = new THREE.Color(cfg.color)

  return (
    <group ref={groupRef}>
      {/* Card body — thin rounded box */}
      <RoundedBox args={[2, 2.8, 0.04]} radius={0.06} smoothness={4}>
        <HoloMaterial map={texture} tier={card.tier} />
      </RoundedBox>

      {/* Card edge glow */}
      <RoundedBox args={[2.04, 2.84, 0.03]} radius={0.07} smoothness={4}>
        <meshBasicMaterial
          color={rarityColor}
          transparent
          opacity={card.tier === 'legendary' ? 0.8 : card.tier === 'champion' ? 0.5 : 0.15}
          side={THREE.BackSide}
        />
      </RoundedBox>

      {/* Element-colored point light */}
      <pointLight
        color={elementColor}
        intensity={card.tier === 'legendary' ? 3 : card.tier === 'champion' ? 2 : 0.8}
        distance={5}
        position={[0, 0, 1.5]}
      />

      {/* Rarity-colored rim light */}
      <pointLight
        color={rarityColor}
        intensity={card.tier === 'legendary' ? 4 : card.tier === 'champion' ? 2 : 0}
        distance={4}
        position={[0, -2, 0]}
      />

      {/* Legendary/Epic sparkle particles */}
      {(card.tier === 'legendary' || card.tier === 'champion') && (
        <Sparkles
          count={card.tier === 'legendary' ? 80 : 40}
          scale={[3, 4, 2]}
          size={card.tier === 'legendary' ? 3 : 2}
          speed={0.4}
          color={card.tier === 'legendary' ? '#fbbf24' : '#a855f7'}
          opacity={0.7}
        />
      )}
    </group>
  )
}

// ─── Loading fallback ─────────────────────────────────────────────────────────

function CardLoader({ card }: { card: CollectionCard }) {
  const elCfg = ELEMENTS[card.element]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <motion.div
        animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: 48 }}
      >
        {elCfg.emoji}
      </motion.div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading 3D viewer…</p>
    </div>
  )
}

// ─── Main exported component ─────────────────────────────────────────────────

export default function Card3DViewer({ card, onClose }: Card3DViewerProps) {
  const cfg = TIERS[card.tier]
  const displayName = (card.petName || 'Fluffy').toUpperCase()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
              3D Viewer
            </p>
            <p style={{ fontSize: 18, fontWeight: 900, color: cfg.color, margin: '2px 0 0' }}>
              {displayName}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              Drag to rotate · Pinch to zoom
            </p>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, color: 'white', padding: '8px 14px', cursor: 'pointer',
                fontSize: 14, fontWeight: 700,
              }}
            >
              ✕ Close
            </motion.button>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Suspense fallback={
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardLoader card={card} />
            </div>
          }>
            <Canvas
              camera={{ position: [0, 0, 4], fov: 45 }}
              style={{ background: 'transparent' }}
              gl={{ antialias: true, alpha: true }}
            >
              {/* Ambient + environment */}
              <ambientLight intensity={0.4} />
              <directionalLight position={[3, 3, 3]} intensity={1.2} />
              <directionalLight position={[-3, -2, 2]} intensity={0.4} color="#a0a0ff" />
              <Environment preset="city" />

              {/* The card */}
              <Card3DMesh card={card} />

              {/* Controls — enable pinch zoom and drag rotate */}
              <OrbitControls
                enableZoom
                enablePan={false}
                minDistance={2.5}
                maxDistance={7}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={(3 * Math.PI) / 4}
                autoRotate={false}
                dampingFactor={0.08}
                enableDamping
              />
            </Canvas>
          </Suspense>
        </div>

        {/* Stats footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'center', gap: 32,
        }}>
          {[['HP', card.hp], ['ATK', card.atk], ['DEF', card.def], ['SPD', card.spd]].map(([label, val]) => (
            <div key={label as string} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: cfg.color }}>{val}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

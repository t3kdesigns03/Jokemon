'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLabData, type LabData } from '@/lib/collection'

const XP_PER_LEVEL = 100

export default function NavBar() {
  const path = usePathname()
  const [lab, setLab] = useState<LabData>({ xp: 0, level: 1, totalPulls: 0 })
  const [levelUpFlash, setLevelUpFlash] = useState(false)

  useEffect(() => {
    const update = () => {
      const data = getLabData()
      setLab(prev => {
        if (prev.level < data.level) setLevelUpFlash(true)
        return data
      })
    }
    update()
    window.addEventListener('pokepet-xp', update)
    return () => window.removeEventListener('pokepet-xp', update)
  }, [])

  useEffect(() => {
    if (levelUpFlash) {
      const t = setTimeout(() => setLevelUpFlash(false), 1500)
      return () => clearTimeout(t)
    }
  }, [levelUpFlash])

  const xpPct = Math.min(100, (lab.xp / XP_PER_LEVEL) * 100)

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 60,
      background: 'rgba(8,11,20,0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px',
      gap: 12,
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <motion.span style={{ fontSize: 22, display: 'block' }} whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}>
          🥚
        </motion.span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>POKE-PET</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>AI Evolution Lab</div>
        </div>
      </Link>

      {/* XP Bar */}
      <div style={{ flex: 1, maxWidth: 200, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <motion.span
            key={lab.level}
            initial={{ scale: levelUpFlash ? 1.5 : 1, color: levelUpFlash ? '#fbbf24' : 'rgba(255,255,255,0.5)' }}
            animate={{ scale: 1, color: 'rgba(255,255,255,0.5)' }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            {levelUpFlash ? '⬆ LEVEL UP!' : `Lv.${lab.level} Lab`}
          </motion.span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{lab.xp}/{XP_PER_LEVEL} XP</span>
        </div>
        <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              height: '100%', borderRadius: 999,
              background: 'linear-gradient(90deg, #a855f7, #fbbf24)',
            }}
          />
        </div>
      </div>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {[
          { href: '/',           label: '⚡ Evolve'     },
          { href: '/collection', label: '🏆 Collection' },
        ].map(({ href, label }) => {
          const active = path === href
          return (
            <motion.div key={href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href={href} style={{
                display: 'block',
                padding: '5px 12px', borderRadius: 8, fontSize: 12,
                fontWeight: active ? 700 : 500,
                textDecoration: 'none',
                color: active ? 'white' : 'rgba(255,255,255,0.45)',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                transition: 'color 0.15s, background 0.15s',
              }}>
                {label}
              </Link>
            </motion.div>
          )
        })}
      </div>
    </nav>
  )
}

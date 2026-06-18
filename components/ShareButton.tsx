'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { shareCard, downloadCard, buildShareUrl } from '@/lib/share'
import { TIERS } from '@/lib/evolution'
import type { CollectionCard } from '@/lib/collection'

interface ShareButtonProps {
  card: CollectionCard
}

export default function ShareButton({ card }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const tierCfg = TIERS[card.tier]

  const handleShare = async () => {
    setSharing(true)
    try {
      const result = await shareCard(card)
      if (result === 'shared') {
        toast('Shared! 🎉', { icon: tierCfg.emoji, duration: 3000 })
      } else if (result === 'copied') {
        toast('Link copied to clipboard!', { icon: '📋', duration: 3000 })
      } else {
        toast('Could not share — try downloading instead', { icon: '⚠️', duration: 3000 })
      }
    } finally {
      setSharing(false)
      setOpen(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadCard(card)
      toast('Card saved as PNG!', { icon: '🖼️', duration: 3000 })
    } catch {
      toast('Download failed — try again', { icon: '⚠️', duration: 3000 })
    } finally {
      setDownloading(false)
      setOpen(false)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Main share button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        animate={{
          boxShadow: open
            ? `0 0 28px ${tierCfg.glowColor}`
            : [`0 0 12px ${tierCfg.glowColor}`, `0 0 24px ${tierCfg.glowColor}`, `0 0 12px ${tierCfg.glowColor}`],
        }}
        transition={{ boxShadow: { duration: 1.8, repeat: open ? 0 : Infinity } }}
        style={{
          width: '100%', padding: '14px', borderRadius: 12,
          border: `1.5px solid ${tierCfg.color}88`,
          background: `linear-gradient(135deg, ${tierCfg.color}22, ${tierCfg.color}0e)`,
          color: tierCfg.color,
          fontWeight: 800, fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ fontSize: 18 }}>🚀</span>
        <span>Share Your JokeMon</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: 12, opacity: 0.6 }}
        >
          ▼
        </motion.span>
      </motion.button>

      {/* Dropdown options */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              borderRadius: 12, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(10,10,20,0.95)',
              backdropFilter: 'blur(12px)',
              zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <ShareOption
              icon="📤"
              label={sharing ? 'Sharing…' : 'Share / Copy Link'}
              sublabel="Native share or copy link to clipboard"
              disabled={sharing}
              onClick={handleShare}
              color={tierCfg.color}
            />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <ShareOption
              icon={downloading ? '⏳' : '🖼️'}
              label={downloading ? 'Saving PNG…' : 'Download Card Image'}
              sublabel="Save as PNG with PokePet watermark"
              disabled={downloading}
              onClick={handleDownload}
              color={tierCfg.color}
            />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <ShareOption
              icon="🌐"
              label="Open Shareable Page"
              sublabel="Link anyone can view — perfect for Discord / Twitter"
              disabled={false}
              onClick={() => {
                window.open(buildShareUrl(card), '_blank')
                setOpen(false)
              }}
              color={tierCfg.color}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 49 }}
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Option row ───────────────────────────────────────────────────────────────

function ShareOption({
  icon, label, sublabel, disabled, onClick, color,
}: {
  icon: string
  label: string
  sublabel: string
  disabled: boolean
  onClick: () => void
  color: string
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { background: `${color}12` }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      style={{
        width: '100%', padding: '14px 16px', background: 'transparent',
        border: 'none', cursor: disabled ? 'wait' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.88)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{sublabel}</div>
      </div>
    </motion.button>
  )
}

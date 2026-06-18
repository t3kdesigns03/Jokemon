'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import JokeMonCard from '@/components/JokeMonCard'
import { getCollection, toggleFavorite, removeCard, type CollectionCard } from '@/lib/collection'
import { TIERS, ELEMENTS, type EvolutionTier, type Element } from '@/lib/evolution'

type Filter = 'all' | EvolutionTier
type ElemFilter = 'all' | Element
type Sort = 'newest' | 'oldest' | 'rarest' | 'favorites'

const TIER_ORDER: EvolutionTier[] = ['legendary', 'champion', 'evolved', 'starter']

function rarityRank(t: EvolutionTier) { return TIER_ORDER.indexOf(t) }

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const cardVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.92 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { type: 'spring', stiffness: 350, damping: 28 } },
  exit:    { opacity: 0, scale: 0.88, transition: { duration: 0.2 } },
}

export default function CollectionPage() {
  const [cards, setCards] = useState<CollectionCard[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [elemFilter, setElemFilter] = useState<ElemFilter>('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [selected, setSelected] = useState<CollectionCard | null>(null)
  const [gridKey, setGridKey] = useState(0)

  useEffect(() => { setCards(getCollection()) }, [])

  // Re-trigger stagger animation when filters change
  useEffect(() => { setGridKey(k => k + 1) }, [filter, elemFilter, sort])

  const filtered = cards
    .filter(c => filter === 'all' || c.tier === filter)
    .filter(c => elemFilter === 'all' || c.element === elemFilter)
    .sort((a, b) => {
      if (sort === 'newest')    return b.timestamp - a.timestamp
      if (sort === 'oldest')    return a.timestamp - b.timestamp
      if (sort === 'rarest')    return rarityRank(a.tier) - rarityRank(b.tier)
      if (sort === 'favorites') return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
      return 0
    })

  const total = cards.length
  const byCounts = TIER_ORDER.reduce((acc, t) => {
    acc[t] = cards.filter(c => c.tier === t).length
    return acc
  }, {} as Record<EvolutionTier, number>)
  const favorites = cards.filter(c => c.isFavorite).length

  function onToggleFav(id: string) {
    setCards(toggleFavorite(id))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null)
  }

  function onRemove(id: string) {
    setCards(removeCard(id))
    setSelected(null)
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px 60px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>🏆 My Collection</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
          {total} card{total !== 1 ? 's' : ''} pulled
        </p>
      </motion.div>

      {/* ── Stats bar ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 10, marginBottom: 24,
        }}
      >
        {[
          { label: 'Total',        value: total,              color: 'rgba(255,255,255,0.7)' },
          { label: '👑 Legendary', value: byCounts.legendary,  color: TIERS.legendary.color   },
          { label: '⚡ Epic',      value: byCounts.champion,   color: TIERS.champion.color    },
          { label: '💫 Rare',      value: byCounts.evolved,    color: TIERS.evolved.color     },
          { label: '✨ Common',    value: byCounts.starter,    color: TIERS.starter.color     },
          { label: '❤️ Favorites', value: favorites,           color: '#f43f5e'               },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            whileHover={{ scale: 1.04, y: -2 }}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '10px 14px', textAlign: 'center', cursor: 'default',
            }}
          >
            <motion.div
              animate={stat.value > 0 ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
              style={{ fontSize: 20, fontWeight: 900, color: stat.color }}
            >
              {stat.value}
            </motion.div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}
      >
        {(['all', 'legendary', 'champion', 'evolved', 'starter'] as const).map(t => {
          const cfg = t === 'all' ? null : TIERS[t]
          const active = filter === t
          return (
            <motion.button
              key={t}
              onClick={() => setFilter(t)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${active ? (cfg?.color || 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.1)'}`,
                background: active ? `${cfg?.color || 'rgba(255,255,255,0.15)'}22` : 'transparent',
                color: active ? (cfg?.color || 'white') : 'rgba(255,255,255,0.4)',
                transition: 'border 0.15s, background 0.15s, color 0.15s',
              }}
            >
              {t === 'all' ? 'All' : `${cfg!.emoji} ${cfg!.rarity}`}
            </motion.button>
          )
        })}

        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        {(['all', 'water', 'fire', 'wind'] as const).map(el => {
          const cfg = el === 'all' ? null : ELEMENTS[el]
          const active = elemFilter === el
          return (
            <motion.button
              key={el}
              onClick={() => setElemFilter(el)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${active ? (cfg?.color || 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.1)'}`,
                background: active ? `${cfg?.color || 'rgba(255,255,255,0.15)'}22` : 'transparent',
                color: active ? (cfg?.color || 'white') : 'rgba(255,255,255,0.4)',
                transition: 'border 0.15s, background 0.15s, color 0.15s',
              }}
            >
              {el === 'all' ? '🌐 All Types' : `${cfg!.emoji} ${cfg!.label}`}
            </motion.button>
          )
        })}

        <select
          value={sort}
          onChange={e => setSort(e.target.value as Sort)}
          style={{
            marginLeft: 'auto', padding: '5px 10px', borderRadius: 8, fontSize: 12,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'white', cursor: 'pointer',
          }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="rarest">Rarest first</option>
          <option value="favorites">Favorites first</option>
        </select>
      </motion.div>

      {/* ── Empty state ── */}
      {total === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '80px 20px' }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
            style={{ fontSize: 64 }}
          >
            🥚
          </motion.div>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 16, fontSize: 16 }}>
            No cards yet — go evolve your first pet!
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/" style={{
              display: 'inline-block', marginTop: 16, padding: '10px 24px',
              background: 'rgba(255,255,255,0.1)', borderRadius: 10,
              color: 'white', textDecoration: 'none', fontWeight: 700,
            }}>
              ⚡ Start Evolving
            </Link>
          </motion.div>
        </motion.div>
      )}

      {/* ── Grid ── */}
      {filtered.length > 0 && (
        <motion.div
          key={gridKey}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map(card => (
            <motion.div key={card.id} variants={cardVariants} style={{ position: 'relative' }}>
              <JokeMonCard card={card} compact onClick={() => setSelected(card)} />
              {card.isFavorite && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#f43f5e', fontSize: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ♥
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {filtered.length === 0 && total > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}
        >
          No cards match your filters.
        </motion.div>
      )}

      {/* ── Modal ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              padding: '16px 8px', overflowY: 'auto',
            }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.88, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.88, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
            >
              <JokeMonCard card={selected} />

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  {
                    label: selected.isFavorite ? '♥ Favorited' : '♡ Favorite',
                    onClick: () => onToggleFav(selected.id),
                    border: selected.isFavorite ? '#f43f5e' : 'rgba(255,255,255,0.2)',
                    bg: selected.isFavorite ? 'rgba(244,63,94,0.2)' : 'transparent',
                    color: selected.isFavorite ? '#f43f5e' : 'rgba(255,255,255,0.6)',
                    as: 'button' as const,
                  },
                ].map(btn => (
                  <motion.button key={btn.label}
                    onClick={btn.onClick}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      border: `1px solid ${btn.border}`, background: btn.bg, color: btn.color, cursor: 'pointer',
                    }}
                  >
                    {btn.label}
                  </motion.button>
                ))}

                <motion.a
                  href={`/api/proxy-image?url=${encodeURIComponent(selected.joKemonImageUrl)}`}
                  download="my-jokemon.jpg" target="_blank" rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)',
                    textDecoration: 'none', display: 'inline-block',
                  }}
                >
                  ⬇ Download
                </motion.a>

                <motion.button
                  onClick={() => onRemove(selected.id)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: '1px solid rgba(239,68,68,0.3)', background: 'transparent',
                    color: 'rgba(239,68,68,0.6)', cursor: 'pointer',
                  }}
                >
                  🗑 Remove
                </motion.button>

                <motion.button
                  onClick={() => setSelected(null)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                    color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                  }}
                >
                  ✕ Close
                </motion.button>
              </div>

              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                Pulled {new Date(selected.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}{ELEMENTS[selected.element].label} · {TIERS[selected.tier].rarity}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

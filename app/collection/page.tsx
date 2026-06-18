'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import JokeMonCard from '@/components/JokeMonCard'
import { getCollection, toggleFavorite, removeCard, type CollectionCard } from '@/lib/collection'
import { TIERS, ELEMENTS, type EvolutionTier, type Element } from '@/lib/evolution'

type Filter = 'all' | EvolutionTier
type ElemFilter = 'all' | Element
type Sort = 'newest' | 'oldest' | 'rarest' | 'favorites'

const TIER_ORDER: EvolutionTier[] = ['legendary', 'champion', 'evolved', 'starter']

function rarityRank(t: EvolutionTier) { return TIER_ORDER.indexOf(t) }

export default function CollectionPage() {
  const [cards, setCards] = useState<CollectionCard[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [elemFilter, setElemFilter] = useState<ElemFilter>('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [selected, setSelected] = useState<CollectionCard | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { setCards(getCollection()) }, [])

  const filtered = cards
    .filter(c => filter === 'all' || c.tier === filter)
    .filter(c => elemFilter === 'all' || c.element === elemFilter)
    .filter(c => !search || c.tier.includes(search.toLowerCase()) || c.element.includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'newest')    return b.timestamp - a.timestamp
      if (sort === 'oldest')    return a.timestamp - b.timestamp
      if (sort === 'rarest')    return rarityRank(a.tier) - rarityRank(b.tier)
      if (sort === 'favorites') return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
      return 0
    })

  // Stats
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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>
          🏆 My Collection
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
          {total} card{total !== 1 ? 's' : ''} pulled
        </p>
      </div>

      {/* ── Stats bar ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 10, marginBottom: 24,
      }}>
        {[
          { label: 'Total', value: total, color: 'rgba(255,255,255,0.7)' },
          { label: '👑 Legendary', value: byCounts.legendary, color: TIERS.legendary.color },
          { label: '⚡ Epic', value: byCounts.champion, color: TIERS.champion.color },
          { label: '💫 Rare', value: byCounts.evolved, color: TIERS.evolved.color },
          { label: '✨ Common', value: byCounts.starter, color: TIERS.starter.color },
          { label: '❤️ Favorites', value: favorites, color: '#f43f5e' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '10px 14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* Rarity filter */}
        {(['all', 'legendary', 'champion', 'evolved', 'starter'] as const).map(t => {
          const cfg = t === 'all' ? null : TIERS[t]
          const active = filter === t
          return (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${active ? (cfg?.color || 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.1)'}`,
              background: active ? `${cfg?.color || 'rgba(255,255,255,0.15)'}22` : 'transparent',
              color: active ? (cfg?.color || 'white') : 'rgba(255,255,255,0.4)',
            }}>
              {t === 'all' ? 'All' : `${cfg!.emoji} ${cfg!.rarity}`}
            </button>
          )
        })}

        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        {/* Element filter */}
        {(['all', 'water', 'fire', 'wind'] as const).map(el => {
          const cfg = el === 'all' ? null : ELEMENTS[el]
          const active = elemFilter === el
          return (
            <button key={el} onClick={() => setElemFilter(el)} style={{
              padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${active ? (cfg?.color || 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.1)'}`,
              background: active ? `${cfg?.color || 'rgba(255,255,255,0.15)'}22` : 'transparent',
              color: active ? (cfg?.color || 'white') : 'rgba(255,255,255,0.4)',
            }}>
              {el === 'all' ? '🌐 All Types' : `${cfg!.emoji} ${cfg!.label}`}
            </button>
          )
        })}

        {/* Sort */}
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
      </div>

      {/* ── Empty state ── */}
      {total === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 64 }}>🥚</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 16, fontSize: 16 }}>
            No cards yet — go evolve your first pet!
          </p>
          <Link href="/" style={{
            display: 'inline-block', marginTop: 16, padding: '10px 24px',
            background: 'rgba(255,255,255,0.1)', borderRadius: 10,
            color: 'white', textDecoration: 'none', fontWeight: 700,
          }}>
            ⚡ Start Evolving
          </Link>
        </div>
      )}

      {/* ── Grid ── */}
      {filtered.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16,
        }}>
          {filtered.map(card => (
            <div key={card.id} style={{ position: 'relative' }}>
              <JokeMonCard card={card} compact onClick={() => setSelected(card)} />
              {/* Favorite dot */}
              {card.isFavorite && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#f43f5e', fontSize: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  ♥
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && total > 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
          No cards match your filters.
        </div>
      )}

      {/* ── Modal ── */}
      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelected(null)}
        >
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <JokeMonCard card={selected} />

            {/* Modal actions */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => onToggleFav(selected.id)} style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: `1px solid ${selected.isFavorite ? '#f43f5e' : 'rgba(255,255,255,0.2)'}`,
                background: selected.isFavorite ? 'rgba(244,63,94,0.2)' : 'transparent',
                color: selected.isFavorite ? '#f43f5e' : 'rgba(255,255,255,0.6)', cursor: 'pointer',
              }}>
                {selected.isFavorite ? '♥ Favorited' : '♡ Favorite'}
              </button>

              <a href={`/api/proxy-image?url=${encodeURIComponent(selected.joKemonImageUrl)}`}
                download="my-jokemon.jpg" target="_blank" rel="noopener noreferrer"
                style={{
                  padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                }}>
                ⬇ Download
              </a>

              <button onClick={() => onRemove(selected.id)} style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: '1px solid rgba(239,68,68,0.3)', background: 'transparent',
                color: 'rgba(239,68,68,0.6)', cursor: 'pointer',
              }}>
                🗑 Remove
              </button>

              <button onClick={() => setSelected(null)} style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              }}>
                ✕ Close
              </button>
            </div>

            {/* Card metadata */}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
              Pulled {new Date(selected.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' · '}{ELEMENTS[selected.element].label} · {TIERS[selected.tier].rarity}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

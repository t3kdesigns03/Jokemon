import { type Element, type EvolutionTier } from './evolution'

export interface CollectionCard {
  id: string
  tier: EvolutionTier
  element: Element
  joKemonImageUrl: string
  timestamp: number
  isFavorite: boolean
  hp: number
  atk: number
  def: number
  spd: number
  cardNumber: number
}

const KEY = 'pokepet-collection-v1'

export function getCollection(): CollectionCard[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function addCard(card: Omit<CollectionCard, 'id' | 'timestamp' | 'isFavorite'>): CollectionCard {
  const newCard: CollectionCard = {
    ...card,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    isFavorite: false,
  }
  const col = getCollection()
  col.unshift(newCard)
  localStorage.setItem(KEY, JSON.stringify(col))
  return newCard
}

export function toggleFavorite(id: string): CollectionCard[] {
  const col = getCollection()
  const idx = col.findIndex(c => c.id === id)
  if (idx !== -1) col[idx].isFavorite = !col[idx].isFavorite
  localStorage.setItem(KEY, JSON.stringify(col))
  return col
}

export function removeCard(id: string): CollectionCard[] {
  const col = getCollection().filter(c => c.id !== id)
  localStorage.setItem(KEY, JSON.stringify(col))
  return col
}

// ─── Lab Level / XP ──────────────────────────────────────────────────────────

export interface LabData { xp: number; level: number; totalPulls: number }

const XP_PER_TIER: Record<EvolutionTier, number> = {
  starter: 10, evolved: 25, champion: 50, legendary: 100,
}
const XP_PER_LEVEL = 100
const LAB_KEY = 'pokepet-lab-v1'

export function getLabData(): LabData {
  if (typeof window === 'undefined') return { xp: 0, level: 1, totalPulls: 0 }
  try { return JSON.parse(localStorage.getItem(LAB_KEY) || '{"xp":0,"level":1,"totalPulls":0}') }
  catch { return { xp: 0, level: 1, totalPulls: 0 } }
}

export function addXP(tier: EvolutionTier): { data: LabData; leveledUp: boolean; newLevel: number } {
  const data = getLabData()
  data.xp += XP_PER_TIER[tier]
  data.totalPulls += 1
  let leveledUp = false
  while (data.xp >= XP_PER_LEVEL) {
    data.xp -= XP_PER_LEVEL
    data.level += 1
    leveledUp = true
  }
  localStorage.setItem(LAB_KEY, JSON.stringify(data))
  return { data, leveledUp, newLevel: data.level }
}

// ─────────────────────────────────────────────────────────────────────────────

export function generateStats(tier: EvolutionTier): {
  hp: number; atk: number; def: number; spd: number; cardNumber: number
} {
  const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  const map = {
    starter:   { hp: [30,  60],  atk: [20, 45],  def: [15, 40],  spd: [25, 50]  },
    evolved:   { hp: [60,  90],  atk: [45, 70],  def: [40, 65],  spd: [50, 75]  },
    champion:  { hp: [90,  130], atk: [70, 100], def: [60, 90],  spd: [70, 100] },
    legendary: { hp: [130, 200], atk: [100, 155], def: [90, 130], spd: [100, 145] },
  }
  const rng = map[tier]
  return {
    hp:         r(...rng.hp  as [number,number]),
    atk:        r(...rng.atk as [number,number]),
    def:        r(...rng.def as [number,number]),
    spd:        r(...rng.spd as [number,number]),
    cardNumber: r(1, 999),
  }
}

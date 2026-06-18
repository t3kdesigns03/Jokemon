export type Element = 'water' | 'fire' | 'wind'
export type EvolutionTier = 'starter' | 'evolved' | 'champion' | 'legendary'

export interface TierConfig {
  name: string
  label: string
  chance: number // cumulative probability (0-1)
  rarity: string
  color: string
  glowColor: string
  bgGradient: string
  stars: number
  emoji: string
  strengthModifier: string
}

export const TIERS: Record<EvolutionTier, TierConfig> = {
  starter: {
    name: 'starter',
    label: 'Phase 1 · Starter',
    chance: 0.4,
    rarity: 'Common',
    color: '#94a3b8',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    bgGradient: 'from-slate-700 to-slate-800',
    stars: 1,
    emoji: '✨',
    strengthModifier: 'cute chibi style, small and friendly, soft pastel elemental markings, simple glow outline, clean design',
  },
  evolved: {
    name: 'evolved',
    label: 'Phase 2 · Evolved',
    chance: 0.75,
    rarity: 'Rare',
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    bgGradient: 'from-blue-700 to-indigo-800',
    stars: 2,
    emoji: '💫',
    strengthModifier: 'medium-sized, confident battle stance, vivid glowing eyes, shimmering elemental markings, bright saturated colors, detailed fur or scales, soft inner glow effect',
  },
  champion: {
    name: 'champion',
    label: 'Phase 3 · Champion',
    chance: 0.93,
    rarity: 'Epic',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    bgGradient: 'from-purple-700 to-fuchsia-800',
    stars: 3,
    emoji: '⚡',
    strengthModifier: 'large and imposing, dramatic dynamic pose, blazing neon elemental energy radiating outward, iridescent holographic sheen on body, ultra-vivid jewel-toned colors, glowing battle armor accents, intense glowing eyes, energy particles swirling, highly detailed illustration',
  },
  legendary: {
    name: 'legendary',
    label: 'LEGENDARY',
    chance: 1.0,
    rarity: 'Legendary',
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.8)',
    bgGradient: 'from-yellow-500 to-orange-600',
    stars: 4,
    emoji: '👑',
    strengthModifier: 'colossal god-tier creature, explosive full-art illustration, blinding radiant light bursting from body, rainbow prismatic holographic aura, metallic gold and platinum sheen, divine celestial markings, chromatic aberration glow, otherworldly transcendence, maximum detail ultra-HD, cinematic dramatic lighting, spectacular beyond imagination',
  },
}

export const ELEMENTS: Record<Element, {
  label: string
  emoji: string
  color: string
  glowColor: string
  textColor: string
  borderColor: string
  bgFrom: string
  bgTo: string
  particle: string
  description: string
  promptKeywords: string
}> = {
  water: {
    label: 'WATER',
    emoji: '💧',
    color: '#0ea5e9',
    glowColor: 'rgba(14, 165, 233, 0.6)',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500',
    bgFrom: 'from-sky-900/40',
    bgTo: 'to-blue-900/40',
    particle: '💧',
    description: 'Aquatic power. Deep ocean mastery.',
    promptKeywords: 'aquatic creature, blue bioluminescent scales, water droplets, flowing fins, deep sea energy, teal and sapphire glow, ocean waves aura',
  },
  fire: {
    label: 'FIRE',
    emoji: '🔥',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.6)',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500',
    bgFrom: 'from-orange-900/40',
    bgTo: 'to-red-900/40',
    particle: '🔥',
    description: 'Volcanic fury. Blazing destruction.',
    promptKeywords: 'fire creature, flame mane, ember spots, volcanic rock armor, burning eyes, orange and crimson fire aura, smoke trails, magma veins',
  },
  wind: {
    label: 'WIND',
    emoji: '🌪️',
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.6)',
    textColor: 'text-green-400',
    borderColor: 'border-green-500',
    bgFrom: 'from-green-900/40',
    bgTo: 'to-emerald-900/40',
    particle: '🌿',
    description: 'Sky dancer. Storm commander.',
    promptKeywords: 'wind creature, feathered wings, leaf and vine accents, swirling air currents, jade and white energy, lightning speed aura, cloud wisps',
  },
}

export function rollEvolutionTier(): EvolutionTier {
  const roll = Math.random()
  if (roll < TIERS.starter.chance) return 'starter'
  if (roll < TIERS.evolved.chance) return 'evolved'
  if (roll < TIERS.champion.chance) return 'champion'
  return 'legendary'
}

export function buildEvolutionPrompt(element: Element, tier: EvolutionTier): string {
  const el = ELEMENTS[element]
  const t = TIERS[tier]

  return [
    `A ${t.rarity.toLowerCase()} JokeMon creature evolved from a pet,`,
    `${el.promptKeywords},`,
    `${t.strengthModifier},`,
    'Pokemon TCG card art style, anime illustration,',
    'vibrant hyper-saturated colors, bold outlines,',
    'black background with dramatic elemental lighting,',
    'official trading card game artwork quality,',
    'professional digital illustration, 4K ultra detailed',
  ].join(' ')
}

export function buildVideoPrompt(element: Element, tier: EvolutionTier): string {
  const el = ELEMENTS[element]
  const t = TIERS[tier]

  return [
    `A ${t.rarity.toLowerCase()} ${el.label.toLowerCase()} type JokeMon creature,`,
    `${el.promptKeywords},`,
    'slowly rotating to show all angles,',
    `${t.strengthModifier},`,
    'dramatic elemental energy particles surrounding it,',
    'cinematic lighting, epic reveal, Pokemon anime style,',
    '4K quality',
  ].join(' ')
}

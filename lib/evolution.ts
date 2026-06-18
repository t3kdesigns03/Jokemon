export type Element = 'water' | 'fire' | 'wind'
export type EvolutionTier = 'starter' | 'evolved' | 'champion' | 'legendary'

export interface TierConfig {
  name: string
  label: string
  chance: number
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
    strengthModifier: 'Special Illustration Rare SIR card art style, full-bleed artwork filling edge to edge, creature bursting dramatically OUT OF THE FRAME with energy, sprawling cinematic scene behind it, stormy atmospheric background with elemental destruction, ultra-painterly brushwork, neon chromatic energy trails, dynamic explosion pose, glowing crystalline battle armor, intensely saturated jewel colors, professional concept art quality, breathtaking wow-factor illustration',
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
    strengthModifier: 'Secret Rare gold foil card art, divine god creature descending from heavens, blinding prismatic rainbow light explosion, full-art cinematic masterpiece, creature radiating transcendent golden aura with chromatic halo, celestial sacred geometry patterns, platinum and rainbow metallic sheen, surrounded by cosmic starfield and divine lightning, ultra-HD maximum detail, the most spectacular creature illustration ever created, jaw-dropping legendary quality',
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

// ─── Species Names (element × tier) ──────────────────────────────────────────

const SPECIES: Record<Element, Record<EvolutionTier, string>> = {
  water: {
    starter:   'Aqua Pup',
    evolved:   'Tide Sprite',
    champion:  'Storm Leviathan',
    legendary: 'Cosmic Tide God',
  },
  fire: {
    starter:   'Ember Kit',
    evolved:   'Flame Fox',
    champion:  'Inferno Drake',
    legendary: 'Sol Phoenix',
  },
  wind: {
    starter:   'Gale Pup',
    evolved:   'Storm Wing',
    champion:  'Thunder Hawk',
    legendary: 'Sky Sovereign',
  },
}

export function getSpeciesName(element: Element, tier: EvolutionTier): string {
  return SPECIES[element][tier]
}

// ─── Name → Personality Vibe ──────────────────────────────────────────────────

interface NameVibe {
  descriptor: string
  traits: string
}

const VIBE_PATTERNS: Array<{ pattern: RegExp; vibe: NameVibe }> = [
  {
    pattern: /\b(god|goddess|deity|divine|celestial|supreme|almighty|omnipotent|eternal)\b/i,
    vibe: {
      descriptor: 'divine and all-powerful',
      traits: 'radiating godlike aura, wearing ancient divine artifacts, floating above the ground on pillars of elemental energy, eyes glowing with cosmic power, sacred geometry halo',
    },
  },
  {
    pattern: /\b(lord|master|king|queen|emperor|empress|overlord|sovereign|ruler|pharaoh)\b/i,
    vibe: {
      descriptor: 'regal and commanding',
      traits: 'wearing an ornate crown and battle regalia, sitting atop a throne of crystallized elements, with an expression of absolute authority and confidence, surrounded by royal elemental flourishes',
    },
  },
  {
    pattern: /\b(mega|ultra|hyper|turbo|maximum|extreme|xtra|xtreme|maxi|max|giga|omega)\b/i,
    vibe: {
      descriptor: 'over-the-top and maximum power',
      traits: 'muscles bulging with elemental energy, dramatic speed lines erupting everywhere, screaming a battle cry with maximum intensity, multiple glowing power auras stacked, power levels over 9000',
    },
  },
  {
    pattern: /\b(super|super\s*duper|number\s*one|number\s*1|best|greatest|strongest|undefeated)\b/i,
    vibe: {
      descriptor: 'supremely confident and try-hard',
      traits: 'flexing both arms with enormous muscles, wearing a championship belt and gold medal, surrounded by trophy icons, pointing finger guns at the viewer, enormous grin of pure confidence',
    },
  },
  {
    pattern: /\b(chaos|mayhem|havoc|apocalypse|armageddon|anarchy|destruction|carnage)\b/i,
    vibe: {
      descriptor: 'gloriously chaotic and unhinged',
      traits: 'wild manic gleaming eyes, chaos energy erupting randomly from its body, surrounded by swirling vortex of destruction, laughing maniacally, reality cracking behind it',
    },
  },
  {
    pattern: /\b(doom|dread|death|grim|dark|shadow|void|abyss|nightmare|evil|sinister|devil|demon|phantom|specter)\b/i,
    vibe: {
      descriptor: 'ominously dark and menacing',
      traits: 'surrounded by dark smoke tendrils, glowing crimson menacing eyes, wearing dark spiked armor with skull motifs, emanating waves of dark elemental energy, sinister smirk',
    },
  },
  {
    pattern: /\b(fluffy|fuzzy|puffy|fluff|puff|cloud|cotton|soft|cozy|snuggle|snuggles|cuddle|cuddles)\b/i,
    vibe: {
      descriptor: 'irresistibly fluffy and soft',
      traits: 'covered in impossibly thick magnificent fluff, perfectly round like a cloud, radiating warmth and comfort, eyes sparkling with pure sweetness, tiny cute paws',
    },
  },
  {
    pattern: /\b(tiny|mini|small|little|baby|smol|itty|bitty|wee|micro|nano|petit)\b/i,
    vibe: {
      descriptor: 'tiny but insanely fierce',
      traits: "extremely tiny but puffed up trying to look big, disproportionately large determined eyes, tiny fists raised in defiance, giant elemental power emanating from tiny body, don't underestimate me energy",
    },
  },
  {
    pattern: /\b(princess|prince|duchess|duke|baroness|baron|countess|count|sir|dame|lady|earl|marquis)\b/i,
    vibe: {
      descriptor: 'noble and aristocratic',
      traits: 'wearing elegant royal garments and sparkling tiara, looking down with dignified expression, holding a tiny jeweled scepter, surrounded by royal elemental flourishes, impeccably groomed',
    },
  },
  {
    pattern: /\b(grumpy|grump|angry|mad|rage|furious|cross|cranky|irritable|mean|salty|moody)\b/i,
    vibe: {
      descriptor: 'permanently grumpy and expressive',
      traits: 'intense furrowed brow and scowling deeply, arms crossed, begrudgingly powerful, grumpy eyebrows angled inward, wearing a frown so deep it has its own weather system',
    },
  },
  {
    pattern: /\b(potato|spud|nugget|bean|dumpling|noodle|pickle|cheese|taco|burrito|sausage|biscuit|cracker|muffin|waffle)\b/i,
    vibe: {
      descriptor: 'delightfully absurd and food-themed',
      traits: 'incorporating the food item into its design with textures and colors matching its namesake, looking equal parts delicious and terrifyingly powerful, completely unaware of how ridiculous it looks, deeply earnest expression',
    },
  },
  {
    pattern: /\b(genius|professor|doctor|dr|scientist|einstein|brainiac|intellectual|scholar)\b/i,
    vibe: {
      descriptor: 'intensely intellectual and scheming',
      traits: 'wearing tiny spectacles, surrounded by floating equations and blueprints, scheming expression of a creature that is three steps ahead of you, dramatically large brain, multiple inventions floating nearby',
    },
  },
  {
    pattern: /\b(yolo|swag|drip|vibe|vibes|dank|poggers|goat|based|slay|slaying|rizz|sigma)\b/i,
    vibe: {
      descriptor: 'maximum swagger and drip',
      traits: 'wearing sunglasses and chains, extremely relaxed confident pose, elemental energy styled like designer brands, aura that says too cool for this trading card, inexplicable sunglasses even indoors',
    },
  },
  {
    pattern: /\b(dobby|house|elf|elves|gnome|sprite|pixie|fairy|imp|goblin|gremlin)\b/i,
    vibe: {
      descriptor: 'loyal with enormous expressive eyes',
      traits: 'enormous soulful puppy eyes that take up half the face, oversized pointed ears, earnest expression full of devotion and eagerness to please, ready to protect and serve at all costs',
    },
  },
  {
    pattern: /\b(captain|commander|general|admiral|colonel|major|sergeant|chief|boss|leader)\b/i,
    vibe: {
      descriptor: 'a born leader and tactician',
      traits: 'wearing a decorated military uniform with many medals, pointing heroically into the distance, elemental energy forming battle formations, unwavering determined expression of someone who has seen many battles',
    },
  },
]

function analyzeNameVibe(name: string): string {
  const found = VIBE_PATTERNS.find(v => v.pattern.test(name))
  if (found) {
    return `${found.vibe.descriptor} personality, ${found.vibe.traits}`
  }

  const words = name.trim().split(/\s+/)
  if (words.length >= 3) {
    return `an epic personality befitting the grand name "${name}", elaborate appearance with multiple distinguishing features, dramatic pose that fills the frame`
  }
  if (name.length <= 3) {
    return `mysterious and deceptively simple, cryptic ancient power hidden within an unassuming exterior, subtle but intense gaze`
  }

  return `a distinct personality that perfectly embodies the spirit of "${name}", memorable expressive features, unique striking pose that feels true to its name`
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function rollEvolutionTier(): EvolutionTier {
  const roll = Math.random()
  if (roll < TIERS.starter.chance) return 'starter'
  if (roll < TIERS.evolved.chance) return 'evolved'
  if (roll < TIERS.champion.chance) return 'champion'
  return 'legendary'
}

export function buildEvolutionPrompt(element: Element, tier: EvolutionTier, petName = 'Fluffy'): string {
  const el = ELEMENTS[element]
  const t = TIERS[tier]
  const isHighRarity = tier === 'champion' || tier === 'legendary'
  const safeName = petName.trim() || 'Fluffy'
  const vibeDesc = analyzeNameVibe(safeName)
  const species = getSpeciesName(element, tier)

  // "Transform this pet" anchors the model on the INPUT image so each pet
  // produces a unique result. Without this, the model reads only the descriptive
  // text and generates similar generic creatures regardless of the uploaded photo.
  return [
    `Transform this pet into a ${t.rarity.toLowerCase()} JokeMon creature named "${safeName}" (species: ${species}),`,
    `preserving the subject's face shape, body proportions, and distinctive markings,`,
    `with ${vibeDesc},`,
    `${el.promptKeywords},`,
    `${t.strengthModifier},`,
    isHighRarity
      ? 'Pokemon TCG Special Illustration Rare full-art style, dramatic cinematic composition, rich painterly detail,'
      : 'Pokemon TCG card art style, anime illustration, clean composition,',
    'vibrant hyper-saturated colors,',
    isHighRarity
      ? 'immersive elemental background environment, no card border, artwork bleeds to edges,'
      : 'dark background with elemental lighting,',
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

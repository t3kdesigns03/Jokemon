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
    // ── COMMON card art style ──
    // Art stays inside the illustration box. Creature is centered, readable,
    // and approachable. Background is a simple gradient or flat color. This is
    // the bread-and-butter workhorse card — clean, functional, no frills.
    strengthModifier: 'Pokemon TCG common card illustration style, creature centered in frame on a simple clean gradient background, contained within the card illustration box, straightforward friendly pose, soft elemental color wash behind it, clean simple design, cute chibi proportions, no complex background details, the character is the entire focus',
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
    // ── RARE HOLO card art style ──
    // More polished than common — still box-contained but with a richer
    // background. Dynamic confident pose, environmental texture (rocks, clouds,
    // elemental particles), creature slightly larger with glowing eyes and
    // visible energy markings. Think Scarlet & Violet Rare cards.
    strengthModifier: 'Pokemon TCG rare holo card illustration style, creature in a confident dynamic battle-ready pose, contained within illustration frame, richly detailed background with elemental environment textures and atmospheric depth, glowing expressive eyes, shimmering elemental markings on the body, vivid saturated colors, dramatic lighting from below, detailed fur scales or feathers, soft inner glow radiating from the creature, polished professional TCG rare card quality',
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
    // ── ILLUSTRATION RARE (IR) card art style ──
    // Art fully bleeds to card edges — no frame containment. The philosophy
    // shifts from "battle pose" to "artistic scene." The creature is shown
    // in a painterly lifestyle or action moment: a story is being told.
    // Composition uses unique angles (low angle, overhead, dramatic close-up).
    // Background is a full painted environment with real depth and atmosphere.
    // Think Paldean Fates / Paradox Rift Illustration Rares.
    strengthModifier: 'Pokemon TCG Illustration Rare IR card art style, full-bleed artwork that fills completely edge to edge with no border, painterly artistic composition telling a visual story, unique creative camera angle (low angle or dynamic perspective), creature in an expressive moment that conveys personality not just power, richly painted atmospheric background environment with genuine depth and layered detail, impressionistic brushwork with visible paint texture, cinematic mood lighting, the entire card surface is a unified painting, gallery-quality Pokemon TCG illustration',
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
    // ── SPECIAL ILLUSTRATION RARE (SIR) card art style ──
    // The pinnacle of TCG illustration. Same full-bleed as IR but DOUBLED
    // in both character AND background detail. The environment is as richly
    // rendered as the creature — you could study the background for minutes.
    // Ultra-painterly with chromatic energy and chromatic aberration effects.
    // Background features layered detailed environmental storytelling: weather,
    // architecture, nature, cosmic elements — all painted with museum-quality
    // brushwork. Think SIR Charizard ex, SIR Gardevoir ex from Scarlet & Violet.
    // Golden shimmer treatment, prismatic chromatic foil aura.
    strengthModifier: 'Pokemon TCG Special Illustration Rare SIR card art, the absolute pinnacle of Pokemon card illustration, full-bleed masterpiece painting filling every pixel edge to edge, hyper-detailed creature AND equally hyper-detailed immersive environment background with stunning depth (you could study the background for minutes), ultra-painterly museum-quality brushwork with chromatic energy halos and rainbow chromatic aberration, the creature radiates golden prismatic light with a divine transcendent aura, layered environmental storytelling behind it (weather systems, cosmic elements, sacred geometry, elemental destruction all co-existing), breathtaking cinematic composition, every square centimeter packed with exquisite detail, this is a $200 chase card illustration, the most spectacular Pokemon TCG artwork ever created',
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

export function buildEvolutionPrompt(
  element: Element,
  tier: EvolutionTier,
  petName = 'Fluffy',
  imageDescription?: string,
): string {
  const el = ELEMENTS[element]
  const t = TIERS[tier]
  const isHighRarity = tier === 'champion' || tier === 'legendary'
  const safeName = petName.trim() || 'Fluffy'
  const vibeDesc = analyzeNameVibe(safeName)
  const species = getSpeciesName(element, tier)

  // Build the visual inspiration clause from the image description.
  // This tells the model what features to carry forward into the cartoon creature
  // (body shape, color palette, distinctive markings) without anchoring to realism.
  const visualInspo = imageDescription
    ? `visually inspired by: ${imageDescription} — reimagined as a JokeMon cartoon creature with those colors and body shape,`
    : ''

  // STYLE-FIRST prompt: leading with art style forces the model to generate
  // anime/cartoon artwork regardless of what photo was uploaded.
  // At strength 0.92, the input image provides only loose color + composition hints.
  //
  // Art style prefix is tiered to match real TCG illustration philosophy:
  //   starter  → Common: contained box art, clean and simple
  //   evolved  → Rare Holo: contained but richer, dynamic pose
  //   champion → Illustration Rare: full-bleed painterly scene storytelling
  //   legendary → SIR: full-bleed hyper-detail masterpiece, both character AND background
  const artStylePrefix =
    tier === 'legendary'
      ? 'Official Pokemon TCG Special Illustration Rare SIR masterpiece, anime art style with ultra-painterly brushwork,'
    : tier === 'champion'
      ? 'Official Pokemon TCG Illustration Rare IR full-bleed art, painterly anime illustration style,'
    : tier === 'evolved'
      ? 'Official Pokemon TCG Rare Holo card illustration, anime art style, vibrant digital painting,'
      : 'Official Pokemon TCG Common card illustration, clean anime art style, simple digital painting,'

  return [
    // Art style must come first — this dominates generation
    artStylePrefix,
    'cartoon creature character design, expressive cute eyes, clean anime linework,',

    // Smart visual inspiration from the uploaded image
    visualInspo,

    // Character identity
    `a ${t.rarity.toLowerCase()} creature named "${safeName}" the ${species},`,
    `with ${vibeDesc},`,

    // Element visual style
    `${el.promptKeywords},`,

    // Tier-specific art direction (now accurately describes the correct TCG illustration tier)
    `${t.strengthModifier},`,

    // Quality + anti-realism
    'professional trading card game artwork, fantasy creature illustration,',
    'no humans, no photorealism, no photographs, illustrated cartoon character only,',
    tier === 'legendary'
      ? 'the background environment is as detailed as the character itself, every inch of the card is a masterwork painting, 4K ultra detail'
    : tier === 'champion'
      ? 'full painterly environment background bleeds to every edge, cohesive artistic scene, high quality'
      : 'high quality digital art, clean professional illustration',
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

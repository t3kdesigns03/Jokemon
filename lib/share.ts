import type { CollectionCard } from './collection'
import { TIERS, ELEMENTS, getSpeciesName } from './evolution'

// ─── Shareable URL ────────────────────────────────────────────────────────────

export function buildShareUrl(card: CollectionCard): string {
  const params = new URLSearchParams({
    img: card.joKemonImageUrl,
    name: card.petName || 'Fluffy',
    tier: card.tier,
    element: card.element,
    hp: String(card.hp),
    atk: String(card.atk),
    def: String(card.def),
    spd: String(card.spd),
    num: String(card.cardNumber),
  })
  return `${window.location.origin}/card?${params.toString()}`
}

// ─── Canvas card renderer (browser-only) ─────────────────────────────────────

export async function renderCardToBlob(card: CollectionCard): Promise<Blob> {
  const W = 320
  const H = 460
  const canvas = document.createElement('canvas')
  canvas.width = W * 2   // 2× for retina
  canvas.height = H * 2
  canvas.style.width = `${W}px`
  canvas.style.height = `${H}px`
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)

  const tier = card.tier
  const el = ELEMENTS[card.element]
  const t = TIERS[tier]
  const species = getSpeciesName(card.element, card.tier)
  const displayName = (card.petName || 'Fluffy').toUpperCase()

  // ── Background gradient ──
  const bgColors: Record<typeof tier, [string, string]> = {
    starter:   ['#111827', '#1f2937'],
    evolved:   ['#0f172a', '#1e3a5f'],
    champion:  ['#0d0618', '#1a0533'],
    legendary: ['#1a0a00', '#2d1400'],
  }
  const [bgFrom, bgTo] = bgColors[tier]
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, bgFrom)
  bg.addColorStop(1, bgTo)
  ctx.fillStyle = bg
  roundRect(ctx, 0, 0, W, H, 14)
  ctx.fill()

  // ── Rarity border ──
  const borderColors: Record<typeof tier, string> = {
    starter:  '#374151',
    evolved:  '#94a3b8',
    champion: '#a855f7',
    legendary: '#fbbf24',
  }
  ctx.strokeStyle = borderColors[tier]
  ctx.lineWidth = tier === 'champion' ? 3 : 2
  roundRect(ctx, 1, 1, W - 2, H - 2, 13)
  ctx.stroke()

  // ── Header ──
  ctx.fillStyle = tier === 'legendary' ? 'rgba(251,191,36,0.18)'
                : tier === 'champion'  ? 'rgba(168,85,247,0.18)'
                : 'rgba(255,255,255,0.05)'
  ctx.fillRect(0, 0, W, 36)

  // Element label
  ctx.fillStyle = el.color
  ctx.font = 'bold 10px sans-serif'
  ctx.fillText(`${el.emoji} ${el.label} TYPE`, 12, 23)

  // HP
  ctx.fillStyle = t.color
  ctx.font = 'bold 14px sans-serif'
  const hpText = `${card.hp} HP`
  ctx.fillText(hpText, W - ctx.measureText(hpText).width - 12, 23)

  // ── Pet name + species ──
  const showSpecies = tier === 'evolved' || tier === 'champion' || tier === 'legendary'
  ctx.textAlign = 'center'
  ctx.fillStyle = tier === 'legendary' ? '#fbbf24'
                : tier === 'champion'  ? '#c084fc'
                : 'rgba(255,255,255,0.85)'
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText(displayName, W / 2, showSpecies ? 52 : 56)

  if (showSpecies) {
    ctx.fillStyle = tier === 'legendary' ? 'rgba(251,191,36,0.6)'
                  : tier === 'champion'  ? 'rgba(192,132,252,0.6)'
                  : 'rgba(148,163,184,0.5)'
    ctx.font = '700 9px sans-serif'
    ctx.fillText(`the ${species}`.toUpperCase(), W / 2, 64)
  }
  ctx.textAlign = 'left'

  // ── Artwork ──
  const imgY = showSpecies ? 70 : 68
  const imgH = 200
  const imgX = 8
  const imgW = W - 16
  ctx.save()
  roundRect(ctx, imgX, imgY, imgW, imgH, 8)
  ctx.clip()

  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(card.joKemonImageUrl)}`
    const artwork = await loadImage(proxyUrl)
    ctx.drawImage(artwork, imgX, imgY, imgW, imgH)
  } catch {
    ctx.fillStyle = '#0a0a14'
    ctx.fillRect(imgX, imgY, imgW, imgH)
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.textAlign = 'center'
    ctx.font = '32px sans-serif'
    ctx.fillText(el.emoji, W / 2, imgY + imgH / 2 + 12)
    ctx.textAlign = 'left'
  }
  ctx.restore()

  // ── Rarity badge ──
  const badgeY = imgY + imgH + 10
  const badgeText = `${t.emoji} ${t.rarity.toUpperCase()} ${'★'.repeat(t.stars)}`
  ctx.textAlign = 'center'
  ctx.font = 'bold 10px sans-serif'
  const bW = ctx.measureText(badgeText).width + 24
  const bX = (W - bW) / 2
  ctx.fillStyle = tier === 'legendary' ? '#d97706'
                : tier === 'champion'  ? '#7c3aed'
                : tier === 'evolved'   ? '#334155'
                : '#1f2937'
  roundRect(ctx, bX, badgeY, bW, 22, 11)
  ctx.fill()
  ctx.strokeStyle = borderColors[tier]
  ctx.lineWidth = 1
  roundRect(ctx, bX, badgeY, bW, 22, 11)
  ctx.stroke()
  ctx.fillStyle = tier === 'legendary' ? '#000' : 'white'
  ctx.fillText(badgeText, W / 2, badgeY + 15)
  ctx.textAlign = 'left'

  // ── Stats ──
  const statY = badgeY + 30
  const maxStat = tier === 'legendary' ? 200 : tier === 'champion' ? 130 : tier === 'evolved' ? 90 : 60
  const statColor = borderColors[tier]
  ;[['ATK', card.atk], ['DEF', card.def], ['SPD', card.spd]].forEach(([label, val], i) => {
    const y = statY + i * 18
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = 'bold 8px sans-serif'
    ctx.fillText(label as string, 12, y + 9)
    // Bar bg
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    roundRect(ctx, 38, y, W - 70, 8, 4)
    ctx.fill()
    // Bar fill
    const pct = Math.min(1, (val as number) / maxStat)
    ctx.fillStyle = statColor
    roundRect(ctx, 38, y, (W - 70) * pct, 8, 4)
    ctx.fill()
    // Value
    ctx.fillStyle = statColor
    ctx.font = 'bold 9px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(String(val), W - 12, y + 9)
    ctx.textAlign = 'left'
  })

  // ── Footer ──
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.fillRect(0, H - 22, W, 22)
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.font = '8px sans-serif'
  ctx.fillText('PokePet Lab', 12, H - 8)
  ctx.textAlign = 'right'
  ctx.fillText(`No. ${String(card.cardNumber).padStart(3, '0')}`, W - 12, H - 8)
  ctx.textAlign = 'left'

  // ── Watermark ──
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.font = 'bold 7px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Made with Poke-Pet  •  jokemon-nine.vercel.app', W / 2, H - 8)
  ctx.textAlign = 'left'

  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas export failed')), 'image/png')
  })
}

// ─── Download card as PNG ─────────────────────────────────────────────────────

export async function downloadCard(card: CollectionCard): Promise<void> {
  const blob = await renderCardToBlob(card)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(card.petName || 'jokemon').toLowerCase().replace(/\s+/g, '-')}-card.png`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// ─── Native share (mobile) or clipboard fallback ──────────────────────────────

export async function shareCard(card: CollectionCard): Promise<'shared' | 'copied' | 'error'> {
  const url = buildShareUrl(card)
  const t = TIERS[card.tier]
  const title = `${card.petName || 'Fluffy'}'s JokeMon Card`
  const text = `Check out my ${t.rarity} ${card.petName || 'Fluffy'} JokeMon! ${t.emoji} Play at jokemon-nine.vercel.app`

  // Try Web Share API with image on mobile
  if (navigator.canShare) {
    try {
      const blob = await renderCardToBlob(card)
      const file = new File([blob], `${card.petName || 'jokemon'}-card.png`, { type: 'image/png' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ title, text, url, files: [file] })
        return 'shared'
      }
    } catch {
      // fall through
    }
  }

  // Try Web Share without image
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch {
      // fall through
    }
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'error'
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

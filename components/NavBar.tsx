'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const path = usePathname()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 60,
      background: 'rgba(8,11,20,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <span style={{ fontSize: 24 }}>🥚</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
            POKE-PET
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            AI Evolution Lab
          </div>
        </div>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { href: '/',            label: '⚡ Evolve',     },
          { href: '/collection',  label: '🏆 Collection', },
        ].map(({ href, label }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                textDecoration: 'none',
                color: active ? 'white' : 'rgba(255,255,255,0.5)',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Poke-Pet · Evolve Your Pet into a JokeMon',
  description: 'Upload your pet photo, choose an element, and watch it evolve into a legendary JokeMon creature using AI.',
  openGraph: {
    title: 'Poke-Pet · Evolve Your Pet',
    description: 'Turn your pet into a JokeMon with AI evolution!',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <NavBar />
        <div style={{ paddingTop: '60px' }}>{children}</div>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#0f1729',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}

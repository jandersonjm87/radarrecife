// ============================================================
//  src/components/Tooltip.tsx
//  Tooltip informativo reutilizavel em toda a plataforma.
//  Passa o mouse sobre qualquer dado para ver a explicacao.
// ============================================================
import { useState, useRef } from 'react'

interface TooltipProps {
  texto: string
  children: React.ReactNode
  posicao?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ texto, children, posicao = 'top' }: TooltipProps) {
  const [visivel, setVisivel] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const posStyles: Record<string, React.CSSProperties> = {
    top:    { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '100%',   left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
    left:   { right: '100%', top: '50%',  transform: 'translateY(-50%)', marginRight: 6 },
    right:  { left: '100%',  top: '50%',  transform: 'translateY(-50%)', marginLeft: 6 },
  }

  return (
    <div
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisivel(true)}
      onMouseLeave={() => setVisivel(false)}
    >
      {children}
      {visivel && (
        <div style={{
          position: 'absolute',
          ...posStyles[posicao],
          background: '#0a1628',
          border: '0.5px solid #1e3a5f',
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 10,
          color: '#8aadcc',
          whiteSpace: 'normal',
          maxWidth: 220,
          zIndex: 1000,
          lineHeight: 1.5,
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
        }}>
          {texto}
        </div>
      )}
    </div>
  )
}

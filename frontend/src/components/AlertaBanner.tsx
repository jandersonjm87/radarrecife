// ============================================================
//  src/components/AlertaBanner.tsx
//  Banner de alerta meteorologico em destaque.
// ============================================================

interface AlertaBannerProps {
  nivel: 'verde' | 'amarelo' | 'laranja' | 'vermelho'
  mensagem: string
  emitidoEm?: string
  validoAte?: string
}

const CORES = {
  verde:    { bg: '#0a2a0a', border: '#14532d', texto: '#86efac', badge: '#22c55e' },
  amarelo:  { bg: '#2a1a0a', border: '#713f12', texto: '#fde68a', badge: '#eab308' },
  laranja:  { bg: '#2a1000', border: '#7c2d12', texto: '#fdba74', badge: '#f97316' },
  vermelho: { bg: '#2a0a0a', border: '#7f1d1d', texto: '#fca5a5', badge: '#ef4444' },
}

const LABELS = {
  verde: 'NORMAL', amarelo: 'ATENCAO', laranja: 'ALERTA', vermelho: 'RISCO ALTO',
}

export function AlertaBanner({ nivel, mensagem, emitidoEm, validoAte }: AlertaBannerProps) {
  const cores = CORES[nivel]
  return (
    <div style={{
      background: cores.bg,
      border: `0.5px solid ${cores.border}`,
      borderRadius: 8,
      padding: '10px 16px',
      marginBottom: 12,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      <span style={{
        background: cores.badge,
        color: '#fff',
        fontSize: 10,
        fontWeight: 500,
        padding: '3px 8px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
        letterSpacing: '0.5px',
      }}>
        {LABELS[nivel]}
      </span>
      <div>
        <div style={{ color: cores.texto, fontSize: 12, lineHeight: 1.5 }}>
          {mensagem}
        </div>
        {emitidoEm && (
          <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginTop: 4 }}>
            Emitido {emitidoEm}{validoAte ? ` · Valido ate ${validoAte}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}

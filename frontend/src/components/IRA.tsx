// ============================================================
//  src/components/IRA.tsx
//  Indice de Risco de Alagamento — gauge visual.
// ============================================================

interface IRAProps {
  valor: number
  atualizadoEm?: string
}

function getNivel(ira: number) {
  if (ira <= 20) return { label: 'Normal',     cor: '#22c55e' }
  if (ira <= 40) return { label: 'Atencao',    cor: '#eab308' }
  if (ira <= 60) return { label: 'Alerta',     cor: '#f97316' }
  return             { label: 'Risco Alto', cor: '#ef4444' }
}

export function IRA({ valor, atualizadoEm }: IRAProps) {
  const nivel = getNivel(valor)
  const pct = `${valor}%`

  return (
    <div style={{
      background: 'var(--rr-card)',
      border: '0.5px solid var(--rr-border)',
      borderRadius: 8,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{ fontSize: 11, color: 'var(--rr-sub)', marginBottom: 8 }}>
        IRA — Indice de Risco de Alagamento
      </div>

      <div style={{
        fontSize: 52, fontWeight: 500,
        color: nivel.cor,
        textAlign: 'center',
        lineHeight: 1,
        margin: '8px 0 4px',
      }}>
        {valor}
      </div>

      <div style={{
        textAlign: 'center', fontSize: 12,
        color: nivel.cor, marginBottom: 14,
      }}>
        {nivel.label}
      </div>

      <div style={{
        background: 'var(--rr-border)',
        borderRadius: 3, height: 6, marginBottom: 6,
        position: 'relative',
      }}>
        <div style={{
          height: 6, borderRadius: 3,
          background: 'linear-gradient(90deg, #22c55e 0%, #eab308 40%, #f97316 65%, #ef4444 100%)',
          width: '100%',
        }} />
        <div style={{
          position: 'absolute', top: -4,
          left: pct, transform: 'translateX(-50%)',
          width: 3, height: 14,
          background: '#fff', borderRadius: 2,
        }} />
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 9, color: 'var(--rr-muted)', marginBottom: 4,
      }}>
        <span style={{ color: '#86efac' }}>Normal</span>
        <span style={{ color: '#fde68a' }}>Atencao</span>
        <span style={{ color: '#fdba74' }}>Alerta</span>
        <span style={{ color: '#fca5a5' }}>Critico</span>
      </div>

      <div style={{
        fontSize: 10, color: 'var(--rr-muted)',
        textAlign: 'center', marginTop: 'auto',
        borderTop: '0.5px solid var(--rr-border)', paddingTop: 8,
      }}>
        {atualizadoEm ? `Calculado as ${atualizadoEm} · atualiza a cada 10 min` : 'Calculando...'}
      </div>
    </div>
  )
}

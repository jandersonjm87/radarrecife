// ============================================================
//  src/components/MetricCard.tsx
//  Card de metrica climatica com timestamp.
// ============================================================

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  atualizadoEm?: string
  cor?: string
  icon?: React.ReactNode
}

export function MetricCard({ label, value, sub, atualizadoEm, cor, icon }: MetricCardProps) {
  return (
    <div style={{
      background: 'var(--rr-card)',
      border: '0.5px solid var(--rr-border)',
      borderRadius: 8,
      padding: '12px 14px',
    }}>
      <div style={{
        fontSize: 11, color: 'var(--rr-muted)',
        marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {icon}
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 500,
        color: cor || 'var(--rr-text)',
        lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--rr-blue-l)', marginTop: 4 }}>
          {sub}
        </div>
      )}
      {atualizadoEm && (
        <div style={{
          fontSize: 10, color: 'var(--rr-muted)',
          marginTop: 6,
          borderTop: '0.5px solid var(--rr-border)',
          paddingTop: 5,
        }}>
          Atualizado {atualizadoEm}
        </div>
      )}
    </div>
  )
}

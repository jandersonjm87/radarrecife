// ============================================================
//  src/components/BairrosLista.tsx
//  Ranking dinamico de bairros ordenado por IRA em tempo real.
// ============================================================
import { useState, useEffect } from 'react'
import { bairrosApi } from '../services/api'

interface BairroStatus {
  nome: string
  ira: number
  nivel: string
  risco_base: number
  motivos: string[]
}

const NIVEL_STYLE: Record<string, { bg: string; cor: string }> = {
  verde:    { bg: '#14532d', cor: '#86efac' },
  amarelo:  { bg: '#713f12', cor: '#fde68a' },
  laranja:  { bg: '#7c2d12', cor: '#fdba74' },
  vermelho: { bg: '#7f1d1d', cor: '#fca5a5' },
}

const NIVEL_LABEL: Record<string, string> = {
  verde: 'Normal', amarelo: 'Atencao', laranja: 'Alerta', vermelho: 'Critico',
}

interface BairrosListaProps {
  onBairroClick?: (bairro: any) => void
}

export function BairrosLista({ onBairroClick }: BairrosListaProps) {
  const [bairros, setBairros] = useState<BairroStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregarRanking()
    const intervalo = setInterval(carregarRanking, 600000) // atualiza a cada 10min
    return () => clearInterval(intervalo)
  }, [])

  async function carregarRanking() {
    try {
      const resp = await bairrosApi.ranking()
      setBairros(resp.data.bairros)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtrados = bairros.filter(b =>
    b.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{
      background: 'var(--rr-card)',
      border: '0.5px solid var(--rr-border)',
      borderRadius: 8,
      padding: 14,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        fontSize: 11, color: 'var(--rr-sub)',
        marginBottom: 10,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>Bairros de Recife</span>
        <span style={{ color: 'var(--rr-muted)' }}>{filtrados.length} bairros</span>
      </div>

      <input
        placeholder="Buscar bairro..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={{
          background: 'var(--rr-surface)',
          border: '0.5px solid var(--rr-border)',
          borderRadius: 6, padding: '6px 10px',
          color: 'var(--rr-text)', fontSize: 12,
          marginBottom: 10, outline: 'none', width: '100%',
        }}
      />

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <div style={{ color: 'var(--rr-muted)', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>
            Carregando ranking...
          </div>
        ) : filtrados.map((b, i) => {
          const style = NIVEL_STYLE[b.nivel] || NIVEL_STYLE.verde
          return (
            <div key={b.nome} onClick={() => onBairroClick && onBairroClick(b)} style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 0',
              cursor: onBairroClick ? 'pointer' : 'default',
              borderBottom: '0.5px solid var(--rr-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--rr-muted)', width: 18 }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 12, color: 'var(--rr-text)' }}>{b.nome}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>
                  {b.ira}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 500,
                  padding: '2px 8px', borderRadius: 4,
                  background: style.bg, color: style.cor,
                }}>
                  {NIVEL_LABEL[b.nivel]}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

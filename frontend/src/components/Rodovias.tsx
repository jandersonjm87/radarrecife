// ============================================================
//  src/components/Rodovias.tsx
//  Pontos criticos de rodovias — exibe APENAS ocorrencias ativas.
//  Some automaticamente quando nao ha ocorrencias confirmadas.
//  Manifesto: nunca exibir pontos sem evidencia real.
// ============================================================
import { useState, useEffect } from 'react'
import { bairrosApi } from '../services/api'

interface PontoCritico {
  rodovia: string
  km: number
  local: string
  municipio: string
  tipo: string
  fonte?: string
  registrado_em?: string
}

const TIPO_CONFIG: Record<string, { label: string; cor: string; bg: string }> = {
  alagamento:   { label: 'Alagamento',     cor: '#fca5a5', bg: '#7f1d1d' },
  deslizamento: { label: 'Deslizamento',   cor: '#fdba74', bg: '#7c2d12' },
  barro_pista:  { label: 'Barro na pista', cor: '#fde68a', bg: '#713f12' },
  interdição:   { label: 'Interdicao',     cor: '#fca5a5', bg: '#7f1d1d' },
}

export function Rodovias() {
  const [pontos, setPontos] = useState<PontoCritico[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizadoEm, setAtualizadoEm] = useState('')

  useEffect(() => {
    buscarPontos()
    const intervalo = setInterval(buscarPontos, 600000)
    return () => clearInterval(intervalo)
  }, [])

  async function buscarPontos() {
    try {
      const resp = await bairrosApi.br232()
      setPontos(resp.data.pontos)
      setAtualizadoEm(new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit',
      }))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Nao renderiza nada enquanto carrega
  if (loading) return null

  // Sem ocorrencias ativas — nao exibe o card
  if (pontos.length === 0) return null

  return (
    <div style={{
      background: 'var(--rr-card)',
      border: '0.5px solid #7f1d1d',
      borderRadius: 8,
      padding: 14,
    }}>
      <div style={{
        fontSize: 11, color: '#fca5a5',
        marginBottom: 12,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 6px #ef4444',
          }} />
          <span>Pontos criticos ativos — Rodovias PE</span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>
          Atualizado {atualizadoEm}
        </span>
      </div>

      {pontos.map((p, i) => {
        const config = TIPO_CONFIG[p.tipo] || TIPO_CONFIG.barro_pista
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '8px 0',
            borderBottom: i < pontos.length - 1 ? '0.5px solid var(--rr-border)' : 'none',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 500,
              color: 'var(--rr-blue-l)',
              whiteSpace: 'nowrap', minWidth: 55, marginTop: 2,
            }}>
              {p.rodovia}<br />
              <span style={{ color: 'var(--rr-muted)' }}>KM {p.km}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--rr-text)', marginBottom: 3 }}>
                {p.local}
              </div>
              <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 4 }}>
                {p.municipio}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 10, fontWeight: 500,
                  padding: '2px 7px', borderRadius: 4,
                  background: config.bg, color: config.cor,
                }}>
                  {config.label}
                </span>
                {p.fonte && (
                  <span style={{ fontSize: 9, color: 'var(--rr-muted)' }}>
                    Fonte: {p.fonte}
                  </span>
                )}
                {p.registrado_em && (
                  <span style={{ fontSize: 9, color: 'var(--rr-muted)' }}>
                    · {p.registrado_em}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

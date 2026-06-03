// ============================================================
//  src/components/Rodovias.tsx
//  Status dos pontos criticos de rodovias de Pernambuco.
// ============================================================

import { useState, useEffect } from 'react'
import { bairrosApi } from '../services/api'

interface PontoCritico {
  rodovia: string
  km: number
  local: string
  municipio: string
  tipo: string
}

const TIPO_CONFIG: Record<string, { label: string; nivel: string; cor: string; bg: string }> = {
  alagamento:   { label: 'Alagamento',      nivel: 'vermelho', cor: '#fca5a5', bg: '#7f1d1d' },
  deslizamento: { label: 'Deslizamento',    nivel: 'laranja',  cor: '#fdba74', bg: '#7c2d12' },
  barro_pista:  { label: 'Barro na pista',  nivel: 'amarelo',  cor: '#fde68a', bg: '#713f12' },
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

  return (
    <div style={{
      background: 'var(--rr-card)',
      border: '0.5px solid var(--rr-border)',
      borderRadius: 8,
      padding: 14,
    }}>
      <div style={{
        fontSize: 11, color: 'var(--rr-sub)',
        marginBottom: 12,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>Rodovias — pontos criticos</span>
        <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>
          {atualizadoEm ? `Atualizado ${atualizadoEm}` : 'Carregando...'}
        </span>
      </div>

      {loading ? (
        <div style={{ color: 'var(--rr-muted)', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>
          Carregando...
        </div>
      ) : pontos.map((p, i) => {
        const config = TIPO_CONFIG[p.tipo] || TIPO_CONFIG.barro_pista
        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '8px 0',
            borderBottom: '0.5px solid var(--rr-border)',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 500,
              color: 'var(--rr-blue-l)',
              whiteSpace: 'nowrap',
              minWidth: 55,
              marginTop: 2,
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
              <span style={{
                fontSize: 10, fontWeight: 500,
                padding: '2px 7px', borderRadius: 4,
                background: config.bg, color: config.cor,
              }}>
                {config.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

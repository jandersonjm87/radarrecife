// ============================================================
//  src/components/ElNino.tsx
//  Card El Nino / La Nina com dados reais via NOAA.
//  Fonte: NOAA Climate Prediction Center — indice ONI oficial.
// ============================================================

import { useState, useEffect } from 'react'
import api from '../services/api'

interface DadosElNino {
  oni_atual: number
  periodo_ref: string
  fenomeno: string
  intensidade: string
  label_status: string
  cor: string
  bg: string
  variacao: number
  tendencia: string
  ponteiro: number
  impactos: string[]
  tendencia_hist: { periodo: string; oni: number }[]
  fonte: string
  atualizado_em: string
}

export function ElNino() {
  const [dados, setDados] = useState<DadosElNino | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    carregar()
    // Atualiza a cada 6 horas — NOAA atualiza mensalmente
    const intervalo = setInterval(carregar, 6 * 3600 * 1000)
    return () => clearInterval(intervalo)
  }, [])

  async function carregar() {
    try {
      const resp = await api.get('/elnino/')
      setDados(resp.data)
      setErro(false)
    } catch (e) {
      setErro(true)
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ background: 'var(--rr-card)', border: '0.5px solid var(--rr-border)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 11, color: 'var(--rr-muted)', textAlign: 'center', padding: '10px 0' }}>
        Carregando dados NOAA...
      </div>
    </div>
  )

  if (erro || !dados) return null

  const sinal = dados.oni_atual >= 0 ? '+' : ''
  const variacaoSinal = dados.variacao >= 0 ? '+' : ''

  // Nome do fenomeno em portugues
  const nomeFenomeno = dados.fenomeno === 'el_nino' ? 'El Niño'
    : dados.fenomeno === 'la_nina' ? 'La Niña'
    : 'Neutro'

  const tendenciaLabel = dados.tendencia === 'aquecendo' ? '↑ aquecendo'
    : dados.tendencia === 'esfriando' ? '↓ esfriando'
    : '→ estável'

  const tendenciaCor = dados.tendencia === 'aquecendo' ? '#ef4444'
    : dados.tendencia === 'esfriando' ? '#60a5fa'
    : '#22c55e'

  return (
    <div style={{
      background: 'var(--rr-card)',
      border: `0.5px solid ${dados.bg}`,
      borderRadius: 8,
      padding: 14,
    }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--rr-text)' }}>
          🌊 {nomeFenomeno} — {dados.intensidade}
        </div>
        <span style={{ background: dados.bg, color: dados.cor, fontSize: 10, padding: '3px 8px', borderRadius: 4 }}>
          {dados.label_status}
        </span>
      </div>

      {/* Métricas principais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        <div style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 4 }}>Índice ONI</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: dados.cor }}>
            {sinal}{dados.oni_atual.toFixed(2)}
          </div>
          <div style={{ fontSize: 9, color: tendenciaCor, marginTop: 2 }}>
            {variacaoSinal}{dados.variacao.toFixed(2)} · {tendenciaLabel}
          </div>
        </div>
        <div style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 4 }}>Período</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rr-text)' }}>{dados.periodo_ref}</div>
          <div style={{ fontSize: 9, color: 'var(--rr-muted)', marginTop: 2 }}>referência NOAA</div>
        </div>
        <div style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 4 }}>Situação</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: dados.cor }}>{nomeFenomeno}</div>
          <div style={{ fontSize: 9, color: 'var(--rr-muted)', marginTop: 2 }}>{dados.intensidade}</div>
        </div>
      </div>

      {/* Escala visual ONI */}
      <div style={{ background: 'var(--rr-border)', borderRadius: 3, height: 6, position: 'relative', marginBottom: 6 }}>
        <div style={{ height: 6, borderRadius: 3, background: 'linear-gradient(90deg, #1d4ed8 0%, #60a5fa 25%, #22c55e 50%, #eab308 65%, #f97316 80%, #ef4444 100%)', width: '100%' }} />
        <div style={{ position: 'absolute', top: -4, left: `${dados.ponteiro}%`, transform: 'translateX(-50%)', width: 3, height: 14, background: '#fff', borderRadius: 2 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--rr-muted)', marginBottom: 12 }}>
        <span style={{ color: '#3b82f6' }}>La Niña forte</span>
        <span>Neutro</span>
        <span style={{ color: '#ef4444' }}>El Niño forte</span>
      </div>

      {/* Impactos para Recife */}
      <div style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--rr-sub)', marginBottom: 8 }}>
          📍 Impacto esperado para Recife/PE
        </div>
        {dados.impactos.map((imp, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 11, color: 'var(--rr-sub)', lineHeight: 1.4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: dados.cor, marginTop: 4, flexShrink: 0 }} />
            {imp}
          </div>
        ))}
      </div>

      {/* Tendência histórica */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dados.tendencia_hist.length}, 1fr)`, gap: 4, marginBottom: 10 }}>
        {dados.tendencia_hist.map((t, i) => (
          <div key={i} style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: 'var(--rr-muted)', marginBottom: 3 }}>{t.periodo}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.oni >= 0.5 ? '#ef4444' : t.oni <= -0.5 ? '#60a5fa' : '#22c55e' }}>
              {t.oni >= 0 ? '+' : ''}{t.oni.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé com fonte */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--rr-muted)', borderTop: '0.5px solid var(--rr-border)', paddingTop: 8 }}>
        <span>{dados.fonte}</span>
        <span>Ref: {dados.periodo_ref} · {dados.atualizado_em}</span>
      </div>
    </div>
  )
}

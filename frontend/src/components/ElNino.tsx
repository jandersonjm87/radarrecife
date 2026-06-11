// ============================================================
//  src/components/ElNino.tsx
//  Card El Nino / La Nina com dados reais via NOAA.
// ============================================================
import { useState, useEffect } from 'react'
import api from '../services/api'
import { Tooltip } from './Tooltip'

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

  useEffect(() => {
    carregar()
    const intervalo = setInterval(carregar, 6 * 3600 * 1000)
    return () => clearInterval(intervalo)
  }, [])

  async function carregar() {
    try {
      const resp = await api.get('/elnino/')
      setDados(resp.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !dados) return null

  const sinal = dados.oni_atual >= 0 ? '+' : ''
  const variacaoSinal = dados.variacao >= 0 ? '+' : ''

  // Nome do fenomeno para o titulo
  const nomeFenomeno = dados.fenomeno === 'el_nino' ? 'El Niño'
    : dados.fenomeno === 'la_nina' ? 'La Niña'
    : 'ENOS'

  const subtituloFenomeno = dados.fenomeno === 'neutro'
    ? 'Fase Neutra'
    : `${dados.intensidade} — Ativo`

  const tendenciaLabel = dados.tendencia === 'aquecendo' ? '↑ aquecendo'
    : dados.tendencia === 'esfriando' ? '↓ esfriando'
    : '→ estável'

  const tendenciaCor = dados.tendencia === 'aquecendo' ? '#ef4444'
    : dados.tendencia === 'esfriando' ? '#60a5fa'
    : '#22c55e'

  return (
    <div style={{
      background: 'var(--rr-card)',
      border: `0.5px solid ${dados.bg === '#14532d' ? 'var(--rr-border)' : dados.bg}`,
      borderRadius: 8,
      padding: 14,
    }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 10, color: 'var(--rr-muted)', letterSpacing: '0.5px' }}>
            MONITORAMENTO CLIMÁTICO GLOBAL
          </div>
          <Tooltip texto="ENOS (El Niño-Oscilação Sul): fenômeno climático do Pacífico que altera o regime de chuvas no mundo inteiro. El Niño aquece o Pacífico e aumenta chuvas em PE. La Niña esfria e reduz. Fase Neutra = condições normais. Dados oficiais NOAA/CPC." posicao="bottom">
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--rr-text)', cursor: 'help', display: 'flex', alignItems: 'center', gap: 6 }}>
              🌊 El Niño / La Niña
              <span style={{ fontSize: 11, fontWeight: 400, color: dados.cor }}>
                — {subtituloFenomeno}
              </span>
              <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>ⓘ</span>
            </div>
          </Tooltip>
        </div>
        <span style={{ background: dados.bg, color: dados.cor, fontSize: 10, padding: '3px 8px', borderRadius: 4 }}>
          {dados.label_status}
        </span>
      </div>

      {/* Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        <div style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: 10, textAlign: 'center' }}>
          <Tooltip texto="Índice ONI (Oceanic Niño Index): mede a anomalia de temperatura da superfície do Oceano Pacífico. Valores acima de +0.5 indicam El Niño. Abaixo de -0.5 indicam La Niña. Entre -0.5 e +0.5 é considerado neutro.">
            <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 4, cursor: 'help' }}>Índice ONI ⓘ</div>
          </Tooltip>
          <div style={{ fontSize: 20, fontWeight: 700, color: dados.cor }}>
            {sinal}{dados.oni_atual.toFixed(2)}
          </div>
          <div style={{ fontSize: 9, color: tendenciaCor, marginTop: 2 }}>
            {variacaoSinal}{dados.variacao.toFixed(2)} · {tendenciaLabel}
          </div>
        </div>
        <div style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: 10, textAlign: 'center' }}>
          <Tooltip texto="Período de referência dos dados. O NOAA calcula o índice ONI como média móvel de 3 meses (ex: MAM = Março-Abril-Maio de 2026). Atualizado mensalmente.">
            <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 4, cursor: 'help' }}>Período ⓘ</div>
          </Tooltip>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--rr-text)' }}>{dados.periodo_ref}</div>
          <div style={{ fontSize: 9, color: 'var(--rr-muted)', marginTop: 2 }}>referência NOAA</div>
        </div>
        <div style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: 10, textAlign: 'center' }}>
          <Tooltip texto="Classificação atual do fenômeno com base no índice ONI oficial da NOAA. Determina se estamos em fase de El Niño, La Niña ou período neutro, e qual a intensidade do evento.">
            <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 4, cursor: 'help' }}>Situação ⓘ</div>
          </Tooltip>
          <div style={{ fontSize: 13, fontWeight: 600, color: dados.cor }}>{nomeFenomeno}</div>
          <div style={{ fontSize: 9, color: 'var(--rr-muted)', marginTop: 2 }}>{dados.intensidade}</div>
        </div>
      </div>

      {/* Escala visual */}
      {/* Barra ONI — sem Tooltip wrapper para nao quebrar width:100% */}
      <div title="Escala visual do índice ONI (-2 a +2). Azul = La Niña forte. Verde = Neutro. Vermelho = El Niño forte." style={{ cursor: 'help', marginBottom: 6 }}>
        <div style={{ position: 'relative', height: 8, borderRadius: 3, background: 'linear-gradient(90deg, #1d4ed8 0%, #60a5fa 25%, #22c55e 50%, #eab308 65%, #f97316 80%, #ef4444 100%)' }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: `${Math.min(Math.max(dados.ponteiro, 2), 98)}%`,
            transform: 'translate(-50%, -50%)',
            width: 4, height: 18,
            background: '#ffffff',
            borderRadius: 2,
            zIndex: 2,
            boxShadow: '0 0 6px rgba(255,255,255,0.9)',
          }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--rr-muted)', marginBottom: 12 }}>
        <span style={{ color: '#3b82f6' }}>La Niña forte</span>
        <span>Neutro</span>
        <span style={{ color: '#ef4444' }}>El Niño forte</span>
      </div>

      {/* Impactos */}
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
          <Tooltip key={i} texto={`${t.periodo}: ONI ${t.oni >= 0 ? '+' : ''}${t.oni.toFixed(2)} — ${t.oni >= 0.5 ? 'El Niño' : t.oni <= -0.5 ? 'La Niña' : 'Neutro'}`}>
            <div style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: '6px 4px', textAlign: 'center', width: '100%', cursor: 'help' }}>
              <div style={{ fontSize: 8, color: 'var(--rr-muted)', marginBottom: 3 }}>{t.periodo}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.oni >= 0.5 ? '#ef4444' : t.oni <= -0.5 ? '#60a5fa' : '#22c55e' }}>
                {t.oni >= 0 ? '+' : ''}{t.oni.toFixed(2)}
              </div>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Rodapé */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--rr-muted)', borderTop: '0.5px solid var(--rr-border)', paddingTop: 8 }}>
        <span>{dados.fonte}</span>
        <span>Ref: {dados.periodo_ref} · {dados.atualizado_em}</span>
      </div>
    </div>
  )
}

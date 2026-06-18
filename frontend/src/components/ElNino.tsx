// ============================================================
//  src/components/ElNino.tsx
//  Card El Nino / La Nina — linguagem popular, visual dinamico.
//  Dados reais via NOAA/CPC.
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

// Traduz o fenomeno para linguagem popular
function getInfoPopular(fenomeno: string, intensidade: string, tendencia: string, oni: number) {
  // Emoji do fenomeno
  const emoji = fenomeno === 'el_nino' ? '🌡️'
    : fenomeno === 'la_nina' ? '🌧️'
    : '✅'

  // Frase principal — o que o recifense precisa saber
  let frasePrincipal = ''
  let fraseDetalhe   = ''

  if (fenomeno === 'neutro') {
    frasePrincipal = 'Tempo dentro da normalidade'
    fraseDetalhe   = 'O Pacífico está em equilíbrio. Sem influência global nas chuvas de Recife agora.'
  } else if (fenomeno === 'el_nino') {
    if (intensidade === 'Fraco') {
      frasePrincipal = 'El Niño fraco — pouca influência'
      fraseDetalhe   = 'Pode causar chuvas um pouco acima do normal no Nordeste, mas o efeito é leve.'
    } else if (intensidade === 'Moderado') {
      frasePrincipal = 'El Niño moderado — atenção'
      fraseDetalhe   = 'Tende a aumentar as chuvas em Recife e Pernambuco. Monitore os alertas.'
    } else {
      frasePrincipal = 'El Niño forte — impacto significativo'
      fraseDetalhe   = 'Chuvas acima do normal esperadas para o Nordeste. Maior risco de alagamentos.'
    }
  } else if (fenomeno === 'la_nina') {
    if (intensidade === 'Fraco') {
      frasePrincipal = 'La Niña fraca — pouca influência'
      fraseDetalhe   = 'Pode reduzir levemente as chuvas, mas o efeito em Recife é pequeno.'
    } else if (intensidade === 'Moderado') {
      frasePrincipal = 'La Niña moderada — chuvas menores'
      fraseDetalhe   = 'Tendência de chuvas abaixo do normal no Nordeste. Veranicos mais frequentes.'
    } else {
      frasePrincipal = 'La Niña forte — seca no Nordeste'
      fraseDetalhe   = 'Risco elevado de seca e estiagem prolongada em Pernambuco. Açudes em queda.'
    }
  }

  // Tendencia em palavras
  const tendenciaTexto = tendencia === 'aquecendo'
    ? 'Índice subindo — pode intensificar'
    : tendencia === 'esfriando'
    ? 'Índice caindo — pode enfraquecer'
    : 'Índice estável'

  const tendenciaCor = tendencia === 'aquecendo' ? '#ef4444'
    : tendencia === 'esfriando' ? '#60a5fa'
    : '#22c55e'

  // O que o ONI significa em palavras
  const oniTexto = oni >= 1.5 ? 'Muito alto'
    : oni >= 0.9 ? 'Alto'
    : oni >= 0.5 ? 'Elevado'
    : oni <= -1.5 ? 'Muito baixo'
    : oni <= -0.9 ? 'Baixo'
    : oni <= -0.5 ? 'Reduzido'
    : 'Normal'

  return { emoji, frasePrincipal, fraseDetalhe, tendenciaTexto, tendenciaCor, oniTexto }
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
  const info  = getInfoPopular(dados.fenomeno, dados.intensidade, dados.tendencia, dados.oni_atual)

  return (
    <div style={{
      background: 'var(--rr-card)',
      border: '0.5px solid var(--rr-border)',
      borderRadius: 8,
      padding: 14,
    }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 3 }}>
            Clima global · impacto em Recife/PE
          </div>
          <Tooltip
            texto="El Niño e La Niña são fenômenos do Oceano Pacífico que alteram o regime de chuvas no mundo todo. Em Recife, o El Niño tende a trazer mais chuva e a La Niña menos chuva. Dados oficiais da NOAA (agência meteorológica dos EUA), atualizados mensalmente."
            posicao="bottom"
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--rr-text)', cursor: 'help', display: 'flex', alignItems: 'center', gap: 6 }}>
              {info.emoji} {info.frasePrincipal}
              <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>ⓘ</span>
            </div>
          </Tooltip>
        </div>
        {/* Badge de status */}
        <span style={{
          background: dados.bg,
          color: dados.cor,
          fontSize: 10,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {dados.label_status}
        </span>
      </div>

      {/* Frase de impacto — o que isso significa pra Recife */}
      <div style={{
        background: `${dados.cor}15`,
        border: `0.5px solid ${dados.cor}44`,
        borderRadius: 6,
        padding: '10px 12px',
        marginBottom: 12,
        fontSize: 11,
        color: 'var(--rr-sub)',
        lineHeight: 1.5,
      }}>
        {info.fraseDetalhe}
      </div>

      {/* Medidor visual — barra ONI */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>Termômetro do Pacífico</span>
          <Tooltip texto="Índice ONI: mede a temperatura anômala do Oceano Pacífico. Acima de +0.5 = El Niño ativo. Abaixo de -0.5 = La Niña ativa. Entre os dois = Neutro.">
            <span style={{ fontSize: 10, color: 'var(--rr-muted)', cursor: 'help' }}>
              {sinal}{dados.oni_atual.toFixed(2)} · {info.oniTexto} ⓘ
            </span>
          </Tooltip>
        </div>

        {/* Barra colorida com ponteiro */}
        <div style={{ position: 'relative', height: 10, borderRadius: 5, background: 'linear-gradient(90deg, #1d4ed8 0%, #60a5fa 25%, #22c55e 50%, #eab308 65%, #f97316 80%, #ef4444 100%)' }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: `${Math.min(Math.max(dados.ponteiro, 2), 98)}%`,
            transform: 'translate(-50%, -50%)',
            width: 4, height: 20,
            background: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 0 6px rgba(255,255,255,0.9)',
          }} />
        </div>

        {/* Labels da barra */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--rr-muted)', marginTop: 4 }}>
          <span style={{ color: '#3b82f6' }}>☂️ La Niña — menos chuva</span>
          <span>Normal</span>
          <span style={{ color: '#ef4444' }}>🌧️ El Niño — mais chuva</span>
        </div>
      </div>

      {/* Tendência atual */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--rr-surface)', borderRadius: 6,
        padding: '8px 12px', marginBottom: 12,
      }}>
        <span style={{ fontSize: 16 }}>
          {dados.tendencia === 'aquecendo' ? '📈' : dados.tendencia === 'esfriando' ? '📉' : '➡️'}
        </span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: info.tendenciaCor }}>
            {info.tendenciaTexto}
          </div>
          <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginTop: 1 }}>
            Referência: {dados.periodo_ref} · NOAA/CPC
          </div>
        </div>
      </div>

      {/* Impactos para Recife — linguagem direta */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--rr-sub)', marginBottom: 8, fontWeight: 500 }}>
          📍 O que esperar em Recife agora:
        </div>
        {dados.impactos.map((imp, i) => (
          <div key={i} style={{
            display: 'flex', gap: 8, marginBottom: 5,
            fontSize: 11, color: 'var(--rr-sub)', lineHeight: 1.4,
          }}>
            <span style={{ color: dados.cor, flexShrink: 0 }}>•</span>
            {imp}
          </div>
        ))}
      </div>

      {/* Histórico — mini barras visuais */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 6 }}>
          Histórico recente
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dados.tendencia_hist.length}, 1fr)`, gap: 4 }}>
          {dados.tendencia_hist.map((t, i) => {
            const corBarra = t.oni >= 0.5 ? '#ef4444' : t.oni <= -0.5 ? '#60a5fa' : '#22c55e'
            const labelFase = t.oni >= 0.5 ? 'El Niño' : t.oni <= -0.5 ? 'La Niña' : 'Normal'
            const alturaBarra = Math.min(Math.abs(t.oni) * 30 + 8, 40)
            return (
              <Tooltip key={i} texto={`${t.periodo}: ${labelFase} (${t.oni >= 0 ? '+' : ''}${t.oni.toFixed(2)})`}>
                <div style={{ textAlign: 'center', cursor: 'help', width: '100%' }}>
                  {/* Mini barra proporcional */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: 44, marginBottom: 3 }}>
                    <div style={{
                      width: '60%',
                      height: alturaBarra,
                      background: corBarra,
                      borderRadius: '3px 3px 0 0',
                      opacity: i === dados.tendencia_hist.length - 1 ? 1 : 0.6,
                      transition: 'height 0.3s',
                    }} />
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--rr-muted)', marginBottom: 1 }}>{t.periodo}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: corBarra }}>
                    {t.oni >= 0 ? '+' : ''}{t.oni.toFixed(2)}
                  </div>
                </div>
              </Tooltip>
            )
          })}
        </div>
      </div>

      {/* Rodapé */}
      <div style={{
        fontSize: 9, color: 'var(--rr-muted)',
        borderTop: '0.5px solid var(--rr-border)',
        paddingTop: 8,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>{dados.fonte}</span>
        <span>Ref. {dados.periodo_ref} · {dados.atualizado_em}</span>
      </div>
    </div>
  )
}

// ============================================================
//  src/components/NoticiasInteligentes.tsx
//  Card de noticias climaticas com analise de impacto.
//  Exibe apenas noticias com contexto climatico verificado.
//  Some automaticamente quando so ha boletim verde.
// ============================================================
import { useState, useEffect } from 'react'
import { noticiasApi } from '../services/api'

interface Noticia {
  titulo: string
  descricao: string
  link: string
  fonte: string
  data: string
  tempo_relativo: string
  nivel: string
  tipo: string
  confianca: number
  bairros: string[]
  rodovias: string[]
  impacta_ira: boolean
}

interface Resumo {
  criticas: number
  alertas: number
  atencoes: number
  bairros_afetados: string[]
  rodovias_afetadas: string[]
  ira_atual: number
  nivel_atual: string
}

const NIVEL_CONFIG: Record<string, { cor: string; bg: string; label: string }> = {
  vermelho: { cor: '#fca5a5', bg: '#7f1d1d', label: 'Crítico' },
  laranja:  { cor: '#fdba74', bg: '#7c2d12', label: 'Alerta' },
  amarelo:  { cor: '#fde68a', bg: '#713f12', label: 'Atenção' },
  verde:    { cor: '#86efac', bg: '#14532d', label: 'Normal' },
}

const TIPO_LABEL: Record<string, string> = {
  boletim_automatico: '📡 Boletim',
  ocorrencia:         '⚠️ Ocorrência',
  previsao:           '🔭 Previsão',
  clima_geral:        '🌤️ Clima',
}

export function NoticiasInteligentes() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<number | null>(null)
  const [atualizadoEm, setAtualizadoEm] = useState('')

  useEffect(() => {
    carregar()
    const intervalo = setInterval(carregar, 600000)
    return () => clearInterval(intervalo)
  }, [])

  async function carregar() {
    try {
      const resp = await noticiasApi.listar()
      setNoticias(resp.data.noticias)
      setResumo(resp.data.resumo)
      setAtualizadoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return null

  // Separa boletim automatico das noticias reais
  const boletim  = noticias.find(n => n.tipo === 'boletim_automatico')
  const reais    = noticias.filter(n => n.tipo !== 'boletim_automatico')
  const temAlerta = reais.some(n => ['amarelo', 'laranja', 'vermelho'].includes(n.nivel))

  // Cor da borda baseada no nivel mais alto
  const nivelMax = reais.reduce((max, n) => {
    const ordem = ['verde', 'amarelo', 'laranja', 'vermelho']
    return ordem.indexOf(n.nivel) > ordem.indexOf(max) ? n.nivel : max
  }, 'verde')

  const corBorda = temAlerta
    ? NIVEL_CONFIG[nivelMax]?.cor || 'var(--rr-border)'
    : 'var(--rr-border)'

  return (
    <div style={{
      background: 'var(--rr-card)',
      border: `0.5px solid ${corBorda}`,
      borderRadius: 8,
      padding: 14,
    }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {temAlerta && (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: NIVEL_CONFIG[nivelMax]?.cor, boxShadow: `0 0 6px ${NIVEL_CONFIG[nivelMax]?.cor}` }} />
          )}
          <span style={{ fontSize: 11, color: 'var(--rr-sub)' }}>
            Noticias e alertas climaticos
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>
          {atualizadoEm ? `Atualizado ${atualizadoEm}` : ''}
        </span>
      </div>

      {/* Resumo de impacto — aparece só quando tem alertas */}
      {resumo && (resumo.criticas > 0 || resumo.alertas > 0 || resumo.atencoes > 0) && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {resumo.criticas > 0 && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#7f1d1d', color: '#fca5a5' }}>
              {resumo.criticas} crítica{resumo.criticas > 1 ? 's' : ''}
            </span>
          )}
          {resumo.alertas > 0 && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#7c2d12', color: '#fdba74' }}>
              {resumo.alertas} alerta{resumo.alertas > 1 ? 's' : ''}
            </span>
          )}
          {resumo.atencoes > 0 && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#713f12', color: '#fde68a' }}>
              {resumo.atencoes} atenção
            </span>
          )}
          {resumo.bairros_afetados.length > 0 && (
            <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>
              Bairros: {resumo.bairros_afetados.slice(0, 3).join(', ')}
              {resumo.bairros_afetados.length > 3 ? ` +${resumo.bairros_afetados.length - 3}` : ''}
            </span>
          )}
        </div>
      )}

      {/* Boletim automático */}
      {boletim && (
        <div style={{
          background: 'var(--rr-surface)',
          border: `0.5px solid ${NIVEL_CONFIG[boletim.nivel]?.cor || 'var(--rr-border)'}22`,
          borderRadius: 6, padding: '10px 12px', marginBottom: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--rr-text)', marginBottom: 4 }}>
                {boletim.titulo}
              </div>
              <div style={{ fontSize: 10, color: 'var(--rr-muted)' }}>{boletim.descricao}</div>
            </div>
            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: NIVEL_CONFIG[boletim.nivel]?.bg, color: NIVEL_CONFIG[boletim.nivel]?.cor, whiteSpace: 'nowrap' }}>
              {NIVEL_CONFIG[boletim.nivel]?.label}
            </span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--rr-muted)', marginTop: 6 }}>
            📡 Radar Recife · {boletim.data}
          </div>
        </div>
      )}

      {/* Noticias reais */}
      {reais.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--rr-muted)', textAlign: 'center', padding: '8px 0' }}>
          Nenhuma ocorrencia climatica confirmada no momento
        </div>
      ) : (
        reais.map((n, i) => {
          const config = NIVEL_CONFIG[n.nivel] || NIVEL_CONFIG.verde
          const aberto = expandido === i
          return (
            <div
              key={i}
              onClick={() => setExpandido(aberto ? null : i)}
              style={{
                borderBottom: i < reais.length - 1 ? '0.5px solid var(--rr-border)' : 'none',
                padding: '10px 0',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: config.bg, color: config.cor }}>
                      {config.label}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--rr-muted)' }}>
                      {TIPO_LABEL[n.tipo] || n.tipo}
                    </span>
                    {n.confianca >= 75 && (
                      <span style={{ fontSize: 9, color: '#22c55e' }}>✓ verificado</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--rr-text)', marginBottom: 4, lineHeight: 1.4 }}>
                    {n.titulo}
                  </div>
                  {aberto && (
                    <>
                      <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 6, lineHeight: 1.5 }}>
                        {n.descricao}
                      </div>
                      {(n.bairros.length > 0 || n.rodovias.length > 0) && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                          {n.bairros.map(b => (
                            <span key={b} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'var(--rr-surface)', border: '0.5px solid var(--rr-border)', color: 'var(--rr-blue-l)' }}>
                              📍 {b}
                            </span>
                          ))}
                          {n.rodovias.map(r => (
                            <span key={r} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'var(--rr-surface)', border: '0.5px solid var(--rr-border)', color: '#f97316' }}>
                              🛣️ {r}
                            </span>
                          ))}
                        </div>
                      )}
                      {n.link && (
                        <a href={n.link} target="_blank" rel="noreferrer"
                          style={{ fontSize: 9, color: 'var(--rr-blue-l)', textDecoration: 'none' }}
                          onClick={e => e.stopPropagation()}>
                          Ver notícia completa →
                        </a>
                      )}
                    </>
                  )}
                  <div style={{ fontSize: 9, color: 'var(--rr-muted)', marginTop: 4 }}>
                    {n.fonte} · {n.tempo_relativo || n.data}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

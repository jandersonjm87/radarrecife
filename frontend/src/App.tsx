// ============================================================
//  src/App.tsx
//  Componente principal do Radar Recife.
//  Geolocalização automática com fallback para Recife centro.
// ============================================================

import { useState, useEffect } from 'react'
import {
  Cloud, Droplets, Thermometer, AlertTriangle,
  CloudRain, Sun, CloudLightning, MapPin,
} from 'lucide-react'
import { Header } from './components/Header'
import { MetricCard } from './components/MetricCard'
import { AlertaBanner } from './components/AlertaBanner'
import { IRA } from './components/IRA'
import { BairrosLista } from './components/BairrosLista'
import { MapaRecife } from './components/MapaRecife'
import { Rodovias } from './components/Rodovias'
import { ElNino } from './components/ElNino'
import { climaApi, bairrosApi } from './services/api'
import api from './services/api'

// Coordenadas padrao — Marco Zero, Recife
const RECIFE_LAT = -8.0631
const RECIFE_LNG = -34.8711

const NIVEL_COR: Record<string, string> = {
  verde:    'var(--rr-green)',
  amarelo:  'var(--rr-yellow)',
  laranja:  'var(--rr-orange)',
  vermelho: 'var(--rr-red)',
}

function analisarCondicao(codigo?: number, volume?: number, uv?: number) {
  const vol = volume || 0
  const uvVal = uv || 0
  const cod = codigo || 0

  if (cod >= 95) return {
    icone: <CloudLightning size={20} color="#f97316" />,
    label: 'Tempestade', intensidade: 'Risco de raios',
    cor: '#f97316', escala: 4,
  }
  if (cod >= 80 || vol > 10) return {
    icone: <CloudRain size={20} color="#ef4444" />,
    label: 'Chuva forte', intensidade: `${vol}mm/h`,
    cor: '#ef4444', escala: 4,
  }
  if (cod >= 61 || vol > 2) return {
    icone: <CloudRain size={20} color="#f97316" />,
    label: 'Chuva moderada', intensidade: `${vol}mm/h`,
    cor: '#f97316', escala: 3,
  }
  if (cod >= 51 || vol > 0.1) return {
    icone: <CloudRain size={20} color="#60a5fa" />,
    label: 'Garoa', intensidade: `${vol}mm/h`,
    cor: '#60a5fa', escala: 1,
  }
  if (cod >= 2) return {
    icone: <Cloud size={20} color="#94a3b8" />,
    label: 'Nublado', intensidade: 'Sem chuva prevista',
    cor: '#94a3b8', escala: 0,
  }
  const uvLabel = uvVal <= 2 ? 'Baixo' : uvVal <= 5 ? 'Moderado' : uvVal <= 7 ? 'Alto' : uvVal <= 10 ? 'Muito alto' : 'Extremo'
  const uvCor   = uvVal <= 2 ? '#22c55e' : uvVal <= 5 ? '#eab308' : uvVal <= 7 ? '#f97316' : '#ef4444'
  return {
    icone: <Sun size={20} color="#fbbf24" />,
    label: 'Tempo aberto', intensidade: `UV ${uvVal} — ${uvLabel}`,
    cor: uvCor, escala: Math.min(Math.round(uvVal / 3), 4),
  }
}

function getIconeHora(prob: number): string {
  if (prob >= 80) return '⛈️'
  if (prob >= 60) return '🌧️'
  if (prob >= 40) return '🌦️'
  if (prob >= 20) return '🌤️'
  return '☀️'
}

function getCorProb(prob: number): string {
  if (prob >= 80) return '#ef4444'
  if (prob >= 60) return '#f97316'
  if (prob >= 40) return '#eab308'
  return '#22c55e'
}

function App() {
  const [clima, setClima] = useState<any>(null)
  const [previsao, setPrevisao] = useState<any[]>([])
  const [bairros, setBairros] = useState<any[]>([])
  const [bairroSelecionado, setBairroSelecionado] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [localidade, setLocalidade] = useState<string>('')
  const [coordenadas, setCoordenadas] = useState({ lat: RECIFE_LAT, lng: RECIFE_LNG })
  const [geoNegada, setGeoNegada] = useState(false)

  // Detecta localização ao abrir
  useEffect(() => {
    detectarLocalizacao()
  }, [])

  // Busca dados sempre que coordenadas mudam
  useEffect(() => {
    buscarDados()
    const intervalo = setInterval(buscarDados, 600000)
    return () => clearInterval(intervalo)
  }, [coordenadas])

  async function detectarLocalizacao() {
    if (!navigator.geolocation) {
      setLocalidade('Recife, PE')
      setGeoNegada(true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoordenadas({ lat, lng })

        // Reverse geocoding gratuito via Nominatim (OpenStreetMap)
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`
          )
          const geo = await resp.json()
          const cidade = geo.address?.city
            || geo.address?.town
            || geo.address?.village
            || geo.address?.county
            || 'Sua localização'
          const estado = geo.address?.state_code?.toUpperCase() || ''
          setLocalidade(`${cidade}${estado ? ', ' + estado : ''}`)
        } catch {
          setLocalidade('Sua localização')
        }
      },
      () => {
        // Permissão negada — usa Recife
        setLocalidade('Recife, PE')
        setGeoNegada(true)
      },
      { timeout: 8000 }
    )
  }

  async function buscarDados() {
    try {
      const { lat, lng } = coordenadas

      const [climaResp, previsaoResp, bairrosResp] = await Promise.all([
        api.get(`/clima/bairro/${lat}/${lng}?nome=${encodeURIComponent(localidade || 'Sua localização')}`),
        api.get(`/clima/previsao`),
        bairrosApi.ranking(),
      ])

      setClima(climaResp.data)

      // Filtra proximas 8 horas da previsao
      const agora = new Date()
      const horaAtual = agora.getHours()
      const proximas = previsaoResp.data
        .filter((_: any, i: number) => i >= horaAtual && i < horaAtual + 8)
        .map((p: any) => ({
          hora: new Date(p.hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          temperatura: p.temperatura ?? 0,
          prob_chuva: p.prob_chuva ?? 0,
          volume_chuva: p.volume_chuva ?? 0,
        }))
      setPrevisao(proximas)

      const lista = bairrosResp.data.bairros.map((b: any) => ({ ...b }))
      setBairros(lista)
      setBairroSelecionado((prev: any) => {
        if (prev) return prev
        return lista.find((b: any) => b.nome === 'Recife') || lista[0] || null
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const hora = clima?.atualizado_em?.split(' ')[1]?.substring(0, 5) || '--:--'
  const corNivel = NIVEL_COR[clima?.nivel] || 'var(--rr-green)'
  const condicao = analisarCondicao(clima?.codigo_tempo, clima?.volume_chuva, clima?.indice_uv)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--rr-bg)' }}>
      <Header localidade={localidade} />

      <div style={{ padding: '12px 16px' }}>

        {/* Aviso se geo negada */}
        {geoNegada && (
          <div style={{
            background: '#0b1628',
            border: '0.5px solid var(--rr-border)',
            borderRadius: 8, padding: '8px 14px',
            marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <MapPin size={12} color="var(--rr-muted)" />
            <span style={{ fontSize: 11, color: 'var(--rr-muted)' }}>
              Localização não detectada — exibindo dados de Recife centro.
              <span
                onClick={detectarLocalizacao}
                style={{ color: 'var(--rr-blue-l)', cursor: 'pointer', marginLeft: 6 }}
              >
                Tentar novamente
              </span>
            </span>
          </div>
        )}

        {clima && clima.nivel !== 'verde' && (
          <AlertaBanner
            nivel={clima.nivel}
            mensagem={`${clima.descricao_tempo} em ${localidade || 'Recife'}. IRA: ${clima.ira} — ${
              clima.nivel === 'vermelho' ? 'Risco alto de alagamento.' :
              clima.nivel === 'laranja'  ? 'Fique atento aos alertas.' :
              'Condicoes de atencao.'
            }`}
            emitidoEm={hora}
          />
        )}

        {/* Painel do bairro selecionado */}
        {bairroSelecionado && (
          <div style={{
            background: '#0b1628',
            border: `0.5px solid ${NIVEL_COR[bairroSelecionado.nivel] || 'var(--rr-blue)'}`,
            borderRadius: 8, padding: '10px 16px', marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--rr-blue-l)', fontWeight: 500 }}>
                  Bairro selecionado:
                </span>
                <span style={{ fontSize: 13, color: 'var(--rr-text)', marginLeft: 8, fontWeight: 600 }}>
                  {bairroSelecionado.nome}
                </span>
                <span style={{
                  fontSize: 11, marginLeft: 10, fontWeight: 500,
                  color: NIVEL_COR[bairroSelecionado.nivel] || 'var(--rr-green)',
                }}>
                  IRA {bairroSelecionado.ira} — {bairroSelecionado.nivel?.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => {
                  const recife = bairros.find(b => b.nome === 'Recife') || bairros[0]
                  setBairroSelecionado(recife)
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--rr-muted)', cursor: 'pointer', fontSize: 11 }}
              >
                voltar ao centro
              </button>
            </div>
            {bairroSelecionado.motivos?.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {bairroSelecionado.motivos.map((m: string, i: number) => (
                  <span key={i} style={{
                    fontSize: 10, color: 'var(--rr-muted)',
                    background: 'var(--rr-surface)',
                    border: '0.5px solid var(--rr-border)',
                    borderRadius: 4, padding: '2px 8px',
                  }}>{m}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

          {/* Coluna esquerda — mapa e lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <MapaRecife
              bairros={bairros}
              onBairroClick={setBairroSelecionado}
              atualizadoEm={hora}
            />
            <div style={{ height: 300 }}>
              <BairrosLista onBairroClick={setBairroSelecionado} />
            </div>
          </div>

          {/* Coluna direita — metricas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Temperatura e IRA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <MetricCard
                label="Temperatura"
                value={loading ? '...' : `${clima?.temperatura ?? '--'}°C`}
                sub={`Sensacao ${clima?.sensacao_termica ?? '--'}°C`}
                atualizadoEm={hora}
                icon={<Thermometer size={13} color="var(--rr-blue-l)" />}
              />
              <MetricCard
                label="IRA — Risco Atual"
                value={loading ? '...' : clima?.ira ?? '--'}
                sub={clima?.nivel ?? ''}
                atualizadoEm={hora}
                cor={corNivel}
                icon={<AlertTriangle size={13} color="var(--rr-blue-l)" />}
              />
            </div>

            {/* Condicao atual com escala visual */}
            <div style={{
              background: 'var(--rr-card)',
              border: '0.5px solid var(--rr-border)',
              borderRadius: 8, padding: '12px 14px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--rr-sub)', marginBottom: 10 }}>
                Condicao atual
              </div>
              {loading ? (
                <div style={{ color: 'var(--rr-muted)', fontSize: 12 }}>Carregando...</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {condicao.icone}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rr-text)' }}>
                      {condicao.label}
                    </div>
                    <div style={{ fontSize: 11, color: condicao.cor, marginTop: 2 }}>
                      {condicao.intensidade}
                    </div>
                    <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          height: 4, flex: 1, borderRadius: 2,
                          background: i <= condicao.escala ? condicao.cor : 'var(--rr-border)',
                        }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginTop: 3 }}>
                      Vento {clima?.velocidade_vento ?? '--'} km/h · Pressao {clima?.pressao ?? '--'} hPa
                    </div>
                  </div>
                </div>
              )}
              <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginTop: 8 }}>
                Atualizado {hora}
              </div>
            </div>

            {/* Umidade e Acumulados */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <MetricCard
                label="Umidade"
                value={loading ? '...' : `${clima?.umidade ?? '--'}%`}
                sub={`Chuva: ${clima?.volume_chuva ?? '--'}mm · Prob. ${clima?.prob_chuva ?? '--'}%`}
                atualizadoEm={hora}
                icon={<Droplets size={13} color="var(--rr-blue-l)" />}
              />
              <div style={{
                background: 'var(--rr-card)',
                border: '0.5px solid var(--rr-border)',
                borderRadius: 8, padding: '10px 14px',
              }}>
                <div style={{ fontSize: 11, color: 'var(--rr-sub)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Cloud size={13} color="var(--rr-blue-l)" />
                  Acumulado de chuva
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {[
                    { label: '24h', valor: clima?.acumulado_24h },
                    { label: '48h', valor: clima?.acumulado_48h },
                    { label: '72h', valor: clima?.acumulado_72h },
                  ].map(({ label, valor }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--rr-text)' }}>
                        {loading ? '...' : `${valor ?? '--'}`}
                        <span style={{ fontSize: 10, color: 'var(--rr-muted)', marginLeft: 2 }}>mm</span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginTop: 8 }}>Atualizado {hora}</div>
              </div>
            </div>

            <IRA valor={clima?.ira ?? 0} atualizadoEm={hora} />

            {/* Previsao hora a hora — integrada, com label da localidade */}
            <div style={{
              background: 'var(--rr-card)',
              border: '0.5px solid var(--rr-border)',
              borderRadius: 8, padding: 14,
            }}>
              <div style={{
                fontSize: 11, color: 'var(--rr-sub)',
                marginBottom: 12,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={11} color="var(--rr-blue-l)" />
                  <span>Previsao hora a hora — <span style={{ color: 'var(--rr-blue-l)' }}>{localidade || 'Recife, PE'}</span></span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>proximas 8h</span>
              </div>

              {loading || previsao.length === 0 ? (
                <div style={{ color: 'var(--rr-muted)', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>
                  Carregando previsao...
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
                  {previsao.map((p, i) => (
                    <div key={i} style={{
                      background: 'var(--rr-surface)',
                      border: '0.5px solid var(--rr-border)',
                      borderRadius: 6, padding: '8px 4px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 4 }}>{p.hora}</div>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{getIconeHora(p.prob_chuva)}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: getCorProb(p.prob_chuva) }}>
                        {p.prob_chuva}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginTop: 2 }}>{p.temperatura}°C</div>
                      {p.volume_chuva > 0 && (
                        <div style={{ fontSize: 9, color: 'var(--rr-blue-l)', marginTop: 2 }}>{p.volume_chuva}mm</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Rodovias />
            <ElNino />

            <div style={{
              background: 'var(--rr-card)',
              border: '0.5px solid var(--rr-border)',
              borderRadius: 8, padding: 14,
            }}>
              <div style={{ fontSize: 11, color: 'var(--rr-sub)', marginBottom: 10 }}>Noticias locais agora</div>
              <div style={{ fontSize: 11, color: 'var(--rr-muted)', textAlign: 'center', padding: '10px 0' }}>
                Feed de noticias — em breve
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default App

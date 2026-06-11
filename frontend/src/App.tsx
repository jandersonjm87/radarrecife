// ============================================================
//  src/App.tsx
//  Componente principal do Radar Recife.
// ============================================================

import { useState, useEffect } from 'react'
import {
  Cloud, Droplets, Thermometer, AlertTriangle,
  CloudRain, Sun, CloudLightning, MapPin, Wind,
  Eye, Gauge, Leaf,
} from 'lucide-react'
import { Header } from './components/Header'
import { AlertaBanner } from './components/AlertaBanner'
import { IRA } from './components/IRA'
import { BairrosLista } from './components/BairrosLista'
import { MapaRecife } from './components/MapaRecife'
import { Rodovias } from './components/Rodovias'
import { Tooltip } from './components/Tooltip'
import { ElNino } from './components/ElNino'
import { NoticiasInteligentes } from './components/NoticiasInteligentes'
import { climaApi, bairrosApi } from './services/api'
import api from './services/api'

const RECIFE_LAT = -8.0631
const RECIFE_LNG = -34.8711

const NIVEL_COR: Record<string, string> = {
  verde:    '#22c55e',
  amarelo:  '#eab308',
  laranja:  '#f97316',
  vermelho: '#ef4444',
}

function analisarCondicao(codigo?: number, volume?: number, uv?: number) {
  const vol = volume || 0
  const uvVal = uv || 0
  const cod = codigo || 0
  if (cod >= 95) return { icone: <CloudLightning size={28} color="#f97316" />, label: 'Tempestade', intensidade: 'Risco de raios', cor: '#f97316', escala: 4 }
  if (cod >= 80 || vol > 10) return { icone: <CloudRain size={28} color="#ef4444" />, label: 'Chuva forte', intensidade: `${vol}mm/h`, cor: '#ef4444', escala: 4 }
  if (cod >= 61 || vol > 2) return { icone: <CloudRain size={28} color="#f97316" />, label: 'Chuva moderada', intensidade: `${vol}mm/h`, cor: '#f97316', escala: 3 }
  if (cod >= 51 || vol > 0.1) return { icone: <CloudRain size={28} color="#60a5fa" />, label: 'Garoa', intensidade: `${vol}mm/h`, cor: '#60a5fa', escala: 1 }
  if (cod >= 2) return { icone: <Cloud size={28} color="#94a3b8" />, label: 'Nublado', intensidade: 'Sem chuva prevista', cor: '#94a3b8', escala: 0 }
  const uvLabel = uvVal <= 2 ? 'Baixo' : uvVal <= 5 ? 'Moderado' : uvVal <= 7 ? 'Alto' : uvVal <= 10 ? 'Muito alto' : 'Extremo'
  const uvCor = uvVal <= 2 ? '#22c55e' : uvVal <= 5 ? '#eab308' : uvVal <= 7 ? '#f97316' : '#ef4444'
  return { icone: <Sun size={28} color="#fbbf24" />, label: 'Tempo aberto', intensidade: `UV ${uvVal} — ${uvLabel}`, cor: uvCor, escala: Math.min(Math.round(uvVal / 3), 4) }
}

function getIconeHora(prob: number, codigo?: number, horaStr?: string): string {
  // Determina se e dia ou noite baseado na hora
  let ehNoite = false
  if (horaStr) {
    try {
      const h = new Date(horaStr).getHours()
      ehNoite = h < 6 || h >= 18
    } catch { ehNoite = false }
  }

  const cod = codigo || 0

  // Tempestade — sempre o mesmo
  if (cod >= 95 || prob >= 90) return '⛈️'

  // Chuva forte
  if (cod >= 80 || prob >= 70) return '🌧️'

  // Chuva moderada
  if (cod >= 61 || prob >= 50) return ehNoite ? '🌧️' : '🌦️'

  // Garoa / chuva leve
  if (cod >= 51 || prob >= 30) return ehNoite ? '🌦️' : '🌦️'

  // Neblina
  if (cod === 45 || cod === 48) return '🌫️'

  // Nublado
  if (cod === 3) return '☁️'

  // Parcialmente nublado
  if (cod === 2) return ehNoite ? '🌙' : '⛅'

  // Principalmente limpo
  if (cod === 1) return ehNoite ? '🌙' : '🌤️'

  // Ceu limpo
  if (prob >= 20) return ehNoite ? '🌙' : '🌤️'
  return ehNoite ? '🌙' : '☀️'
}

function getCorProb(prob: number): string {
  if (prob >= 80) return '#ef4444'
  if (prob >= 60) return '#f97316'
  if (prob >= 40) return '#eab308'
  return '#22c55e'
}

function dirVento(graus?: number): string {
  if (graus == null) return '--'
  const dirs = ['N','NE','L','SE','S','SO','O','NO']
  return dirs[Math.round(graus / 45) % 8]
}

function App() {
  const [clima, setClima] = useState<any>(null)
  const [previsao, setPrevisao] = useState<any[]>([])
  const [bairros, setBairros] = useState<any[]>([])
  const [bairroSelecionado, setBairroSelecionado] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [localidade, setLocalidade] = useState('')
  const [coordenadas, setCoordenadas] = useState({ lat: RECIFE_LAT, lng: RECIFE_LNG })
  const [geoNegada, setGeoNegada] = useState(false)

  useEffect(() => { detectarLocalizacao() }, [])

  useEffect(() => {
    buscarDados()
    const intervalo = setInterval(buscarDados, 600000)
    return () => clearInterval(intervalo)
  }, [coordenadas])

  async function detectarLocalizacao() {
    if (!navigator.geolocation) { setLocalidade('Recife, PE'); setGeoNegada(true); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoordenadas({ lat, lng })
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR`)
          const geo = await resp.json()
          const cidade = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || 'Sua localização'
          const estado = geo.address?.state_code?.toUpperCase() || ''
          setLocalidade(`${cidade}${estado ? ', ' + estado : ''}`)
        } catch { setLocalidade('Sua localização') }
      },
      () => { setLocalidade('Recife, PE'); setGeoNegada(true) },
      { timeout: 8000 }
    )
  }

  async function buscarDados() {
    try {
      const { lat, lng } = coordenadas
      const [climaResp, previsaoResp, bairrosResp] = await Promise.all([
        api.get(`/clima/bairro/${lat}/${lng}?nome=${encodeURIComponent(localidade || 'Sua localização')}`),
        api.get('/clima/previsao'),
        bairrosApi.ranking(),
      ])
      setClima(climaResp.data)
      const agora = new Date()
      // Pega todas as horas futuras — se tiver menos de 8, completa com proximas do dia
      const futuras = previsaoResp.data
        .filter((p: any) => new Date(p.hora) >= agora)

      // Se tiver menos de 8 horas, busca do inicio do array para completar
      const listaPrevisao = futuras.length >= 8
        ? futuras.slice(0, 8)
        : [...futuras, ...previsaoResp.data.slice(0, 8 - futuras.length)]

      const proximas = listaPrevisao.slice(0, 8).map((p: any, i: number) => ({
        hora: i === 0 ? 'Agora' : new Date(p.hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        hora_raw: p.hora,
        temperatura: p.temperatura ?? 0,
        prob_chuva: p.prob_chuva ?? 0,
        volume_chuva: p.volume_chuva ?? 0,
        codigo_tempo: p.codigo_tempo ?? 0,
      }))
      setPrevisao(proximas)
      const lista = bairrosResp.data.bairros.map((b: any) => ({ ...b }))
      setBairros(lista)
      setBairroSelecionado((prev: any) => {
        if (prev) return prev
        return lista.find((b: any) => b.nome === 'Recife') || lista[0] || null
      })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const hora = clima?.atualizado_em?.split(' ')[1]?.substring(0, 5) || '--:--'
  const corNivel = NIVEL_COR[clima?.nivel] || '#22c55e'
  const condicao = analisarCondicao(clima?.codigo_tempo, clima?.volume_chuva, clima?.indice_uv)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--rr-bg)' }}>
      <Header localidade={localidade} />
      <div style={{ padding: '12px 16px' }}>

        {geoNegada && (
          <div style={{ background: '#0b1628', border: '0.5px solid var(--rr-border)', borderRadius: 8, padding: '8px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={12} color="var(--rr-muted)" />
            <span style={{ fontSize: 11, color: 'var(--rr-muted)' }}>
              Localização não detectada — exibindo dados de Recife centro.
              <span onClick={detectarLocalizacao} style={{ color: 'var(--rr-blue-l)', cursor: 'pointer', marginLeft: 6 }}>Tentar novamente</span>
            </span>
          </div>
        )}

        {clima && clima.nivel !== 'verde' && (
          <AlertaBanner
            nivel={clima.nivel}
            mensagem={`${clima.descricao_tempo} em ${localidade || 'Recife'}. IRA: ${clima.ira} — ${clima.nivel === 'vermelho' ? 'Risco alto de alagamento.' : clima.nivel === 'laranja' ? 'Fique atento aos alertas.' : 'Condicoes de atencao.'}`}
            emitidoEm={hora}
          />
        )}

        {/* Painel bairro selecionado */}
        {bairroSelecionado && (
          <div style={{ background: '#0b1628', border: `0.5px solid ${NIVEL_COR[bairroSelecionado.nivel] || '#1e3a5f'}`, borderRadius: 8, padding: '10px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--rr-blue-l)', fontWeight: 500 }}>Bairro selecionado:</span>
                <span style={{ fontSize: 13, color: 'var(--rr-text)', fontWeight: 600 }}>{bairroSelecionado.nome}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: NIVEL_COR[bairroSelecionado.nivel] || '#22c55e' }}>
                  IRA {bairroSelecionado.ira} — {bairroSelecionado.nivel?.toUpperCase()}
                </span>
                {/* Condicao atual no painel do bairro */}
                <span style={{ fontSize: 11, color: condicao.cor, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {condicao.label} · {condicao.intensidade}
                </span>
              </div>
              <button onClick={() => { const r = bairros.find(b => b.nome === 'Recife') || bairros[0]; setBairroSelecionado(r) }}
                style={{ background: 'transparent', border: 'none', color: 'var(--rr-muted)', cursor: 'pointer', fontSize: 11 }}>
                voltar ao centro
              </button>
            </div>
            {bairroSelecionado.motivos?.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {bairroSelecionado.motivos.map((m: string, i: number) => (
                  <span key={i} style={{ fontSize: 10, color: 'var(--rr-muted)', background: 'var(--rr-surface)', border: '0.5px solid var(--rr-border)', borderRadius: 4, padding: '2px 8px' }}>{m}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

          {/* Coluna esquerda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <MapaRecife bairros={bairros} onBairroClick={setBairroSelecionado} atualizadoEm={hora} />
            <div style={{ height: 300 }}>
              <BairrosLista onBairroClick={setBairroSelecionado} />
            </div>
          </div>

          {/* Coluna direita */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* CARD PRINCIPAL — localização + clima + previsão */}
            <div style={{ background: 'var(--rr-card)', border: '0.5px solid var(--rr-border)', borderRadius: 10, padding: '16px 18px' }}>

              {/* Cabeçalho — localidade */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <MapPin size={13} color="var(--rr-blue-l)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--rr-text)' }}>
                  {localidade || 'Recife, PE'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--rr-muted)', marginLeft: 'auto' }}>
                  Atualizado {hora}
                </span>
              </div>

              {/* Temperatura + condição */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                {condicao.icone}
                <div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--rr-text)', lineHeight: 1 }}>
                    {loading ? '--' : `${clima?.temperatura ?? '--'}°C`}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--rr-muted)', marginTop: 2 }}>
                    Sensação {clima?.sensacao_termica ?? '--'}°C
                  </div>
                  <div style={{ fontSize: 12, color: condicao.cor, marginTop: 2, fontWeight: 500 }}>
                    {condicao.label} · {condicao.intensidade}
                  </div>
                  {/* Barra de intensidade */}
                  <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ height: 3, width: 24, borderRadius: 2, background: i <= condicao.escala ? condicao.cor : 'var(--rr-border)' }} />
                    ))}
                  </div>
                </div>
                {/* IRA no card principal */}
                <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: corNivel }}>{clima?.ira ?? '--'}</div>
                  <div style={{ fontSize: 10, color: 'var(--rr-muted)' }}>IRA</div>
                  <div style={{ fontSize: 11, color: corNivel, fontWeight: 500 }}>{clima?.nivel ?? '--'}</div>
                </div>
              </div>

              {/* Grade de dados meteorológicos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  { icon: <Droplets size={12} color="var(--rr-blue-l)" />, label: 'Umidade', value: `${clima?.umidade ?? '--'}%`, tooltip: 'Umidade relativa do ar. Acima de 90% indica solo saturado, aumentando o risco de alagamento.' },
                  { icon: <Wind size={12} color="var(--rr-blue-l)" />, label: 'Vento', value: `${clima?.velocidade_vento ?? '--'} km/h`, sub: dirVento(clima?.direcao_vento), tooltip: 'Velocidade e direção do vento a 10 metros de altura. Rajadas fortes podem derrubar árvores e causar danos.' },
                  { icon: <Wind size={12} color="#94a3b8" />, label: 'Rajada', value: `${clima?.rajada_vento ?? '--'} km/h`, tooltip: 'Velocidade máxima de rajada de vento. Rajadas acima de 60 km/h são consideradas perigosas.' },
                  { icon: <Gauge size={12} color="var(--rr-blue-l)" />, label: 'Pressão', value: `${clima?.pressao ?? '--'}` , sub: 'hPa', tooltip: 'Pressão atmosférica em hectopascais. Queda rápida de pressão indica aproximação de tempestades.' },
                  { icon: <CloudRain size={12} color="var(--rr-blue-l)" />, label: 'Chuva agora', value: `${clima?.volume_chuva ?? '--'}mm`, sub: `Prob. ${clima?.prob_chuva ?? '--'}%`, tooltip: 'Volume de precipitação na hora atual (mm/h) e probabilidade de chuva prevista para as próximas horas.' },
                  { icon: <Sun size={12} color="#fbbf24" />, label: 'UV agora', value: `${clima?.indice_uv ?? '--'}`, sub: `Máx ${clima?.uv_max_dia ?? '--'}`, tooltip: 'Índice UV atual e máximo do dia. 0-2 Baixo, 3-5 Moderado, 6-7 Alto, 8-10 Muito alto, 11+ Extremo. Use protetor acima de 3.' },
                  { icon: <Eye size={12} color="var(--rr-blue-l)" />, label: 'Visibilidade', value: clima?.visibilidade ? `${(clima.visibilidade / 1000).toFixed(1)}km` : '--', tooltip: 'Distância máxima de visibilidade. Abaixo de 1km indica neblina densa ou chuva forte. Cuidado ao dirigir.' },
                  { icon: <Leaf size={12} color="#22c55e" />, label: 'Qualidade ar', value: clima?.aqi_label ?? '--', sub: `AQI ${clima?.aqi ?? '--'}`, tooltip: 'AQI (Air Quality Index) europeu. Mede PM2.5, PM10, NO2, CO e ozônio. Muito boa (0-20), Boa (21-40), Moderada (41-60), Ruim (61-80).' },
                ].map(({ icon, label, value, sub, tooltip }: any) => (
                  <div key={label} style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: '8px 10px' }}>
                    <Tooltip texto={tooltip || label} posicao="top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, cursor: 'help' }}>
                        {icon}
                        <span style={{ fontSize: 9, color: 'var(--rr-muted)' }}>{label} ⓘ</span>
                      </div>
                    </Tooltip>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--rr-text)' }}>{value}</div>
                    {sub && <div style={{ fontSize: 9, color: 'var(--rr-muted)', marginTop: 1 }}>{sub}</div>}
                  </div>
                ))}
              </div>

              {/* Acumulados */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Acumulado 24h', valor: clima?.acumulado_24h },
                  { label: 'Acumulado 48h', valor: clima?.acumulado_48h },
                  { label: 'Acumulado 72h', valor: clima?.acumulado_72h },
                ].map(({ label, valor }) => (
                  <div key={label} style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--rr-text)' }}>
                      {loading ? '...' : `${valor ?? '--'}`}<span style={{ fontSize: 10, color: 'var(--rr-muted)', marginLeft: 2 }}>mm</span>
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--rr-muted)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Dados astronômicos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  { emoji: '🌅', label: 'Nascer sol', valor: clima?.nascer_sol ?? '--', tooltip: 'Horário do nascer do sol para sua localização atual. Calculado pelo Open-Meteo com base nas coordenadas GPS.' },
                  { emoji: '🌇', label: 'Pôr do sol', valor: clima?.por_sol ?? '--', tooltip: 'Horário do pôr do sol para sua localização atual. Após esse horário inicia o período noturno.' },
                  { emoji: clima?.fase_lua_emoji ?? '🌙', label: 'Fase da lua', valor: clima?.fase_lua ?? '--', tooltip: 'Fase atual da lua calculada pelo ciclo sinódico de 29,5 dias. Lua Cheia e Lua Nova potencializam as marés (marés de sizígia), aumentando risco de alagamentos costeiros em Recife.' },
                  { emoji: '💡', label: 'Iluminação', valor: clima?.lua_iluminacao != null ? `${clima.lua_iluminacao}%` : '--', tooltip: 'Percentual da face da lua iluminada pelo sol. 0% = Lua Nova. 50% = Quarto Crescente/Minguante. 100% = Lua Cheia. Influencia nas marés e alagamentos costeiros.' },
                ].map(({ emoji, label, valor, tooltip }: any) => (
                  <Tooltip key={label} texto={tooltip} posicao="top">
                    <div style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: '8px 10px', textAlign: 'center', cursor: 'help', width: '100%' }}>
                      <div style={{ fontSize: 18, marginBottom: 2 }}>{emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rr-text)' }}>{valor}</div>
                      <div style={{ fontSize: 9, color: 'var(--rr-muted)', marginTop: 1 }}>{label} ⓘ</div>
                    </div>
                  </Tooltip>
                ))}
              </div>

              {/* Previsão hora a hora */}
              <div style={{ borderTop: '0.5px solid var(--rr-border)', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--rr-sub)' }}>Previsão hora a hora</span>
                  <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>próximas 8h</span>
                </div>
                {loading || previsao.length === 0 ? (
                  <div style={{ color: 'var(--rr-muted)', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>Carregando...</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
                    {previsao.map((p, i) => (
                      <div key={i} style={{ background: 'var(--rr-surface)', border: '0.5px solid var(--rr-border)', borderRadius: 6, padding: '8px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 4 }}>{p.hora}</div>
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{getIconeHora(p.prob_chuva, p.codigo_tempo, p.hora_raw)}</div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: getCorProb(p.prob_chuva) }}>{p.prob_chuva}%</div>
                        <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginTop: 2 }}>{p.temperatura}°C</div>
                        {p.volume_chuva > 0 && <div style={{ fontSize: 9, color: 'var(--rr-blue-l)', marginTop: 2 }}>{p.volume_chuva}mm</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <IRA valor={clima?.ira ?? 0} atualizadoEm={hora} />
            <Rodovias />
            <ElNino />

            <NoticiasInteligentes />

          </div>
        </div>
      </div>
    </div>
  )
}

export default App

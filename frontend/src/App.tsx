// ============================================================
//  src/App.tsx
//  Componente principal do Radar Recife.
//  Layout split screen: mapa + lista a esquerda,
//  metricas + previsao a direita.
// ============================================================

import { useState, useEffect } from 'react'
import { Cloud, Droplets, Wind, Thermometer, AlertTriangle } from 'lucide-react'
import { Header } from './components/Header'
import { MetricCard } from './components/MetricCard'
import { AlertaBanner } from './components/AlertaBanner'
import { IRA } from './components/IRA'
import { BairrosLista } from './components/BairrosLista'
import { climaApi } from './services/api'

function App() {
  const [clima, setClima] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarClima()
    const intervalo = setInterval(buscarClima, 600000)
    return () => clearInterval(intervalo)
  }, [])

  async function buscarClima() {
    try {
      const resp = await climaApi.atual()
      setClima(resp.data)
      setErro('')
    } catch (e) {
      setErro('Erro ao carregar dados climaticos')
    } finally {
      setLoading(false)
    }
  }

  const hora = clima?.atualizado_em?.split(' ')[1]?.substring(0, 5) || '--:--'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--rr-bg)' }}>
      <Header />

      <div style={{ padding: '12px 16px' }}>

        {clima && clima.nivel !== 'verde' && (
          <AlertaBanner
            nivel={clima.nivel}
            mensagem={`${clima.descricao_tempo} em Recife. IRA: ${clima.ira} — ${
              clima.nivel === 'vermelho' ? 'Risco alto de alagamento.' :
              clima.nivel === 'laranja'  ? 'Fique atento aos alertas.' :
              'Condicoes de atencao.'
            }`}
            emitidoEm={hora}
          />
        )}

        {/* Grid principal split screen */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 12,
        }}>

          {/* LADO ESQUERDO — Mapa + Lista de bairros */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Mapa placeholder */}
            <div style={{
              background: 'var(--rr-card)',
              border: '0.5px solid var(--rr-border)',
              borderRadius: 8,
              padding: 14,
              minHeight: 200,
            }}>
              <div style={{
                fontSize: 11, color: 'var(--rr-sub)',
                marginBottom: 10,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>Mapa de risco — bairros de Recife</span>
                <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>Atualizado {hora}</span>
              </div>
              <div style={{
                background: '#070f1e',
                borderRadius: 6,
                height: 160,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--rr-muted)',
                fontSize: 13,
                border: '0.5px dashed var(--rr-border)',
              }}>
                Mapa interativo — Leaflet (em breve)
              </div>
            </div>

            {/* Lista de bairros */}
            <div style={{ height: 300 }}>
              <BairrosLista />
            </div>

          </div>

          {/* LADO DIREITO — Metricas + IRA + Previsao + Noticias */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Metricas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}>
              <MetricCard
                label="Temperatura"
                value={loading ? '...' : `${clima?.temperatura ?? '--'}°C`}
                sub={`Sensacao ${clima?.sensacao_termica ?? '--'}°C`}
                atualizadoEm={hora}
                icon={<Thermometer size={13} color="var(--rr-blue-l)" />}
              />
              <MetricCard
                label="IRA"
                value={loading ? '...' : clima?.ira ?? '--'}
                sub={clima?.nivel ?? ''}
                atualizadoEm={hora}
                cor={clima?.nivel === 'vermelho' ? 'var(--rr-red)'
                   : clima?.nivel === 'laranja'  ? 'var(--rr-orange)'
                   : clima?.nivel === 'amarelo'  ? 'var(--rr-yellow)'
                   : 'var(--rr-green)'}
                icon={<AlertTriangle size={13} color="var(--rr-blue-l)" />}
              />
              <MetricCard
                label="Umidade"
                value={loading ? '...' : `${clima?.umidade ?? '--'}%`}
                sub="Umidade relativa"
                atualizadoEm={hora}
                icon={<Droplets size={13} color="var(--rr-blue-l)" />}
              />
              <MetricCard
                label="Volume previsto"
                value={loading ? '...' : `${clima?.volume_chuva ?? '--'}mm`}
                sub={`Prob. ${clima?.prob_chuva ?? '--'}%`}
                atualizadoEm={hora}
                icon={<Cloud size={13} color="var(--rr-blue-l)" />}
              />
            </div>

            {/* IRA gauge */}
            <IRA
              valor={clima?.ira ?? 0}
              atualizadoEm={hora}
            />

            {/* Vento */}
            <MetricCard
              label="Vento"
              value={loading ? '...' : `${clima?.velocidade_vento ?? '--'} km/h`}
              sub={`${clima?.descricao_tempo ?? ''}`}
              atualizadoEm={hora}
              icon={<Wind size={13} color="var(--rr-blue-l)" />}
            />

            {/* Noticias placeholder */}
            <div style={{
              background: 'var(--rr-card)',
              border: '0.5px solid var(--rr-border)',
              borderRadius: 8,
              padding: 14,
            }}>
              <div style={{ fontSize: 11, color: 'var(--rr-sub)', marginBottom: 10 }}>
                Noticias locais agora
              </div>
              <div style={{ fontSize: 11, color: 'var(--rr-muted)', textAlign: 'center', padding: '10px 0' }}>
                Feed de noticias — em breve
              </div>
            </div>

          </div>
        </div>

        {erro && (
          <div style={{
            background: '#2a0a0a', border: '0.5px solid #7f1d1d',
            borderRadius: 8, padding: '10px 14px',
            color: '#fca5a5', fontSize: 12,
          }}>
            {erro}
          </div>
        )}

      </div>
    </div>
  )
}

export default App

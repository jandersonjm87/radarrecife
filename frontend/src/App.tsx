// ============================================================
//  src/App.tsx
//  Componente principal do Radar Recife.
// ============================================================

import { useState, useEffect } from 'react'
import { Cloud, Droplets, Wind, Thermometer, AlertTriangle } from 'lucide-react'
import { Header } from './components/Header'
import { MetricCard } from './components/MetricCard'
import { AlertaBanner } from './components/AlertaBanner'
import { IRA } from './components/IRA'
import { BairrosLista } from './components/BairrosLista'
import { MapaRecife } from './components/MapaRecife'
import { PrevisaoHoraria } from './components/PrevisaoHoraria'
import { Rodovias } from './components/Rodovias'
import { ElNino } from './components/ElNino'
import { climaApi, bairrosApi } from './services/api'

function App() {
  const [clima, setClima] = useState<any>(null)
  const [bairros, setBairros] = useState<any[]>([])
  const [bairroSelecionado, setBairroSelecionado] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarDados()
    const intervalo = setInterval(buscarDados, 600000)
    return () => clearInterval(intervalo)
  }, [])

  async function buscarDados() {
    try {
      const [climaResp, bairrosResp] = await Promise.all([
        climaApi.atual(),
        bairrosApi.listar(),
      ])
      setClima(climaResp.data)

      const bairrosMapa = bairrosResp.data.bairros.map((b: any) => ({
        ...b,
        ira: b.risco_base,
        nivel: b.risco_base <= 20 ? 'verde'
             : b.risco_base <= 40 ? 'amarelo'
             : b.risco_base <= 60 ? 'laranja'
             : 'vermelho',
      }))
      setBairros(bairrosMapa)
    } catch (e) {
      console.error(e)
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

        {bairroSelecionado && (
          <div style={{
            background: '#0b1628',
            border: '0.5px solid var(--rr-blue)',
            borderRadius: 8,
            padding: '10px 16px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--rr-blue-l)', fontWeight: 500 }}>
                Bairro selecionado:
              </span>
              <span style={{ fontSize: 13, color: 'var(--rr-text)', marginLeft: 8 }}>
                {bairroSelecionado.nome}
              </span>
              <span style={{ fontSize: 12, color: 'var(--rr-muted)', marginLeft: 8 }}>
                IRA: {bairroSelecionado.ira} — Risco base: {bairroSelecionado.risco_base}
              </span>
            </div>
            <button
              onClick={() => setBairroSelecionado(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--rr-muted)',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              x
            </button>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <MapaRecife
              bairros={bairros}
              onBairroClick={setBairroSelecionado}
              atualizadoEm={hora}
            />

            <div style={{ height: 300 }}>
              <BairrosLista />
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <MetricCard
                label="Temperatura"
                value={loading ? '...' : `${clima?.temperatura ?? '--'}C`}
                sub={`Sensacao ${clima?.sensacao_termica ?? '--'}C`}
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

            <IRA valor={clima?.ira ?? 0} atualizadoEm={hora} />

            <MetricCard
              label="Vento"
              value={loading ? '...' : `${clima?.velocidade_vento ?? '--'} km/h`}
              sub={clima?.descricao_tempo ?? ''}
              atualizadoEm={hora}
              icon={<Wind size={13} color="var(--rr-blue-l)" />}
            />

            <PrevisaoHoraria />
            <Rodovias />
            <ElNino />

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
      </div>
    </div>
  )
}

export default App

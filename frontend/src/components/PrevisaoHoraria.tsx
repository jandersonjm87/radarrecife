// ============================================================
//  src/components/PrevisaoHoraria.tsx
//  Previsao meteorologica hora a hora para as proximas 24h.
// ============================================================

import { useState, useEffect } from 'react'
import { climaApi } from '../services/api'

interface PontoPrevisao {
  hora: string
  temperatura: number
  prob_chuva: number
  volume_chuva: number
  descricao: string
}

function getIcone(prob: number): string {
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

export function PrevisaoHoraria() {
  const [previsao, setPrevisao] = useState<PontoPrevisao[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizadoEm, setAtualizadoEm] = useState('')

  useEffect(() => {
    buscarPrevisao()
    const intervalo = setInterval(buscarPrevisao, 1800000)
    return () => clearInterval(intervalo)
  }, [])

  async function buscarPrevisao() {
    try {
      const resp = await climaApi.previsao()
      const dados = resp.data

      const agora = new Date()
      const horaAtual = agora.getHours()

      const proximas = dados
        .filter((_: any, i: number) => i >= horaAtual && i < horaAtual + 8)
        .map((p: any) => ({
          hora: new Date(p.hora).toLocaleTimeString('pt-BR', {
            hour: '2-digit', minute: '2-digit',
          }),
          temperatura: p.temperatura ?? 0,
          prob_chuva: p.prob_chuva ?? 0,
          volume_chuva: p.volume_chuva ?? 0,
          descricao: p.descricao ?? '',
        }))

      setPrevisao(proximas)
      setAtualizadoEm(agora.toLocaleTimeString('pt-BR', {
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
        <span>Previsao hora a hora</span>
        <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>
          {atualizadoEm ? `Atualizado ${atualizadoEm} · proxima att 30 min` : 'Carregando...'}
        </span>
      </div>

      {loading ? (
        <div style={{ color: 'var(--rr-muted)', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>
          Carregando previsao...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 6,
        }}>
          {previsao.map((p, i) => (
            <div key={i} style={{
              background: 'var(--rr-surface)',
              border: '0.5px solid var(--rr-border)',
              borderRadius: 6,
              padding: '8px 4px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 4 }}>
                {p.hora}
              </div>
              <div style={{ fontSize: 18, marginBottom: 4 }}>
                {getIcone(p.prob_chuva)}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 500,
                color: getCorProb(p.prob_chuva),
              }}>
                {p.prob_chuva}%
              </div>
              <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginTop: 2 }}>
                {p.temperatura}C
              </div>
              {p.volume_chuva > 0 && (
                <div style={{ fontSize: 9, color: 'var(--rr-blue-l)', marginTop: 2 }}>
                  {p.volume_chuva}mm
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

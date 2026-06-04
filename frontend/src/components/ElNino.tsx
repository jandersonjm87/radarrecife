// ============================================================
//  src/components/ElNino.tsx
//  Card de monitoramento do El Nino e La Nina.
// ============================================================

import { useState } from 'react'

const DADOS = {
  fenomeno: 'el_nino',
  indice_oni: 1.8,
  aumento_chuva: '+43%',
  duracao_estimada: '3 meses',
  impactos: [
    'Volume de chuvas 40% acima da media historica entre junho e agosto',
    'Maior risco de eventos extremos na Zona Sul e Oeste de Recife',
    'Tendencia de enfraquecimento a partir de setembro de 2026',
  ],
  tendencia: [
    { mes: 'Jun/26', valor: 1.8 },
    { mes: 'Jul/26', valor: 1.5 },
    { mes: 'Ago/26', valor: 1.1 },
    { mes: 'Set/26', valor: 0.4 },
  ],
  referencia: 'jun/2026',
  atualizado_em: '01/06/2026 as 08:00',
}

export function ElNino() {
  const ponteiro = Math.min(Math.max((DADOS.indice_oni + 2) / 4 * 100, 0), 100)

  return (
    <div style={{
      background: 'var(--rr-card)',
      border: '0.5px solid #7f1d1d',
      borderRadius: 8,
      padding: 14,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 12,
      }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--rr-text)' }}>
          🌍 El Nino — Super Episodio Ativo
        </div>
        <span style={{ background: '#7f1d1d', color: '#fca5a5', fontSize: 10, padding: '3px 8px', borderRadius: 4 }}>
          FORTE — ATIVO
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Indice ONI', value: `+${DADOS.indice_oni}`, cor: '#ef4444', sub: 'El Nino forte' },
          { label: 'Chuva acima da media', value: DADOS.aumento_chuva, cor: '#f97316', sub: 'em Recife' },
          { label: 'Duracao estimada', value: DADOS.duracao_estimada, cor: '#22c55e', sub: 'ate set/2026' },
        ].map((item, i) => (
          <div key={i} style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: item.cor }}>{item.value}</div>
            <div style={{ fontSize: 10, color: 'var(--rr-muted)', marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--rr-border)', borderRadius: 3, height: 6, position: 'relative', marginBottom: 6 }}>
        <div style={{ height: 6, borderRadius: 3, background: 'linear-gradient(90deg, #1d4ed8 0%, #22c55e 45%, #f97316 70%, #ef4444 100%)', width: '100%' }} />
        <div style={{ position: 'absolute', top: -4, left: `${ponteiro}%`, transform: 'translateX(-50%)', width: 3, height: 14, background: '#fff', borderRadius: 2 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--rr-muted)', marginBottom: 12 }}>
        <span style={{ color: '#3d8fe0' }}>La Nina forte</span>
        <span>Neutro</span>
        <span style={{ color: '#ef4444' }}>El Nino forte</span>
      </div>

      <div style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--rr-sub)', marginBottom: 8 }}>
          ⚠️ Impacto esperado para Recife
        </div>
        {DADOS.impactos.map((imp, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 11, color: 'var(--rr-sub)', lineHeight: 1.4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', marginTop: 4, flexShrink: 0 }} />
            {imp}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        {DADOS.tendencia.map((t, i) => (
          <div key={i} style={{ background: 'var(--rr-surface)', borderRadius: 6, padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--rr-muted)', marginBottom: 3 }}>{t.mes}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: t.valor >= 0.5 ? '#ef4444' : '#22c55e' }}>
              {t.valor > 0 ? '+' : ''}{t.valor}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--rr-muted)', borderTop: '0.5px solid var(--rr-border)', paddingTop: 8 }}>
        <span>Fonte: NOAA / CPTEC-INPE · Referencia: {DADOS.referencia}</span>
        <span>Ultima att: {DADOS.atualizado_em}</span>
      </div>
    </div>
  )
}

// ============================================================
//  src/components/Header.tsx
//  Cabecalho do Radar Recife com logo, status, hora e localizacao.
// ============================================================

import { useState, useEffect } from 'react'
import { Cloud, MapPin } from 'lucide-react'

interface HeaderProps {
  localidade?: string  // cidade/bairro detectado pela geolocalizacao
}

export function Header({ localidade }: HeaderProps) {
  const [hora, setHora] = useState('')

  useEffect(() => {
    const atualizar = () => {
      const agora = new Date()
      setHora(agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }))
    }
    atualizar()
    const intervalo = setInterval(atualizar, 1000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <header style={{
      background: 'var(--rr-surface)',
      borderBottom: '0.5px solid var(--rr-border)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--rr-blue)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Cloud size={20} color="#fff" />
        </div>
        <span style={{ fontSize: 18, fontWeight: 500 }}>
          Radar<span style={{ color: 'var(--rr-blue-l)' }}>Recife</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--rr-green)',
            boxShadow: '0 0 8px var(--rr-green)',
          }} />
          <span style={{ fontSize: 12, color: 'var(--rr-sub)' }}>Online</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <MapPin size={11} color="var(--rr-blue-l)" />
          <span style={{ fontSize: 12, color: 'var(--rr-muted)' }}>
            {localidade || 'Recife, PE'}
          </span>
        </div>

        <span style={{ fontSize: 12, color: 'var(--rr-muted)' }}>
          {hora}
        </span>
      </div>
    </header>
  )
}

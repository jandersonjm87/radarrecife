// ============================================================
//  src/components/MapaRecife.tsx
//  Mapa interativo de Recife com bairros coloridos por risco.
//  Usa Leaflet + CartoDB dark tiles — gratuito e sem chave de API.
// ============================================================

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface BairroMapa {
  nome: string
  latitude: number
  longitude: number
  nivel: string
  ira: number
  risco_base: number
}

interface MapaRecifeProps {
  bairros: BairroMapa[]
  onBairroClick?: (bairro: BairroMapa) => void
  atualizadoEm?: string
  altura?: number  // altura do container do mapa em px (padrão 280)
}

const NIVEL_COR: Record<string, string> = {
  verde:    '#22c55e',
  amarelo:  '#eab308',
  laranja:  '#f97316',
  vermelho: '#ef4444',
}

const NIVEL_LABEL: Record<string, string> = {
  verde:    'Normal',
  amarelo:  'Atencao',
  laranja:  'Alerta',
  vermelho: 'Critico',
}

export function MapaRecife({ bairros, onBairroClick, atualizadoEm, altura = 280 }: MapaRecifeProps) {
  const mapaRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapaRef.current) return

    // Inicializa o mapa centrado em Recife
    const mapa = L.map(containerRef.current, {
      center: [-8.0631, -34.9000],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    })

    // Tile escuro compativel com o tema do projeto
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: 'OpenStreetMap | CartoDB',
      maxZoom: 18,
    }).addTo(mapa)

    mapaRef.current = mapa
  }, [])

  useEffect(() => {
    if (!mapaRef.current) return

    // Remove marcadores anteriores
    mapaRef.current.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        mapaRef.current!.removeLayer(layer)
      }
    })

    // Adiciona marcadores dos bairros
    bairros.forEach((bairro) => {
      if (!mapaRef.current) return
      const cor   = NIVEL_COR[bairro.nivel]  || '#22c55e'
      const label = NIVEL_LABEL[bairro.nivel] || 'Normal'

      const marcador = L.circleMarker(
        [bairro.latitude, bairro.longitude],
        {
          radius: 10,
          fillColor: cor,
          color: cor,
          weight: 1,
          opacity: 0.9,
          fillOpacity: 0.7,
        }
      )

      marcador.bindPopup(`
        <div style="
          background: #0f1e35;
          color: #e2f0ff;
          padding: 10px 14px;
          border-radius: 8px;
          font-family: Inter, sans-serif;
          min-width: 160px;
        ">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">
            ${bairro.nome}
          </div>
          <div style="
            display: inline-block;
            background: ${cor}22;
            color: ${cor};
            border: 1px solid ${cor}44;
            font-size: 11px;
            font-weight: 500;
            padding: 2px 8px;
            border-radius: 4px;
            margin-bottom: 8px;
          ">
            ${label}
          </div>
          <div style="font-size: 12px; color: #8aadcc;">
            IRA: <strong style="color: ${cor}">${bairro.ira}</strong>
          </div>
          <div style="font-size: 11px; color: #4a6a8a; margin-top: 4px;">
            Risco historico: ${bairro.risco_base}
          </div>
        </div>
      `, {
        className: 'popup-radar-recife',
      })

      marcador.on('click', () => {
        if (onBairroClick) onBairroClick(bairro)
      })

      marcador.addTo(mapaRef.current!)
    })

  }, [bairros, onBairroClick])

  return (
    <div style={{
      background: 'var(--rr-card)',
      border: '0.5px solid var(--rr-border)',
      borderRadius: 8,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',   // ocupa toda a altura disponível no pai
      boxSizing: 'border-box',
    }}>
      <div style={{
        fontSize: 11, color: 'var(--rr-sub)',
        marginBottom: 10,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span>Mapa de risco — bairros de Recife</span>
        <span style={{ fontSize: 10, color: 'var(--rr-muted)' }}>
          {atualizadoEm ? `Atualizado ${atualizadoEm}` : 'Carregando...'}
        </span>
      </div>

      {/* Legenda */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        {Object.entries(NIVEL_COR).map(([nivel, cor]) => (
          <div key={nivel} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, color: 'var(--rr-muted)',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: cor,
            }} />
            {NIVEL_LABEL[nivel]}
          </div>
        ))}
      </div>

      {/* Container do mapa — flex:1 para crescer e preencher o card */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: altura,
          borderRadius: 6,
          overflow: 'hidden',
          border: '0.5px solid var(--rr-border)',
        }}
      />

      <style>{`
        .popup-radar-recife .leaflet-popup-content-wrapper {
          background: #0f1e35 !important;
          border: 0.5px solid #1a2f4a !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        }
        .popup-radar-recife .leaflet-popup-tip {
          background: #0f1e35 !important;
        }
        .popup-radar-recife .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-container {
          background: #070f1e !important;
        }
      `}</style>
    </div>
  )
}

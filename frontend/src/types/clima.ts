// src/types/clima.ts
export type NivelRisco = 'verde' | 'amarelo' | 'laranja' | 'vermelho'

export interface ClimaAtual {
  bairro: string
  temperatura: number
  sensacao_termica: number
  umidade: number
  velocidade_vento: number
  volume_chuva: number
  prob_chuva: number
  descricao_tempo: string
  ira: number
  nivel: NivelRisco
  atualizado_em: string
}

export interface Bairro {
  nome: string
  latitude: number
  longitude: number
  zona: string
  risco_base: number
}

export const NIVEL_CONFIG = {
  verde:    { label: 'Normal',     cor: '#22c55e', bg: '#14532d', texto: '#86efac' },
  amarelo:  { label: 'Atencao',    cor: '#eab308', bg: '#713f12', texto: '#fde68a' },
  laranja:  { label: 'Alerta',     cor: '#f97316', bg: '#7c2d12', texto: '#fdba74' },
  vermelho: { label: 'Risco Alto', cor: '#ef4444', bg: '#7f1d1d', texto: '#fca5a5' },
}

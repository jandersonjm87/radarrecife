// src/services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

export const climaApi = {
  atual: () => api.get('/clima/atual'),
  previsao: () => api.get('/clima/previsao'),
}

export const bairrosApi = {
  listar: () => api.get('/bairros/'),
  clima: (nome) => api.get(`/bairros/${nome}`),
  br232: () => api.get('/bairros/rodovias/br232'),
}

export default api

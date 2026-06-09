# ============================================================
#  backend/app/integrations/open_meteo.py
#
#  Responsabilidade: buscar dados meteorologicos via Open-Meteo.
#  API gratuita, sem necessidade de chave, alta precisao.
#  Documentacao: https://open-meteo.com/en/docs
# ============================================================

import httpx
from datetime import datetime
from typing import Optional

from app.core.config import get_settings

settings = get_settings()


async def buscar_clima_atual(latitude: float, longitude: float) -> dict:
    """
    Busca condicoes climaticas atuais para uma coordenada.
    Retorna temperatura, umidade, vento, chuva e indice UV.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": [
            "temperature_2m",
            "apparent_temperature",
            "relative_humidity_2m",
            "wind_speed_10m",
            "wind_direction_10m",
            "surface_pressure",
            "uv_index",
            "precipitation",
            "precipitation_probability",
            "weather_code",
        ],
        "hourly": [
            "precipitation",
        ],
        "timezone": "America/Recife",
        "forecast_days": 1,
        "past_days": 1,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{settings.OPEN_METEO_URL}/forecast",
            params=params,
        )
        response.raise_for_status()
        dados = response.json()

    atual = dados.get("current", {})

    # Calcula acumulado das ultimas 24h somando precipitacao horaria
    horario = dados.get("hourly", {})
    precipitacoes = horario.get("precipitation", [])
    acumulado_24h = round(sum(p for p in precipitacoes if p is not None), 1)

    return {
        "temperatura":      atual.get("temperature_2m"),
        "sensacao_termica": atual.get("apparent_temperature"),
        "umidade":          atual.get("relative_humidity_2m"),
        "velocidade_vento": atual.get("wind_speed_10m"),
        "direcao_vento":    atual.get("wind_direction_10m"),
        "pressao":          atual.get("surface_pressure"),
        "indice_uv":        atual.get("uv_index"),
        "volume_chuva":     atual.get("precipitation"),
        "prob_chuva":       atual.get("precipitation_probability"),
        "codigo_tempo":     atual.get("weather_code"),
        "acumulado_24h":    acumulado_24h,
        "coletado_em":      datetime.now().isoformat(),
        "fonte":            "open-meteo",
    }


async def buscar_previsao_horaria(latitude: float, longitude: float) -> list[dict]:
    """
    Busca previsao meteorologica hora a hora para as proximas 24h.
    Retorna lista de pontos com temperatura, chuva e probabilidade.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": [
            "temperature_2m",
            "precipitation_probability",
            "precipitation",
            "weather_code",
            "wind_speed_10m",
        ],
        "timezone": "America/Recife",
        "forecast_days": 1,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            f"{settings.OPEN_METEO_URL}/forecast",
            params=params,
        )
        response.raise_for_status()
        dados = response.json()

    horario = dados.get("hourly", {})
    horas = horario.get("time", [])

    previsao = []
    for i, hora in enumerate(horas):
        previsao.append({
            "hora":         hora,
            "temperatura":  horario.get("temperature_2m", [])[i] if i < len(horario.get("temperature_2m", [])) else None,
            "prob_chuva":   horario.get("precipitation_probability", [])[i] if i < len(horario.get("precipitation_probability", [])) else None,
            "volume_chuva": horario.get("precipitation", [])[i] if i < len(horario.get("precipitation", [])) else None,
            "codigo_tempo": horario.get("weather_code", [])[i] if i < len(horario.get("weather_code", [])) else None,
        })

    return previsao


def calcular_ira(
    volume_mm: float,
    prob_chuva: int,
    umidade: int,
    risco_base: int = 0,
    acumulado_24h: float = 0.0,
    alerta_oficial: bool = False,
    alagamento_confirmado: bool = False,
) -> int:
    """
    Calcula o IRA — Indice de Risco de Alagamento.

    Logica baseada em evidencias (diretrizes aprovadas):

    VERDE    (0-20):  padrao — sem evidencias de risco
    AMARELO (21-40):  chuva moderada prevista, sem ocorrencias graves
    LARANJA (41-60):  chuva forte confirmada + historico critico
    VERMELHO(61-100): alerta oficial ATIVO ou alagamento confirmado
                      ou volume acumulado > 50mm

    O risco_base historico serve apenas como memoria do bairro,
    nunca como determinante do nivel atual.
    """

    volume_atual = volume_mm or 0
    acumulado = acumulado_24h or 0
    prob_normalizada = (prob_chuva or 0) / 100.0  # converte 0-100 para 0.0-1.0

    # --- VERMELHO: exige evidencia concreta ---
    if alerta_oficial or alagamento_confirmado or acumulado > 50:
        return 75

    # --- LARANJA: chuva forte + contexto de risco ---
    chuva_forte = volume_atual > 10 or acumulado > 25
    probabilidade_alta = prob_normalizada > 0.80
    historico_critico = (risco_base or 0) > 60

    if chuva_forte and probabilidade_alta and historico_critico:
        return 50  # laranja consolidado
    elif chuva_forte and probabilidade_alta:
        return 45  # laranja leve

    # --- AMARELO: chuva moderada prevista ---
    if volume_atual > 2 or (prob_normalizada > 0.60 and volume_atual > 0.5):
        return 30  # amarelo

    # --- VERDE: sem evidencias — umidade alta adiciona no maximo 15 pontos ---
    bonus_umidade = min(((umidade or 0) - 60) * 0.3, 15) if (umidade or 0) > 60 else 0
    return min(int(bonus_umidade), 20)  # nunca passa do verde


def classificar_nivel(ira: int) -> str:
    """Classifica o nivel de risco com base no IRA."""
    if ira <= 20:
        return "verde"
    elif ira <= 40:
        return "amarelo"
    elif ira <= 60:
        return "laranja"
    return "vermelho"


def descrever_tempo(codigo: int) -> str:
    """
    Converte codigo WMO de tempo para descricao em portugues.
    Referencia: https://open-meteo.com/en/docs#weathervariables
    """
    descricoes = {
        0:  "Ceu limpo",
        1:  "Principalmente limpo",
        2:  "Parcialmente nublado",
        3:  "Nublado",
        45: "Neblina",
        48: "Neblina com gelo",
        51: "Garoa leve",
        53: "Garoa moderada",
        55: "Garoa intensa",
        61: "Chuva leve",
        63: "Chuva moderada",
        65: "Chuva forte",
        71: "Neve leve",
        73: "Neve moderada",
        75: "Neve forte",
        80: "Pancadas de chuva leves",
        81: "Pancadas de chuva moderadas",
        82: "Pancadas de chuva violentas",
        95: "Tempestade",
        96: "Tempestade com granizo",
        99: "Tempestade com granizo intenso",
    }
    return descricoes.get(codigo, "Condicoes variaveis")

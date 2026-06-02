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

    atual = dados.get("current", {})

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
) -> int:
    """
    Calcula o IRA — Indice de Risco de Alagamento.

    Formula:
        volume_mm  * 0.40 (peso maior para volume real)
        prob_chuva * 0.30 (probabilidade de chuva)
        umidade    * 0.15 (solo ja saturado aumenta risco)
        risco_base * 0.15 (historico do bairro)

    Retorna valor de 0 a 100:
        0-20  → Verde   (Normal)
        21-40 → Amarelo (Atencao)
        41-60 → Laranja (Alerta)
        61-100→ Vermelho (Risco Alto)
    """
    score = (
        (volume_mm or 0)  * 0.40 +
        (prob_chuva or 0) * 0.30 +
        (umidade or 0)    * 0.15 +
        (risco_base or 0) * 0.15
    )
    return min(int(score), 100)


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

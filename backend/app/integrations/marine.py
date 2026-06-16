# ============================================================
#  backend/app/integrations/marine.py
#
#  Condicoes maritimas via Open-Meteo Marine API.
#  Cache TTL de 30 minutos — dados maritimos mudam lentamente.
# ============================================================

import httpx
import logging
from datetime import datetime, timezone, timedelta
from cachetools import TTLCache
from app.core.config import get_settings
from app.integrations.open_meteo import _calcular_fase_lua

settings  = get_settings()
logger    = logging.getLogger("radar_recife.marine")
TZ_RECIFE = timezone(timedelta(hours=-3))

_cache_marine = TTLCache(maxsize=5, ttl=settings.CACHE_MARINE_TTL)

# Coordenadas da orla de Recife (Boa Viagem)
RECIFE_LAT = -8.1100
RECIFE_LON = -34.8900


def _classificar_ondas(altura: float) -> tuple[str, str]:
    """Classifica altura das ondas com cor de risco."""
    if altura < 0.5:  return "Mar calmo",         "#22c55e"
    if altura < 1.0:  return "Mar tranquilo",      "#22c55e"
    if altura < 1.5:  return "Mar moderado",       "#eab308"
    if altura < 2.5:  return "Mar agitado",        "#f97316"
    return                   "Mar muito agitado",  "#ef4444"


def _direcao_cardinal(graus: float) -> str:
    """Converte graus em ponto cardinal de 16 posicoes."""
    dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE",
            "S","SSO","SO","OSO","O","ONO","NO","NNO"]
    return dirs[round(graus / 22.5) % 16]


def _estimar_mare(fase_nome: str, iluminacao: float) -> dict:
    """
    Estima nivel de mare pela fase lunar.
    Sizígia (Lua Cheia/Nova) = mare alta.
    Quadratura (Quartos)     = mare baixa.
    """
    if fase_nome in ("Lua Nova", "Lua Cheia"):
        return {
            "mare_tipo":      "Maré de Sizígia",
            "mare_nivel":     "alta",
            "mare_descricao": "Lua Cheia ou Nova amplifica as marés — nivel mais alto e baixo que o normal",
            "mare_alerta":    True,
            "mare_cor":       "#f97316",
        }
    if fase_nome in ("Quarto Crescente", "Quarto Minguante"):
        return {
            "mare_tipo":      "Maré de Quadratura",
            "mare_nivel":     "baixa",
            "mare_descricao": "Quarto da lua modera as marés — variacao menor que o normal",
            "mare_alerta":    False,
            "mare_cor":       "#22c55e",
        }
    if iluminacao > 70:
        return {
            "mare_tipo":      "Maré crescente alta",
            "mare_nivel":     "media-alta",
            "mare_descricao": "Lua proxima da cheia — mares levemente amplificadas",
            "mare_alerta":    False,
            "mare_cor":       "#eab308",
        }
    if iluminacao < 30:
        return {
            "mare_tipo":      "Maré crescente baixa",
            "mare_nivel":     "media-baixa",
            "mare_descricao": "Lua proxima da nova — mares levemente amplificadas",
            "mare_alerta":    False,
            "mare_cor":       "#eab308",
        }
    return {
        "mare_tipo":      "Maré normal",
        "mare_nivel":     "normal",
        "mare_descricao": "Fase intermediaria da lua — mares dentro da normalidade",
        "mare_alerta":    False,
        "mare_cor":       "#22c55e",
    }


async def buscar_dados_marine() -> dict:
    """
    Busca condicoes maritimas via Open-Meteo Marine API.
    Cache TTL de 30min para evitar chamadas repetidas.
    """
    if "recife" in _cache_marine:
        logger.debug("Cache hit marine")
        return _cache_marine["recife"]

    params = {
        "latitude":  RECIFE_LAT,
        "longitude": RECIFE_LON,
        "current": [
            "wave_height", "wave_direction", "wave_period",
            "swell_wave_height", "swell_wave_direction", "swell_wave_period",
            "wind_wave_height",
        ],
        "hourly":       ["wave_height"],
        "forecast_days": 1,
        "timezone":     "America/Recife",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            "https://marine-api.open-meteo.com/v1/marine",
            params=params,
        )
        resp.raise_for_status()
        dados = resp.json()

    atual = dados.get("current", {})

    altura_ondas  = round(atual.get("wave_height")       or 0, 2)
    direcao_graus = atual.get("wave_direction")           or 0
    periodo       = round(atual.get("wave_period")        or 0, 1)
    swell_altura  = round(atual.get("swell_wave_height")  or 0, 2)
    vento_altura  = round(atual.get("wind_wave_height")   or 0, 2)

    classificacao, classificacao_cor = _classificar_ondas(altura_ondas)
    direcao = _direcao_cardinal(direcao_graus)

    # Impacto costeiro proporcional ao risco
    if classificacao_cor == "#ef4444":
        impacto   = "Risco alto — evite o mar em Boa Viagem, Pina e Brasília Teimosa"
        risco_cor = "#ef4444"
    elif classificacao_cor == "#f97316":
        impacto   = "Atencao em areas costeiras baixas — ondas podem atingir a orla"
        risco_cor = "#f97316"
    elif classificacao_cor == "#eab308":
        impacto   = "Mar moderado — cuidado para banhistas e embarcacoes pequenas"
        risco_cor = "#eab308"
    else:
        impacto   = "Condicoes seguras no litoral de Recife"
        risco_cor = "#22c55e"

    # Fase lunar para estimativa de mare
    _emoji, fase_nome, lua_iluminacao = _calcular_fase_lua()
    mare = _estimar_mare(fase_nome, lua_iluminacao)

    # Previsao de ondas proximas 6h
    horario       = dados.get("hourly", {})
    horas_prev    = (horario.get("time")        or [])[:6]
    alturas_prev  = (horario.get("wave_height") or [])[:6]
    previsao_ondas = [
        {"hora": h[11:16] if len(h) > 10 else h, "altura": round(a or 0, 2)}
        for h, a in zip(horas_prev, alturas_prev)
    ]

    resultado = {
        "altura_ondas":       altura_ondas,
        "direcao":            direcao,
        "direcao_graus":      round(direcao_graus),
        "periodo":            periodo,
        "swell_altura":       swell_altura,
        "vento_altura":       vento_altura,
        "classificacao":      classificacao,
        "classificacao_cor":  classificacao_cor,
        "impacto_costeiro":   impacto,
        "risco_costeiro_cor": risco_cor,
        "previsao_ondas":     previsao_ondas,
        **mare,
        "atualizado_em": datetime.now(tz=TZ_RECIFE).strftime("%Y-%m-%d %H:%M:%S"),
        "fonte": "Open-Meteo Marine API",
    }

    _cache_marine["recife"] = resultado
    logger.info("Marine: ondas %.1fm %s | %s", altura_ondas, direcao, classificacao)
    return resultado

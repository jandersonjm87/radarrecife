# ============================================================
#  backend/app/integrations/open_meteo.py
#
#  Responsabilidade: buscar dados meteorologicos via Open-Meteo.
#  API gratuita, sem necessidade de chave, alta precisao.
#  Cache TTL implementado para evitar chamadas repetidas.
# ============================================================

import httpx
import math
import logging
from datetime import datetime, timezone, timedelta
from cachetools import TTLCache
from app.core.config import get_settings

settings  = get_settings()
logger    = logging.getLogger("radar_recife.open_meteo")
TZ_RECIFE = timezone(timedelta(hours=-3))

# Cache em memoria — evita chamar Open-Meteo a cada request do frontend
# TTL de 5 minutos: dados frescos sem sobrecarregar a API externa
_cache_clima  = TTLCache(maxsize=50, ttl=settings.CACHE_CLIMA_TTL)
_cache_prev   = TTLCache(maxsize=10, ttl=settings.CACHE_CLIMA_TTL)




def _calcular_fase_lua() -> tuple[str, str, float]:
    """
    Calcula fase da lua via algoritmo astronomico (sem API).
    Baseado no ciclo sinodico de 29.53 dias a partir de lua nova conhecida.
    Retorna (emoji, nome, percentual_iluminacao).
    """
    # Lua nova de referencia: 2000-01-06 18:14 UTC
    referencia = datetime(2000, 1, 6, 18, 14, tzinfo=timezone.utc)
    agora = datetime.now(tz=timezone.utc)
    ciclo = 29.53058867

    diff_dias = (agora - referencia).total_seconds() / 86400
    fase = (diff_dias % ciclo) / ciclo  # 0.0 a 1.0

    iluminacao = round((1 - math.cos(2 * math.pi * fase)) / 2 * 100)

    if fase < 0.0625 or fase >= 0.9375:
        return "🌑", "Lua Nova", iluminacao
    elif fase < 0.1875:
        return "🌒", "Lua Crescente", iluminacao
    elif fase < 0.3125:
        return "🌓", "Quarto Crescente", iluminacao
    elif fase < 0.4375:
        return "🌔", "Gibosa Crescente", iluminacao
    elif fase < 0.5625:
        return "🌕", "Lua Cheia", iluminacao
    elif fase < 0.6875:
        return "🌖", "Gibosa Minguante", iluminacao
    elif fase < 0.8125:
        return "🌗", "Quarto Minguante", iluminacao
    else:
        return "🌘", "Lua Minguante", iluminacao


def _classificar_aqi(aqi) -> str:
    if aqi is None: return "Indisponivel"
    if aqi <= 20:   return "Muito boa"
    if aqi <= 40:   return "Boa"
    if aqi <= 60:   return "Moderada"
    if aqi <= 80:   return "Ruim"
    if aqi <= 100:  return "Muito ruim"
    return "Pessima"


def _formatar_hora(iso_str) -> str | None:
    if not iso_str: return None
    try: return iso_str[11:16]
    except: return None


def _calcular_acumulados(horario: dict) -> tuple[float, float, float]:
    agora = datetime.now(tz=TZ_RECIFE)
    horas = horario.get("time", [])
    precipitacoes = horario.get("precipitation", [])
    acc_24h = acc_48h = acc_72h = 0.0
    for i, hora_str in enumerate(horas):
        if i >= len(precipitacoes): break
        hora_dt = datetime.fromisoformat(hora_str).replace(tzinfo=TZ_RECIFE)
        diff_horas = (agora - hora_dt).total_seconds() / 3600
        if 0 <= diff_horas <= 72:
            valor = precipitacoes[i] or 0.0
            acc_72h += valor
            if diff_horas <= 48: acc_48h += valor
            if diff_horas <= 24: acc_24h += valor
    return round(acc_24h, 1), round(acc_48h, 1), round(acc_72h, 1)


async def buscar_clima_atual(latitude: float, longitude: float) -> dict:
    """
    Busca condicoes climaticas completas.
    Usa cache TTL de 5 minutos — evita multiplas chamadas para a mesma coordenada.
    - Tempo atual (temperatura, vento, chuva, UV, pressao)
    - Acumulados 24h/48h/72h
    - Dados astronomicos (nascer/por do sol, fase da lua calculada localmente)
    - Qualidade do ar via Open-Meteo Air Quality API
    """
    chave = f"{round(latitude,3)},{round(longitude,3)}"
    if chave in _cache_clima:
        logger.debug("Cache hit clima: %s", chave)
        return _cache_clima[chave]

    params_clima = {
        "latitude": latitude,
        "longitude": longitude,
        "current": [
            "temperature_2m", "apparent_temperature", "relative_humidity_2m",
            "wind_speed_10m", "wind_gusts_10m", "wind_direction_10m",
            "surface_pressure", "uv_index", "precipitation",
            "precipitation_probability", "weather_code",
        ],
        "hourly": ["precipitation", "visibility", "cloud_cover"],
        "daily": ["sunrise", "sunset", "uv_index_max", "precipitation_sum"],
        "timezone": "America/Recife",
        "past_days": 3,
        "forecast_days": 1,
    }

    params_ar = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ["pm10", "pm2_5", "european_aqi"],
        "timezone": "America/Recife",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp_clima = await client.get(
            f"{settings.OPEN_METEO_URL}/forecast",
            params=params_clima,
        )
        resp_clima.raise_for_status()
        dados = resp_clima.json()

        try:
            resp_ar = await client.get(
                "https://air-quality-api.open-meteo.com/v1/air-quality",
                params=params_ar,
            )
            dados_ar = resp_ar.json().get("current", {})
        except Exception:
            dados_ar = {}

    atual    = dados.get("current", {})
    diario   = dados.get("daily", {})
    horario  = dados.get("hourly", {})

    acumulado_24h, acumulado_48h, acumulado_72h = _calcular_acumulados(horario)

    # Visibilidade e nuvens da hora atual
    hora_idx = datetime.now().hour
    visibilidade     = (horario.get("visibility") or [])[hora_idx] if hora_idx < len(horario.get("visibility") or []) else None
    cobertura_nuvens = (horario.get("cloud_cover") or [])[hora_idx] if hora_idx < len(horario.get("cloud_cover") or []) else None

    # Fase da lua calculada localmente
    fase_emoji, fase_nome, lua_iluminacao = _calcular_fase_lua()

    aqi = dados_ar.get("european_aqi")

    resultado = {
        "temperatura":       atual.get("temperature_2m"),
        "sensacao_termica":  atual.get("apparent_temperature"),
        "umidade":           atual.get("relative_humidity_2m"),
        "velocidade_vento":  atual.get("wind_speed_10m"),
        "rajada_vento":      atual.get("wind_gusts_10m"),
        "direcao_vento":     atual.get("wind_direction_10m"),
        "pressao":           atual.get("surface_pressure"),
        "indice_uv":         atual.get("uv_index"),
        "uv_max_dia":        (diario.get("uv_index_max") or [None])[0],
        "volume_chuva":      atual.get("precipitation"),
        "prob_chuva":        atual.get("precipitation_probability"),
        "codigo_tempo":      atual.get("weather_code"),
        "visibilidade":      visibilidade,
        "cobertura_nuvens":  cobertura_nuvens,
        "acumulado_24h":     acumulado_24h,
        "acumulado_48h":     acumulado_48h,
        "acumulado_72h":     acumulado_72h,
        # Astronomia
        "nascer_sol":        _formatar_hora((diario.get("sunrise") or [None])[0]),
        "por_sol":           _formatar_hora((diario.get("sunset") or [None])[0]),
        "fase_lua":          fase_nome,
        "fase_lua_emoji":    fase_emoji,
        "lua_iluminacao":    lua_iluminacao,
        # Qualidade do ar
        "aqi":               aqi,
        "aqi_label":         _classificar_aqi(aqi),
        "pm25":              dados_ar.get("pm2_5"),
        "pm10":              dados_ar.get("pm10"),
        "coletado_em":       datetime.now().isoformat(),
        "fonte":             "open-meteo",
    }
    _cache_clima[chave] = resultado
    logger.info("Open-Meteo clima: %s | %s°C | IRA calculado", chave, resultado.get("temperatura"))
    return resultado


async def buscar_previsao_horaria(latitude: float, longitude: float) -> list[dict]:
    """Busca previsao hora a hora para as proximas 24h."""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": [
            "temperature_2m", "precipitation_probability",
            "precipitation", "weather_code", "wind_speed_10m",
        ],
        "timezone": "America/Recife",
        "forecast_days": 1,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(f"{settings.OPEN_METEO_URL}/forecast", params=params)
        response.raise_for_status()
        dados = response.json()

    horario = dados.get("hourly", {})
    horas   = horario.get("time", [])
    previsao = []
    for i, hora in enumerate(horas):
        def get(key, idx=i): return horario.get(key, [])[idx] if idx < len(horario.get(key, [])) else None
        previsao.append({
            "hora":         hora,
            "temperatura":  get("temperature_2m"),
            "prob_chuva":   get("precipitation_probability"),
            "volume_chuva": get("precipitation"),
            "codigo_tempo": get("weather_code"),
        })
    return previsao


def calcular_ira(
    volume_mm: float, prob_chuva: int, umidade: int,
    risco_base: int = 0, acumulado_24h: float = 0.0,
    acumulado_48h: float = 0.0, acumulado_72h: float = 0.0,
    alerta_oficial: bool = False, alagamento_confirmado: bool = False,
) -> tuple[int, list[str]]:
    """Calcula IRA com logica baseada em evidencias. Retorna (score, motivos)."""
    motivos: list[str] = []
    volume_atual = volume_mm or 0
    prob_norm    = (prob_chuva or 0) / 100.0
    acc_24       = acumulado_24h or 0
    acc_48       = acumulado_48h or 0
    acc_72       = acumulado_72h or 0

    if alerta_oficial:
        motivos.append("Alerta oficial ativo (APAC/CEMADEN/Defesa Civil)")
        return 75, motivos
    if alagamento_confirmado:
        motivos.append("Alagamento confirmado por fonte verificada")
        return 75, motivos
    if acc_24 > 50:
        motivos.append(f"Acumulado critico: {acc_24}mm nas ultimas 24h")
        return 75, motivos
    if acc_48 > 80:
        motivos.append(f"Acumulado critico: {acc_48}mm nas ultimas 48h")
        return 70, motivos
    if acc_72 > 100:
        motivos.append(f"Acumulado critico: {acc_72}mm nas ultimas 72h")
        return 65, motivos

    chuva_forte    = volume_atual > 10 or acc_24 > 25
    prob_alta      = prob_norm > 0.80
    historico_alto = (risco_base or 0) > 60

    if chuva_forte and prob_alta and historico_alto:
        motivos.append(f"Chuva forte ({volume_atual}mm), prob. {prob_chuva}%, historico critico")
        return 50, motivos
    if chuva_forte and prob_alta:
        motivos.append(f"Chuva forte ({volume_atual}mm) com probabilidade {prob_chuva}%")
        return 45, motivos
    if volume_atual > 2 or (prob_norm > 0.60 and volume_atual > 0.5):
        motivos.append(f"Chuva moderada prevista ({volume_atual}mm, prob. {prob_chuva}%)")
        if acc_24 > 10:
            motivos.append(f"Solo com acumulado de {acc_24}mm nas ultimas 24h")
        return 30, motivos

    bonus_umidade   = min(((umidade or 0) - 60) * 0.25, 10) if (umidade or 0) > 60 else 0
    base            = risco_base or 0
    bonus_historico = 8 if base >= 80 else 5 if base >= 60 else 3 if base >= 40 else 0
    score           = min(int(bonus_umidade + bonus_historico), 20)

    if bonus_umidade > 0:
        motivos.append(f"Umidade elevada ({umidade}%) — solo parcialmente saturado")
    if bonus_historico > 0:
        motivos.append(f"Bairro com historico de risco (base: {base})")

    return score, motivos


def classificar_nivel(ira: int) -> str:
    if ira <= 20: return "verde"
    if ira <= 40: return "amarelo"
    if ira <= 60: return "laranja"
    return "vermelho"


def descrever_tempo(codigo: int) -> str:
    descricoes = {
        0: "Ceu limpo", 1: "Principalmente limpo", 2: "Parcialmente nublado", 3: "Nublado",
        45: "Neblina", 48: "Neblina com gelo",
        51: "Garoa leve", 53: "Garoa moderada", 55: "Garoa intensa",
        61: "Chuva leve", 63: "Chuva moderada", 65: "Chuva forte",
        80: "Pancadas leves", 81: "Pancadas moderadas", 82: "Pancadas violentas",
        95: "Tempestade", 96: "Tempestade c/ granizo", 99: "Tempestade intensa",
    }
    return descricoes.get(codigo, "Condicoes variaveis")

# ============================================================
#  backend/app/integrations/open_meteo.py
#
#  Responsabilidade: buscar dados meteorologicos via Open-Meteo.
#  API gratuita, sem necessidade de chave, alta precisao.
#  Documentacao: https://open-meteo.com/en/docs
# ============================================================

import httpx
from datetime import datetime, timezone, timedelta
from app.core.config import get_settings

settings = get_settings()

# Fuso horario de Recife (UTC-3)
TZ_RECIFE = timezone(timedelta(hours=-3))


async def buscar_clima_atual(latitude: float, longitude: float) -> dict:
    """
    Busca condicoes climaticas atuais para uma coordenada.
    Retorna temperatura, umidade, vento, chuva e acumulados 24h/48h/72h.
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
        "hourly": ["precipitation"],
        "timezone": "America/Recife",
        "past_days": 3,
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
    horario = dados.get("hourly", {})

    # Calcula acumulados usando as horas anteriores ao momento atual
    acumulado_24h, acumulado_48h, acumulado_72h = _calcular_acumulados(horario)

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
        "acumulado_48h":    acumulado_48h,
        "acumulado_72h":    acumulado_72h,
        "coletado_em":      datetime.now().isoformat(),
        "fonte":            "open-meteo",
    }


def _calcular_acumulados(horario: dict) -> tuple[float, float, float]:
    """
    Calcula precipitacao acumulada nas ultimas 24h, 48h e 72h.
    Usa as horas anteriores ao momento atual como referencia.
    """
    agora = datetime.now(tz=TZ_RECIFE)
    horas = horario.get("time", [])
    precipitacoes = horario.get("precipitation", [])

    acc_24h = 0.0
    acc_48h = 0.0
    acc_72h = 0.0

    for i, hora_str in enumerate(horas):
        if i >= len(precipitacoes):
            break

        # Converte string ISO para datetime com fuso de Recife
        hora_dt = datetime.fromisoformat(hora_str).replace(tzinfo=TZ_RECIFE)
        diff_horas = (agora - hora_dt).total_seconds() / 3600

        # Soma apenas horas passadas (nao previsao futura)
        if 0 <= diff_horas <= 72:
            valor = precipitacoes[i] or 0.0
            acc_72h += valor
            if diff_horas <= 48:
                acc_48h += valor
            if diff_horas <= 24:
                acc_24h += valor

    return round(acc_24h, 1), round(acc_48h, 1), round(acc_72h, 1)


async def buscar_previsao_horaria(latitude: float, longitude: float) -> list[dict]:
    """
    Busca previsao meteorologica hora a hora para as proximas 24h.
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
    acumulado_48h: float = 0.0,
    acumulado_72h: float = 0.0,
    alerta_oficial: bool = False,
    alagamento_confirmado: bool = False,
) -> tuple[int, list[str]]:
    """
    Calcula o IRA — Indice de Risco de Alagamento.
    Retorna o score (0-100) e a lista de motivos para transparencia.

    VERDE    (0-20):  padrao — sem evidencias de risco
    AMARELO (21-40):  chuva moderada prevista
    LARANJA (41-60):  chuva forte + contexto de risco
    VERMELHO(61-100): alerta oficial ou alagamento confirmado ou >50mm
    """
    motivos: list[str] = []

    volume_atual   = volume_mm or 0
    prob_norm      = (prob_chuva or 0) / 100.0
    acc_24         = acumulado_24h or 0
    acc_48         = acumulado_48h or 0
    acc_72         = acumulado_72h or 0
    historico_alto = (risco_base or 0) > 60

    # --- VERMELHO: exige evidencia concreta ---
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

    # --- LARANJA: chuva forte + contexto ---
    chuva_forte    = volume_atual > 10 or acc_24 > 25
    prob_alta      = prob_norm > 0.80

    if chuva_forte and prob_alta and historico_alto:
        motivos.append(f"Chuva forte ({volume_atual}mm) com probabilidade {prob_chuva}%")
        motivos.append(f"Bairro com historico critico de alagamentos (base: {risco_base})")
        return 50, motivos

    if chuva_forte and prob_alta:
        motivos.append(f"Chuva forte ({volume_atual}mm) com probabilidade {prob_chuva}%")
        return 45, motivos

    # --- AMARELO: chuva moderada ---
    if volume_atual > 2 or (prob_norm > 0.60 and volume_atual > 0.5):
        motivos.append(f"Chuva moderada prevista ({volume_atual}mm, prob. {prob_chuva}%)")
        if acc_24 > 10:
            motivos.append(f"Solo ja com acumulado de {acc_24}mm nas ultimas 24h")
        return 30, motivos

    # --- VERDE: sem evidencias ---
    bonus_umidade = min(((umidade or 0) - 60) * 0.3, 15) if (umidade or 0) > 60 else 0
    score = min(int(bonus_umidade), 20)

    if score > 0:
        motivos.append(f"Umidade elevada ({umidade}%) — solo parcialmente saturado")

    return score, motivos


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

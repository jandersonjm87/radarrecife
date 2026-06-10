# ============================================================
#  backend/app/services/clima_service.py
# ============================================================
from datetime import datetime
from app.integrations.open_meteo import (
    buscar_clima_atual, buscar_previsao_horaria,
    calcular_ira, classificar_nivel, descrever_tempo,
)


async def buscar_clima_bairro(
    bairro_nome: str, latitude: float, longitude: float, risco_base: int = 0,
) -> dict:
    dados = await buscar_clima_atual(latitude, longitude)

    ira, motivos = calcular_ira(
        volume_mm=dados.get("volume_chuva") or 0,
        prob_chuva=dados.get("prob_chuva") or 0,
        umidade=dados.get("umidade") or 0,
        risco_base=risco_base,
        acumulado_24h=dados.get("acumulado_24h") or 0,
        acumulado_48h=dados.get("acumulado_48h") or 0,
        acumulado_72h=dados.get("acumulado_72h") or 0,
    )

    nivel    = classificar_nivel(ira)
    descricao = descrever_tempo(dados.get("codigo_tempo") or 0)

    return {
        "bairro":           bairro_nome,
        "latitude":         latitude,
        "longitude":        longitude,
        "temperatura":      dados.get("temperatura"),
        "sensacao_termica": dados.get("sensacao_termica"),
        "umidade":          dados.get("umidade"),
        "velocidade_vento": dados.get("velocidade_vento"),
        "rajada_vento":     dados.get("rajada_vento"),
        "direcao_vento":    dados.get("direcao_vento"),
        "pressao":          dados.get("pressao"),
        "indice_uv":        dados.get("indice_uv"),
        "uv_max_dia":       dados.get("uv_max_dia"),
        "volume_chuva":     dados.get("volume_chuva"),
        "prob_chuva":       dados.get("prob_chuva"),
        "visibilidade":     dados.get("visibilidade"),
        "cobertura_nuvens": dados.get("cobertura_nuvens"),
        "acumulado_24h":    dados.get("acumulado_24h"),
        "acumulado_48h":    dados.get("acumulado_48h"),
        "acumulado_72h":    dados.get("acumulado_72h"),
        "nascer_sol":       dados.get("nascer_sol"),
        "por_sol":          dados.get("por_sol"),
        "nascer_lua":       dados.get("nascer_lua"),
        "por_lua":          dados.get("por_lua"),
        "fase_lua":         dados.get("fase_lua"),
        "fase_lua_emoji":   dados.get("fase_lua_emoji"),
        "aqi":              dados.get("aqi"),
        "aqi_label":        dados.get("aqi_label"),
        "pm25":             dados.get("pm25"),
        "pm10":             dados.get("pm10"),
        "descricao_tempo":  descricao,
        "ira":              ira,
        "nivel":            nivel,
        "motivos":          motivos,
        "atualizado_em":    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


async def buscar_previsao_bairro(latitude: float, longitude: float) -> list[dict]:
    previsao = await buscar_previsao_horaria(latitude, longitude)
    return [
        {**hora, "descricao": descrever_tempo(hora.get("codigo_tempo") or 0)}
        for hora in previsao
    ]

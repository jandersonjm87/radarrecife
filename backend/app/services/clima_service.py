# ============================================================
#  backend/app/services/clima_service.py
#
#  Responsabilidade: orquestrar a coleta e processamento
#  dos dados climaticos para cada bairro de Recife.
# ============================================================
from datetime import datetime
from app.integrations.open_meteo import (
    buscar_clima_atual,
    buscar_previsao_horaria,
    calcular_ira,
    classificar_nivel,
    descrever_tempo,
)


async def buscar_clima_bairro(
    bairro_nome: str,
    latitude: float,
    longitude: float,
    risco_base: int = 0,
) -> dict:
    """
    Busca e processa dados climaticos completos para um bairro.
    Calcula o IRA com acumulado 24h e classifica o nivel de risco.
    """
    dados = await buscar_clima_atual(latitude, longitude)

    # Passa o acumulado_24h para o calculo do IRA — campo adicionado
    # no open_meteo.py para garantir rastreabilidade do risco real
    ira = calcular_ira(
        volume_mm=dados.get("volume_chuva") or 0,
        prob_chuva=dados.get("prob_chuva") or 0,
        umidade=dados.get("umidade") or 0,
        risco_base=risco_base,
        acumulado_24h=dados.get("acumulado_24h") or 0,
    )

    nivel = classificar_nivel(ira)
    descricao = descrever_tempo(dados.get("codigo_tempo") or 0)

    return {
        "bairro":           bairro_nome,
        "latitude":         latitude,
        "longitude":        longitude,
        "temperatura":      dados.get("temperatura"),
        "sensacao_termica": dados.get("sensacao_termica"),
        "umidade":          dados.get("umidade"),
        "velocidade_vento": dados.get("velocidade_vento"),
        "direcao_vento":    dados.get("direcao_vento"),
        "pressao":          dados.get("pressao"),
        "indice_uv":        dados.get("indice_uv"),
        "volume_chuva":     dados.get("volume_chuva"),
        "prob_chuva":       dados.get("prob_chuva"),
        "acumulado_24h":    dados.get("acumulado_24h"),
        "descricao_tempo":  descricao,
        "ira":              ira,
        "nivel":            nivel,
        "atualizado_em":    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


async def buscar_previsao_bairro(
    latitude: float,
    longitude: float,
) -> list[dict]:
    """
    Busca previsao hora a hora para um bairro.
    Adiciona descricao em portugues para cada hora.
    """
    previsao = await buscar_previsao_horaria(latitude, longitude)

    return [
        {
            **hora,
            "descricao": descrever_tempo(hora.get("codigo_tempo") or 0),
        }
        for hora in previsao
    ]

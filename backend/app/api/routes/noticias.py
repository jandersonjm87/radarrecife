# ============================================================
#  backend/app/api/routes/noticias.py
#  Sistema de noticias inteligentes do Radar Recife.
# ============================================================

import asyncio
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
from app.integrations.noticias_rss import buscar_noticias_inteligentes
from app.integrations.open_meteo import buscar_clima_atual, calcular_ira, classificar_nivel
from app.data.bairros_recife import BAIRROS_RECIFE

router = APIRouter()

RECIFE_LAT = -8.0631
RECIFE_LON  = -34.8711
TZ_RECIFE   = timezone(timedelta(hours=-3))


def _gerar_boletim(dados: dict, ira: int, nivel: str) -> dict:
    """Gera boletim automatico baseado nos dados climaticos reais."""
    agora = datetime.now(tz=TZ_RECIFE).strftime("%d/%m/%Y %H:%M")
    vol   = dados.get("volume_chuva", 0)
    prob  = dados.get("prob_chuva", 0)
    temp  = dados.get("temperatura", 0)
    umid  = dados.get("umidade", 0)
    acc   = dados.get("acumulado_24h", 0)
    desc  = dados.get("descricao_tempo", "")

    if nivel == "vermelho":
        titulo = f"ALERTA CRITICO: Risco alto de alagamento — IRA {ira}/100"
        descricao = f"Acumulado 24h: {acc}mm. Volume atual: {vol}mm. Prob. {prob}%. Evite areas de risco."
    elif nivel == "laranja":
        titulo = f"ALERTA: Condicoes de risco em Recife — IRA {ira}/100"
        descricao = f"Chuva forte detectada. Volume: {vol}mm. Prob. {prob}%. Acumulado 24h: {acc}mm."
    elif nivel == "amarelo":
        titulo = f"ATENCAO: Chuva moderada prevista — IRA {ira}/100"
        descricao = f"Prob. de chuva: {prob}%. Temperatura: {temp}°C. Umidade: {umid}%."
    else:
        titulo = f"Recife sem alertas ativos — {desc}"
        descricao = f"Condicoes normais. Temp: {temp}°C. Prob. chuva: {prob}%. Umidade: {umid}%."

    return {
        "titulo":        titulo,
        "descricao":     descricao,
        "link":          "",
        "fonte":         "Radar Recife — Boletim Automatico",
        "data":          agora,
        "data_raw":      "",
        "tempo_relativo": "agora",
        "nivel":         nivel,
        "tipo":          "boletim_automatico",
        "confianca":     100,
        "bairros":       [],
        "rodovias":      [],
        "impacta_ira":   nivel in ("laranja", "vermelho"),
    }


@router.get("/")
async def listar_noticias():
    """Retorna noticias inteligentes + boletim automatico."""
    try:
        dados_clima, noticias = await asyncio.gather(
            buscar_clima_atual(RECIFE_LAT, RECIFE_LON),
            buscar_noticias_inteligentes(),
        )

        ira_tuple = calcular_ira(
            volume_mm=dados_clima.get("volume_chuva") or 0,
            prob_chuva=dados_clima.get("prob_chuva") or 0,
            umidade=dados_clima.get("umidade") or 0,
            risco_base=20,
            acumulado_24h=dados_clima.get("acumulado_24h") or 0,
            acumulado_48h=dados_clima.get("acumulado_48h") or 0,
            acumulado_72h=dados_clima.get("acumulado_72h") or 0,
        )
        ira, _ = ira_tuple
        nivel  = classificar_nivel(ira)

        boletim  = _gerar_boletim(dados_clima, ira, nivel)
        todas    = [boletim] + noticias

        # Estatisticas de impacto
        criticas  = [n for n in noticias if n["nivel"] == "vermelho"]
        alertas   = [n for n in noticias if n["nivel"] == "laranja"]
        atencoes  = [n for n in noticias if n["nivel"] == "amarelo"]
        bairros_afetados = list({b for n in noticias for b in n.get("bairros", [])})
        rodovias_afetadas = list({r for n in noticias for r in n.get("rodovias", [])})

        return {
            "total":             len(todas),
            "noticias":          todas,
            "resumo": {
                "criticas":          len(criticas),
                "alertas":           len(alertas),
                "atencoes":          len(atencoes),
                "bairros_afetados":  bairros_afetados,
                "rodovias_afetadas": rodovias_afetadas,
                "ira_atual":         ira,
                "nivel_atual":       nivel,
            },
            "atualizado_em": datetime.now(tz=TZ_RECIFE).strftime("%Y-%m-%d %H:%M:%S"),
        }
    except Exception as erro:
        raise HTTPException(status_code=503, detail=str(erro))


@router.get("/impacto")
async def impacto_bairros():
    """
    Retorna quais bairros estao sendo citados nas noticias
    e o impacto estimado no IRA de cada um.
    """
    try:
        noticias = await buscar_noticias_inteligentes()

        impacto: dict = {}
        for noticia in noticias:
            if not noticia.get("impacta_ira"):
                continue
            for bairro in noticia.get("bairros", []):
                if bairro not in impacto:
                    impacto[bairro] = {
                        "bairro":   bairro,
                        "noticias": [],
                        "nivel_max": "verde",
                        "fontes":   [],
                    }
                impacto[bairro]["noticias"].append(noticia["titulo"][:80])
                impacto[bairro]["fontes"].append(noticia["fonte"])
                # Eleva nivel se necessario
                niveis = ["verde", "amarelo", "laranja", "vermelho"]
                atual  = impacto[bairro]["nivel_max"]
                novo   = noticia["nivel"]
                if niveis.index(novo) > niveis.index(atual):
                    impacto[bairro]["nivel_max"] = novo

        return {
            "total_bairros_afetados": len(impacto),
            "bairros": list(impacto.values()),
            "atualizado_em": datetime.now(tz=TZ_RECIFE).strftime("%Y-%m-%d %H:%M:%S"),
        }
    except Exception as erro:
        raise HTTPException(status_code=503, detail=str(erro))

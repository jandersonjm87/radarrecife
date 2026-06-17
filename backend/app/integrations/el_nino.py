# ============================================================
#  backend/app/integrations/el_nino.py
#
#  Busca dados reais do indice ONI (El Nino/La Nina) via NOAA.
#  Fonte: Climate Prediction Center — NOAA/NWS
#  URL: https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt
# ============================================================

import httpx
import logging
from cachetools import TTLCache
from app.core.config import get_settings

settings = get_settings()
logger   = logging.getLogger('radar_recife.elnino')
_cache_elnino = TTLCache(maxsize=2, ttl=settings.CACHE_ELNINO_TTL)

from datetime import datetime, timezone, timedelta

NOAA_ONI_URL = "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt"

TZ_RECIFE = timezone(timedelta(hours=-3))

# Limiares oficiais NOAA para classificacao ONI
def _classificar_oni(oni: float) -> dict:
    """
    Classifica o fenomeno com base no indice ONI.
    Limiares oficiais NOAA:
    - El Nino forte:   ONI >= +1.5
    - El Nino moderado: +1.0 <= ONI < +1.5
    - El Nino fraco:   +0.5 <= ONI < +1.0
    - Neutro:          -0.5 < ONI < +0.5
    - La Nina fraca:   -1.0 < ONI <= -0.5
    - La Nina moderada: -1.5 < ONI <= -1.0
    - La Nina forte:   ONI <= -1.5
    """
    if oni >= 2.0:
        return {"fenomeno": "el_nino", "intensidade": "Super Episodio", "cor": "#ef4444", "bg": "#7f1d1d", "label": "SUPER — ATIVO"}
    elif oni >= 1.5:
        return {"fenomeno": "el_nino", "intensidade": "Forte", "cor": "#ef4444", "bg": "#7f1d1d", "label": "FORTE — ATIVO"}
    elif oni >= 1.0:
        return {"fenomeno": "el_nino", "intensidade": "Moderado", "cor": "#f97316", "bg": "#7c2d12", "label": "MODERADO — ATIVO"}
    elif oni >= 0.5:
        return {"fenomeno": "el_nino", "intensidade": "Fraco", "cor": "#eab308", "bg": "#713f12", "label": "FRACO — ATIVO"}
    elif oni > -0.5:
        return {"fenomeno": "neutro", "intensidade": "Neutro", "cor": "#22c55e", "bg": "#14532d", "label": "NEUTRO"}
    elif oni > -1.0:
        return {"fenomeno": "la_nina", "intensidade": "Fraca", "cor": "#60a5fa", "bg": "#1e3a5f", "label": "FRACA — ATIVA"}
    elif oni > -1.5:
        return {"fenomeno": "la_nina", "intensidade": "Moderada", "cor": "#3b82f6", "bg": "#1e3a5f", "label": "MODERADA — ATIVA"}
    else:
        return {"fenomeno": "la_nina", "intensidade": "Forte", "cor": "#1d4ed8", "bg": "#1e3a5f", "label": "FORTE — ATIVA"}


def _impactos_recife(fenomeno: str, intensidade: str, oni: float) -> list[str]:
    """Gera impactos esperados para Recife baseados no fenomeno atual."""
    mes_atual = datetime.now().month

    if fenomeno == "el_nino":
        if oni >= 1.5:
            return [
                f"Volume de chuvas significativamente acima da media em Pernambuco",
                "Maior risco de eventos extremos na Zona Sul e Oeste de Recife",
                "Monitoramento intensificado recomendado para bairros de alto risco",
            ]
        elif oni >= 0.5:
            return [
                "Leve aumento na probabilidade de chuvas acima da media",
                "Condicoes favoraveis para precipitacao no litoral pernambucano",
                "Monitoramento de rotina recomendado",
            ]
    elif fenomeno == "la_nina":
        if oni <= -1.0:
            return [
                "Reducao significativa no volume de chuvas esperado",
                "Risco de estiagem prolongada no agreste e sertao pernambucano",
                "Periodo seco mais intenso que o habitual previsto",
            ]
        else:
            return [
                "Leve reducao na probabilidade de chuvas acima da media",
                "Condicoes proximas ao normal para o litoral",
            ]
    return [
        "Condicoes climaticas dentro da normalidade esperada",
        "Sem influencia significativa de fenomenos climaticos globais",
        "Monitoramento padrao recomendado",
    ]


async def buscar_dados_el_nino() -> dict:
    """
    Busca e processa dados reais do indice ONI via NOAA.
    Retorna classificacao, tendencia dos ultimos 6 meses e impactos para Recife.
    """
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            NOAA_ONI_URL,
            headers={"User-Agent": "RadarRecife/1.0"},
        )
        resp.raise_for_status()
        texto = resp.text

    linhas = [l.strip() for l in texto.strip().split('\n') if l.strip()]

    # Ignora cabecalho e parseia dados
    # Formato NOAA: SEASON YEAR SST ANOM
    # Coluna 2 = SST (temperatura), Coluna 3 = ANOM (anomalia = indice ONI real)
    registros = []
    for linha in linhas:
        partes = linha.split()
        if len(partes) >= 4:
            try:
                periodo = f"{partes[0]} {partes[1]}"
                oni     = float(partes[3])  # anomalia = indice ONI
                registros.append({"periodo": periodo, "oni": oni})
            except (ValueError, IndexError):
                continue

    if not registros:
        raise ValueError("Nenhum dado ONI encontrado no arquivo NOAA")

    # Ultimos 6 registros para tendencia
    ultimos = registros[-6:]
    atual   = registros[-1]
    oni_atual = atual["oni"]

    classificacao = _classificar_oni(oni_atual)
    impactos      = _impactos_recife(
        classificacao["fenomeno"],
        classificacao["intensidade"],
        oni_atual,
    )

    # Calcula variacao em relacao ao periodo anterior
    variacao = round(oni_atual - registros[-2]["oni"], 2) if len(registros) >= 2 else 0
    tendencia_label = "estavel"
    if variacao > 0.1:   tendencia_label = "aquecendo"
    elif variacao < -0.1: tendencia_label = "esfriando"

    # Ponteiro para escala visual (-2 a +2 → 0% a 100%)
    ponteiro = min(max((oni_atual + 2) / 4 * 100, 0), 100)

    return {
        "oni_atual":      oni_atual,
        "periodo_ref":    atual["periodo"],
        "fenomeno":       classificacao["fenomeno"],
        "intensidade":    classificacao["intensidade"],
        "label_status":   classificacao["label"],
        "cor":            classificacao["cor"],
        "bg":             classificacao["bg"],
        "variacao":       variacao,
        "tendencia":      tendencia_label,
        "ponteiro":       round(ponteiro, 1),
        "impactos":       impactos,
        "tendencia_hist": [
            {"periodo": r["periodo"], "oni": r["oni"]}
            for r in ultimos
        ],
        "fonte":          "NOAA/CPC — Climate Prediction Center",
        "atualizado_em":  datetime.now(tz=TZ_RECIFE).strftime("%d/%m/%Y as %H:%M"),
    }

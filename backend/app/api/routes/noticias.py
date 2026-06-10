# ============================================================
#  backend/app/api/routes/noticias.py
#  Noticias climaticas + boletins automaticos do Radar Recife.
# ============================================================

from fastapi import APIRouter, HTTPException
from app.integrations.noticias_rss import buscar_noticias_clima
from app.integrations.open_meteo import buscar_clima_atual, calcular_ira, classificar_nivel
from datetime import datetime

router = APIRouter()

# Coordenadas do centro de Recife
RECIFE_LAT = -8.0631
RECIFE_LON = -34.8711


async def _gerar_boletim_automatico() -> list[dict]:
    """
    Gera boletins meteorologicos automaticos baseados nos
    dados reais da Open-Meteo e no calculo do IRA.
    """
    try:
        dados = await buscar_clima_atual(RECIFE_LAT, RECIFE_LON)
        ira = calcular_ira(
            volume_mm=dados.get("volume_chuva") or 0,
            prob_chuva=dados.get("prob_chuva") or 0,
            umidade=dados.get("umidade") or 0,
            risco_base=20,
        )
        nivel = classificar_nivel(ira)
        agora = datetime.now().strftime("%d/%m/%Y %H:%M")

        boletins = []

        # Boletim principal baseado no IRA
        if nivel == "vermelho":
            boletins.append({
                "titulo": f"ALERTA: Alto risco de alagamento em Recife — IRA {ira}/100",
                "descricao": f"Condicoes criticas detectadas. Volume de chuva: {dados.get('volume_chuva', 0)}mm. Prob. chuva: {dados.get('prob_chuva', 0)}%. Evite areas de risco.",
                "link": "",
                "fonte": "Radar Recife — Alerta Automatico",
                "data": agora,
                "automatico": True,
                "nivel": "vermelho",
            })
        elif nivel == "laranja":
            boletins.append({
                "titulo": f"ATENCAO: Condicoes de alerta em Recife — IRA {ira}/100",
                "descricao": f"Situacao de alerta. Prob. de chuva: {dados.get('prob_chuva', 0)}%. Umidade: {dados.get('umidade', 0)}%. Fique atento aos boletins.",
                "link": "",
                "fonte": "Radar Recife — Alerta Automatico",
                "data": agora,
                "automatico": True,
                "nivel": "laranja",
            })
        elif nivel == "amarelo":
            boletins.append({
                "titulo": f"Condicoes de atencao em Recife — {dados.get('descricao_tempo', '')}",
                "descricao": f"Prob. de chuva: {dados.get('prob_chuva', 0)}%. Temperatura: {dados.get('temperatura', 0)}C. Umidade: {dados.get('umidade', 0)}%.",
                "link": "",
                "fonte": "Radar Recife — Boletim Automatico",
                "data": agora,
                "automatico": True,
                "nivel": "amarelo",
            })
        else:
            boletins.append({
                "titulo": f"Recife sem alertas ativos — {dados.get('descricao_tempo', '')}",
                "descricao": f"Condicoes normais. Temperatura: {dados.get('temperatura', 0)}C. Prob. de chuva: {dados.get('prob_chuva', 0)}%. Umidade: {dados.get('umidade', 0)}%.",
                "link": "",
                "fonte": "Radar Recife — Boletim Automatico",
                "data": agora,
                "automatico": True,
                "nivel": "verde",
            })

        return boletins

    except Exception as erro:
        print(f"Erro ao gerar boletim automatico: {erro}")
        return []


@router.get("/")
async def listar_noticias():
    """
    Retorna noticias de clima dos portais locais + boletins
    automaticos gerados pelo Radar Recife baseados no IRA.
    """
    try:
        noticias_rss, boletins = await __import__("asyncio").gather(
            buscar_noticias_clima(),
            _gerar_boletim_automatico(),
        )

        # Boletins automaticos sempre aparecem primeiro
        todas = boletins + noticias_rss

        return {
            "total": len(todas),
            "noticias": todas,
            "atualizado_em": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
    except Exception as erro:
        raise HTTPException(status_code=503, detail=str(erro))

# ============================================================
#  backend/app/api/routes/marine.py
#  Endpoint de condicoes maritimas para o litoral de Recife.
# ============================================================

from fastapi import APIRouter, HTTPException
from app.integrations.marine import buscar_dados_marine

router = APIRouter()


@router.get("/")
async def dados_maritimos():
    """
    Retorna condicoes maritimas em tempo real para o litoral de Recife.
    Fonte: Open-Meteo Marine API — gratuita, sem chave de API.
    Inclui: altura de ondas, direcao, periodo, swell e estimativa de mare lunar.
    """
    try:
        return await buscar_dados_marine()
    except Exception as erro:
        raise HTTPException(status_code=503, detail=str(erro))

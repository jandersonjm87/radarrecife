# ============================================================
#  backend/app/api/routes/clima.py
#  Endpoints de dados climaticos do Radar Recife.
# ============================================================

from fastapi import APIRouter, HTTPException

from app.services.clima_service import (
    buscar_clima_bairro,
    buscar_previsao_bairro,
)

router = APIRouter()


@router.get("/atual")
async def clima_atual():
    """
    Retorna condicoes climaticas atuais do centro de Recife.
    Coordenadas do Marco Zero — Praca do Arsenal.
    """
    try:
        return await buscar_clima_bairro(
            bairro_nome="Recife — Marco Zero",
            latitude=-8.0631,
            longitude=-34.8711,
            risco_base=20,
        )
    except Exception as erro:
        raise HTTPException(status_code=503, detail=str(erro))


@router.get("/previsao")
async def previsao_horaria():
    """Retorna previsao hora a hora para as proximas 24h."""
    try:
        return await buscar_previsao_bairro(
            latitude=-8.0631,
            longitude=-34.8711,
        )
    except Exception as erro:
        raise HTTPException(status_code=503, detail=str(erro))


@router.get("/bairro/{latitude}/{longitude}")
async def clima_por_coordenada(
    latitude: float,
    longitude: float,
    nome: str = "Bairro",
    risco_base: int = 0,
):
    """
    Retorna condicoes climaticas para qualquer coordenada.
    Usado para buscar dados de bairros especificos.
    """
    try:
        return await buscar_clima_bairro(
            bairro_nome=nome,
            latitude=latitude,
            longitude=longitude,
            risco_base=risco_base,
        )
    except Exception as erro:
        raise HTTPException(status_code=503, detail=str(erro))

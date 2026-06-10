# ============================================================
#  backend/app/api/routes/el_nino.py
#  Endpoint de dados El Nino / La Nina via NOAA.
# ============================================================

from fastapi import APIRouter, HTTPException
from app.integrations.el_nino import buscar_dados_el_nino

router = APIRouter()


@router.get("/")
async def dados_el_nino():
    """
    Retorna dados reais do indice ONI (El Nino/La Nina).
    Fonte: NOAA Climate Prediction Center.
    Atualizado mensalmente pelo NOAA.
    """
    try:
        return await buscar_dados_el_nino()
    except Exception as erro:
        raise HTTPException(status_code=503, detail=str(erro))

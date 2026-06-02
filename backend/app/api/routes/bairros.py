# ============================================================
#  backend/app/api/routes/bairros.py
#  Endpoints de bairros de Recife.
# ============================================================

from fastapi import APIRouter, HTTPException
from app.data.bairros_recife import BAIRROS_RECIFE, PONTOS_CRITICOS_BR232
from app.services.clima_service import buscar_clima_bairro

router = APIRouter()


@router.get("/")
async def listar_bairros():
    """Retorna lista de todos os bairros com coordenadas e risco base."""
    return {
        "total": len(BAIRROS_RECIFE),
        "bairros": BAIRROS_RECIFE,
        "atualizado_em": "dados estaticos — risco base historico",
    }


@router.get("/clima")
async def clima_todos_bairros():
    """
    Retorna condicoes climaticas em tempo real para todos os bairros.
    Cada bairro tem IRA calculado com base no risco historico.
    """
    resultados = []
    for bairro in BAIRROS_RECIFE[:10]:
        try:
            dados = await buscar_clima_bairro(
                bairro_nome=bairro["nome"],
                latitude=bairro["latitude"],
                longitude=bairro["longitude"],
                risco_base=bairro["risco_base"],
            )
            resultados.append(dados)
        except Exception:
            resultados.append({
                "bairro": bairro["nome"],
                "erro": "dados indisponiveis",
            })
    return {"total": len(resultados), "bairros": resultados}


@router.get("/{nome}")
async def clima_bairro(nome: str):
    """Retorna condicoes climaticas em tempo real para um bairro especifico."""
    bairro = next(
        (b for b in BAIRROS_RECIFE if b["nome"].lower() == nome.lower()),
        None,
    )
    if not bairro:
        raise HTTPException(status_code=404, detail=f"Bairro {nome} nao encontrado")

    try:
        return await buscar_clima_bairro(
            bairro_nome=bairro["nome"],
            latitude=bairro["latitude"],
            longitude=bairro["longitude"],
            risco_base=bairro["risco_base"],
        )
    except Exception as erro:
        raise HTTPException(status_code=503, detail=str(erro))


@router.get("/rodovias/br232")
async def pontos_criticos_br232():
    """Retorna pontos criticos mapeados na BR-232."""
    return {
        "total": len(PONTOS_CRITICOS_BR232),
        "pontos": PONTOS_CRITICOS_BR232,
    }

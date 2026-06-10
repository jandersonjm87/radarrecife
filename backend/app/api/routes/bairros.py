# ============================================================
#  backend/app/api/routes/bairros.py
#  Endpoints de bairros de Recife.
# ============================================================
from fastapi import APIRouter, HTTPException
from app.data.bairros_recife import BAIRROS_RECIFE, PONTOS_CRITICOS_BR232
from app.services.clima_service import buscar_clima_bairro
from app.integrations.open_meteo import (
    buscar_clima_atual,
    calcular_ira,
    classificar_nivel,
)

router = APIRouter()


@router.get("/")
async def listar_bairros():
    """Retorna lista de todos os bairros com coordenadas e risco base."""
    return {
        "total": len(BAIRROS_RECIFE),
        "bairros": BAIRROS_RECIFE,
        "atualizado_em": "dados estaticos — risco base historico",
    }


@router.get("/ranking")
async def ranking_bairros():
    """
    Retorna ranking dinamico dos 89 bairros ordenado por IRA.

    Estrategia: busca dados climaticos uma vez para o centro de Recife
    e aplica calcular_ira para cada bairro usando seu risco_base individual.
    Evita 89 chamadas a API — rapido e eficiente.
    """
    try:
        # Uma unica chamada para o Marco Zero — clima valido para toda Recife
        clima = await buscar_clima_atual(
            latitude=-8.0631,
            longitude=-34.8711,
        )
    except Exception as erro:
        raise HTTPException(status_code=503, detail=f"Erro ao buscar clima: {erro}")

    ranking = []
    for bairro in BAIRROS_RECIFE:
        ira, motivos = calcular_ira(
            volume_mm=clima.get("volume_chuva") or 0,
            prob_chuva=clima.get("prob_chuva") or 0,
            umidade=clima.get("umidade") or 0,
            risco_base=bairro["risco_base"],
            acumulado_24h=clima.get("acumulado_24h") or 0,
            acumulado_48h=clima.get("acumulado_48h") or 0,
            acumulado_72h=clima.get("acumulado_72h") or 0,
        )
        nivel = classificar_nivel(ira)

        ranking.append({
            "nome":       bairro["nome"],
            "latitude":   bairro["latitude"],
            "longitude":  bairro["longitude"],
            "risco_base": bairro["risco_base"],
            "ira":        ira,
            "nivel":      nivel,
            "motivos":    motivos,
        })

    # Ordena por IRA decrescente — bairros mais criticos primeiro
    ranking.sort(key=lambda x: x["ira"], reverse=True)

    return {
        "total":         len(ranking),
        "clima_base":    {
            "volume_chuva":  clima.get("volume_chuva"),
            "prob_chuva":    clima.get("prob_chuva"),
            "umidade":       clima.get("umidade"),
            "acumulado_24h": clima.get("acumulado_24h"),
            "acumulado_48h": clima.get("acumulado_48h"),
            "acumulado_72h": clima.get("acumulado_72h"),
        },
        "bairros":       ranking,
    }


@router.get("/clima")
async def clima_todos_bairros():
    """
    Retorna condicoes climaticas em tempo real para os primeiros 10 bairros.
    Para o ranking completo, use /ranking.
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
    """
    Retorna apenas pontos criticos ATIVOS nas rodovias de PE.
    Pontos inativos nao sao exibidos — manifesto anti-alarme.
    Um ponto so e ativado por noticia verificada ou alerta oficial.
    """
    ativos = [p for p in PONTOS_CRITICOS_BR232 if p.get("ativo")]
    return {
        "total": len(ativos),
        "pontos": ativos,
        "monitorados": len(PONTOS_CRITICOS_BR232),
    }

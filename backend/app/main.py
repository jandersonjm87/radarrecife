# ============================================================
#  backend/app/main.py
#  Ponto de entrada da aplicacao Radar Recife.
# ============================================================

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.routes import clima, bairros, noticias, el_nino, marine

settings = get_settings()

# Logger estruturado — substitui print() em producao
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("radar_recife")

app = FastAPI(
    title="Radar Recife",
    description="Monitoramento de chuvas e alertas em tempo real para Recife e Pernambuco.",
    version=settings.APP_VERSION,
)

# CORS seguro — origens permitidas vem do .env
# Em desenvolvimento: ALLOWED_ORIGINS=* | Em producao: dominio exato do Railway
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET"],          # API somente leitura
    allow_headers=["Content-Type"],
)

# ── Routers ───────────────────────────────────────────────
app.include_router(clima.router,    prefix="/api/clima",    tags=["Clima"])
app.include_router(bairros.router,  prefix="/api/bairros",  tags=["Bairros"])
app.include_router(noticias.router, prefix="/api/noticias", tags=["Noticias"])
app.include_router(el_nino.router,  prefix="/api/elnino",   tags=["El Nino"])
app.include_router(marine.router,   prefix="/api/marine",   tags=["Marine"])

# ── Health check ──────────────────────────────────────────
@app.get("/api/health", tags=["Sistema"])
async def health_check():
    """Verifica se a API esta no ar."""
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "versao": settings.APP_VERSION,
        "desenvolvido_por": "Janderson Maciel",
    }

logger.info("Radar Recife API iniciada — v%s", settings.APP_VERSION)

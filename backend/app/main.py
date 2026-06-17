# ============================================================
#  backend/app/main.py
#  Ponto de entrada da aplicacao Radar Recife.
# ============================================================

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.api.routes import clima, bairros, noticias, el_nino, marine

settings = get_settings()

# Logger estruturado — substitui print() em producao
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("radar_recife")

# Rate limiter — protege contra abuso e ban da Open-Meteo
# 60 requests/minuto por IP e endpoint
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(
    title="Radar Recife",
    description="Monitoramento de chuvas e alertas em tempo real para Recife e Pernambuco.",
    version=settings.APP_VERSION,
)

# Rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS seguro — origens permitidas vem do .env
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET"],
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

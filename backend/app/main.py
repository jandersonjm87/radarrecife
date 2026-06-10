# ============================================================
#  backend/app/main.py
#  Ponto de entrada da aplicacao Radar Recife.
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.routes import clima, bairros, noticias

settings = get_settings()

app = FastAPI(
    title="Radar Recife",
    description="Monitoramento de chuvas e alertas em tempo real para Recife e Pernambuco.",
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────
app.include_router(clima.router,   prefix="/api/clima",   tags=["Clima"])
app.include_router(bairros.router, prefix="/api/bairros", tags=["Bairros"])
app.include_router(noticias.router, prefix="/api/noticias", tags=["Noticias"])

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

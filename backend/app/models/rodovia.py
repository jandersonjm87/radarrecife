# ============================================================
#  backend/app/models/rodovia.py
#  Modelo de dados para pontos criticos de rodovias.
# ============================================================

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class PontoCriticoRodovia(Base):
    """Ponto critico mapeado em rodovias de Pernambuco."""

    __tablename__ = "pontos_criticos_rodovias"

    id        = Column(Integer, primary_key=True, index=True)
    rodovia   = Column(String(20), nullable=False)   # BR-232, BR-101, etc
    km        = Column(Integer)
    local     = Column(String(200))
    municipio = Column(String(100))
    tipo      = Column(String(50))   # alagamento, deslizamento, barro_pista
    ativo     = Column(Boolean, default=True, index=True)
    observacao = Column(String(500))
    latitude  = Column(Float)
    longitude = Column(Float)
    criado_em = Column(DateTime, server_default=func.now())

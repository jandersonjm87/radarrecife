# ============================================================
#  backend/app/models/bairro.py
#  Modelo de dados para bairros de Recife.
# ============================================================

from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Bairro(Base):
    """Representa um bairro de Recife com dados de risco."""

    __tablename__ = "bairros"

    id              = Column(Integer, primary_key=True, index=True)
    nome            = Column(String(100), nullable=False, index=True)
    zona            = Column(String(50))
    regiao          = Column(String(50))
    latitude        = Column(Float, nullable=False)
    longitude       = Column(Float, nullable=False)
    risco_base      = Column(Integer, default=0)   # 0-100 historico
    pontos_criticos = Column(JSON, default=list)
    ativo           = Column(Boolean, default=True)
    criado_em       = Column(DateTime, server_default=func.now())


class PontoCritico(Base):
    """Representa um ponto critico de alagamento em Recife."""

    __tablename__ = "pontos_criticos"

    id          = Column(Integer, primary_key=True, index=True)
    bairro_id   = Column(Integer, nullable=False, index=True)
    nome        = Column(String(200), nullable=False)
    descricao   = Column(String(500))
    latitude    = Column(Float)
    longitude   = Column(Float)
    tipo        = Column(String(50))   # alagamento, deslizamento, etc
    ativo       = Column(Boolean, default=True)
    observacao  = Column(String(500))
    criado_em   = Column(DateTime, server_default=func.now())

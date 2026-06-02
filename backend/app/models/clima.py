# ============================================================
#  backend/app/models/clima.py
#  Modelo de dados para condicoes climaticas.
# ============================================================

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class DadoClimatico(Base):
    """Registra condicoes climaticas coletadas em tempo real."""

    __tablename__ = "dados_climaticos"

    id               = Column(Integer, primary_key=True, index=True)
    bairro_id        = Column(Integer, ForeignKey("bairros.id"), index=True)
    temperatura      = Column(Float)
    sensacao_termica = Column(Float)
    umidade          = Column(Integer)
    velocidade_vento = Column(Float)
    direcao_vento    = Column(Integer)
    pressao          = Column(Float)
    indice_uv        = Column(Float)
    prob_chuva       = Column(Integer)    # 0-100%
    volume_chuva     = Column(Float)      # mm
    ira              = Column(Integer)    # 0-100
    fonte            = Column(String(50))
    coletado_em      = Column(DateTime, server_default=func.now(), index=True)


class PrevisaoHoraria(Base):
    """Previsao meteorologica hora a hora."""

    __tablename__ = "previsao_horaria"

    id           = Column(Integer, primary_key=True, index=True)
    bairro_id    = Column(Integer, ForeignKey("bairros.id"), index=True)
    hora         = Column(DateTime, nullable=False, index=True)
    temperatura  = Column(Float)
    prob_chuva   = Column(Integer)
    volume_chuva = Column(Float)
    descricao    = Column(String(200))
    criado_em    = Column(DateTime, server_default=func.now())

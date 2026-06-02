# ============================================================
#  backend/app/models/alerta.py
#  Modelo de dados para alertas meteorologicos.
# ============================================================

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Alerta(Base):
    """
    Alerta meteorologico gerado automaticamente pelo sistema.
    Niveis: verde, amarelo, laranja, vermelho.
    """

    __tablename__ = "alertas"

    id          = Column(Integer, primary_key=True, index=True)
    bairro_id   = Column(Integer, ForeignKey("bairros.id"), nullable=True, index=True)
    nivel       = Column(String(10), nullable=False)   # verde/amarelo/laranja/vermelho
    titulo      = Column(String(200))
    mensagem    = Column(Text)
    tipo        = Column(String(50))   # chuva/alagamento/vento/rodovia
    ativo       = Column(Boolean, default=True, index=True)
    gerado_em   = Column(DateTime, server_default=func.now(), index=True)
    expira_em   = Column(DateTime)

# ============================================================
#  backend/app/core/database.py
#  Configuracao do banco de dados PostgreSQL.
#  Usa SQLAlchemy com suporte a sessoes assincronas.
# ============================================================

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()

# ── Engine e sessao ───────────────────────────────────────
engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ── Base para os modelos ──────────────────────────────────
Base = declarative_base()


def get_db():
    """
    Gera uma sessao do banco de dados.
    Fecha automaticamente ao final da requisicao.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

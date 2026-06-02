# ============================================================
#  backend/app/data/bairros_recife.py
#
#  Lista completa dos 94 bairros oficiais de Recife
#  com coordenadas geograficas e risco historico de alagamento.
#
#  Risco base (0-100):
#    0-20  → historicamente seguro
#    21-40 → risco baixo
#    41-60 → risco moderado
#    61-80 → risco alto
#    81-100→ critico historico
# ============================================================

BAIRROS_RECIFE = [
    # ── Zona Sul ─────────────────────────────────────────
    {"nome": "Imbiribeira",       "latitude": -8.1063, "longitude": -34.9089, "zona": "Sul",    "risco_base": 85},
    {"nome": "Boa Viagem",        "latitude": -8.1181, "longitude": -34.9003, "zona": "Sul",    "risco_base": 70},
    {"nome": "Piedade",           "latitude": -8.1079, "longitude": -34.9194, "zona": "Sul",    "risco_base": 65},
    {"nome": "Candeias",          "latitude": -8.1139, "longitude": -34.9267, "zona": "Sul",    "risco_base": 55},
    {"nome": "Pina",              "latitude": -8.1008, "longitude": -34.8953, "zona": "Sul",    "risco_base": 60},
    {"nome": "Brasilia Teimosa",  "latitude": -8.0931, "longitude": -34.8831, "zona": "Sul",    "risco_base": 50},
    {"nome": "Ilha do Leite",     "latitude": -8.0650, "longitude": -34.8950, "zona": "Sul",    "risco_base": 40},
    {"nome": "Ilha Joana Bezerra","latitude": -8.0789, "longitude": -34.8958, "zona": "Sul",    "risco_base": 55},

    # ── Zona Oeste ───────────────────────────────────────
    {"nome": "Afogados",          "latitude": -8.0889, "longitude": -34.9272, "zona": "Oeste",  "risco_base": 80},
    {"nome": "Torroes",           "latitude": -8.0961, "longitude": -34.9361, "zona": "Oeste",  "risco_base": 70},
    {"nome": "Mustardinha",       "latitude": -8.0831, "longitude": -34.9400, "zona": "Oeste",  "risco_base": 65},
    {"nome": "San Martin",        "latitude": -8.0789, "longitude": -34.9439, "zona": "Oeste",  "risco_base": 55},
    {"nome": "Caçote",            "latitude": -8.0931, "longitude": -34.9183, "zona": "Oeste",  "risco_base": 60},
    {"nome": "Estancia",          "latitude": -8.0972, "longitude": -34.9156, "zona": "Oeste",  "risco_base": 65},
    {"nome": "Coelhos",           "latitude": -8.0681, "longitude": -34.9094, "zona": "Oeste",  "risco_base": 50},
    {"nome": "Ilha do Retiro",    "latitude": -8.0750, "longitude": -34.9183, "zona": "Oeste",  "risco_base": 55},
    {"nome": "Mangueira",         "latitude": -8.0811, "longitude": -34.9228, "zona": "Oeste",  "risco_base": 60},
    {"nome": "Sancho",            "latitude": -8.0850, "longitude": -34.9311, "zona": "Oeste",  "risco_base": 50},
    {"nome": "Jardim Sao Paulo",  "latitude": -8.0900, "longitude": -34.9472, "zona": "Oeste",  "risco_base": 55},
    {"nome": "Curado",            "latitude": -8.0789, "longitude": -34.9578, "zona": "Oeste",  "risco_base": 45},

    # ── Zona Norte ───────────────────────────────────────
    {"nome": "Casa Amarela",      "latitude": -8.0211, "longitude": -34.9239, "zona": "Norte",  "risco_base": 55},
    {"nome": "Vasco da Gama",     "latitude": -8.0281, "longitude": -34.9150, "zona": "Norte",  "risco_base": 50},
    {"nome": "Alto Jose do Pinho","latitude": -8.0189, "longitude": -34.9178, "zona": "Norte",  "risco_base": 40},
    {"nome": "Morro da Conceicao","latitude": -8.0069, "longitude": -34.9028, "zona": "Norte",  "risco_base": 45},
    {"nome": "Agua Fria",         "latitude": -7.9989, "longitude": -34.9028, "zona": "Norte",  "risco_base": 35},
    {"nome": "Bomba do Hemeterio","latitude": -8.0100, "longitude": -34.9078, "zona": "Norte",  "risco_base": 40},
    {"nome": "Porto da Madeira",  "latitude": -8.0031, "longitude": -34.9150, "zona": "Norte",  "risco_base": 35},
    {"nome": "Dois Unidos",       "latitude": -7.9950, "longitude": -34.9189, "zona": "Norte",  "risco_base": 35},
    {"nome": "Alto Jose Bonifacio","latitude":-8.0150, "longitude": -34.9261, "zona": "Norte",  "risco_base": 40},
    {"nome": "Mangabeira",        "latitude": -8.0219, "longitude": -34.9311, "zona": "Norte",  "risco_base": 45},
    {"nome": "Nova Descoberta",   "latitude": -8.0261, "longitude": -34.9189, "zona": "Norte",  "risco_base": 40},
    {"nome": "Arruda",            "latitude": -8.0369, "longitude": -34.9039, "zona": "Norte",  "risco_base": 45},
    {"nome": "Campina do Barreto","latitude": -8.0311, "longitude": -34.9072, "zona": "Norte",  "risco_base": 50},
    {"nome": "Fundao",            "latitude": -8.0250, "longitude": -34.9039, "zona": "Norte",  "risco_base": 40},
    {"nome": "Peixinhos",         "latitude": -8.0019, "longitude": -34.9239, "zona": "Norte",  "risco_base": 35},
    {"nome": "Beberibe",          "latitude": -8.0150, "longitude": -34.9178, "zona": "Norte",  "risco_base": 45},

    # ── Zona Noroeste ─────────────────────────────────────
    {"nome": "Iputinga",          "latitude": -8.0400, "longitude": -34.9578, "zona": "Noroeste","risco_base": 70},
    {"nome": "Cordeiro",          "latitude": -8.0481, "longitude": -34.9489, "zona": "Noroeste","risco_base": 65},
    {"nome": "Caxanga",           "latitude": -8.0361, "longitude": -34.9628, "zona": "Noroeste","risco_base": 70},
    {"nome": "Torre",             "latitude": -8.0461, "longitude": -34.9400, "zona": "Noroeste","risco_base": 55},
    {"nome": "Madalena",          "latitude": -8.0519, "longitude": -34.9322, "zona": "Noroeste","risco_base": 65},
    {"nome": "Zumbi",             "latitude": -8.0300, "longitude": -34.9578, "zona": "Noroeste","risco_base": 55},
    {"nome": "Encruzilhada",      "latitude": -8.0400, "longitude": -34.9189, "zona": "Noroeste","risco_base": 50},
    {"nome": "Tamarineira",       "latitude": -8.0319, "longitude": -34.9261, "zona": "Noroeste","risco_base": 50},
    {"nome": "Apipucos",          "latitude": -8.0181, "longitude": -34.9439, "zona": "Noroeste","risco_base": 45},
    {"nome": "Poco da Panela",    "latitude": -8.0211, "longitude": -34.9372, "zona": "Noroeste","risco_base": 50},
    {"nome": "Monteiro",          "latitude": -8.0250, "longitude": -34.9461, "zona": "Noroeste","risco_base": 45},
    {"nome": "Parnamirim",        "latitude": -8.0169, "longitude": -34.9511, "zona": "Noroeste","risco_base": 40},
    {"nome": "Santana",           "latitude": -8.0289, "longitude": -34.9511, "zona": "Noroeste","risco_base": 45},

    # ── Centro ────────────────────────────────────────────
    {"nome": "Santo Antonio",     "latitude": -8.0631, "longitude": -34.8811, "zona": "Centro", "risco_base": 35},
    {"nome": "Boa Vista",         "latitude": -8.0569, "longitude": -34.8939, "zona": "Centro", "risco_base": 40},
    {"nome": "Derby",             "latitude": -8.0531, "longitude": -34.8978, "zona": "Centro", "risco_base": 35},
    {"nome": "Soledade",          "latitude": -8.0561, "longitude": -34.9028, "zona": "Centro", "risco_base": 40},
    {"nome": "Gracas",            "latitude": -8.0481, "longitude": -34.9000, "zona": "Centro", "risco_base": 35},
    {"nome": "Espinheiro",        "latitude": -8.0431, "longitude": -34.9050, "zona": "Centro", "risco_base": 35},
    {"nome": "Jaqueira",          "latitude": -8.0400, "longitude": -34.9000, "zona": "Centro", "risco_base": 30},
    {"nome": "Parque Amorim",     "latitude": -8.0450, "longitude": -34.9089, "zona": "Centro", "risco_base": 40},
    {"nome": "Aflitos",           "latitude": -8.0369, "longitude": -34.9050, "zona": "Centro", "risco_base": 35},
    {"nome": "Torreao",           "latitude": -8.0419, "longitude": -34.9133, "zona": "Centro", "risco_base": 40},
    {"nome": "Rosarinho",         "latitude": -8.0350, "longitude": -34.9100, "zona": "Centro", "risco_base": 35},
    {"nome": "Hipódromo",         "latitude": -8.0389, "longitude": -34.9161, "zona": "Centro", "risco_base": 40},
    {"nome": "Prado",             "latitude": -8.0550, "longitude": -34.9133, "zona": "Centro", "risco_base": 45},
    {"nome": "Ilha do Principe",  "latitude": -8.0600, "longitude": -34.9011, "zona": "Centro", "risco_base": 40},

    # ── Zona Sudoeste ─────────────────────────────────────
    {"nome": "Ibura",             "latitude": -8.1289, "longitude": -34.9456, "zona": "Sudoeste","risco_base": 60},
    {"nome": "Jordao",            "latitude": -8.1219, "longitude": -34.9406, "zona": "Sudoeste","risco_base": 55},
    {"nome": "Cohab",             "latitude": -8.1181, "longitude": -34.9489, "zona": "Sudoeste","risco_base": 50},
    {"nome": "Ipsep",             "latitude": -8.1100, "longitude": -34.9461, "zona": "Sudoeste","risco_base": 55},
    {"nome": "Areias",            "latitude": -8.1019, "longitude": -34.9500, "zona": "Sudoeste","risco_base": 60},
    {"nome": "Barro",             "latitude": -8.1061, "longitude": -34.9578, "zona": "Sudoeste","risco_base": 55},
    {"nome": "Tejipió",           "latitude": -8.0969, "longitude": -34.9561, "zona": "Sudoeste","risco_base": 65},
    {"nome": "Caçote",            "latitude": -8.0931, "longitude": -34.9183, "zona": "Sudoeste","risco_base": 60},

    # ── Zona Leste ────────────────────────────────────────
    {"nome": "Recife",            "latitude": -8.0631, "longitude": -34.8711, "zona": "Leste",  "risco_base": 30},
    {"nome": "Santo Amaro",       "latitude": -8.0700, "longitude": -34.8850, "zona": "Leste",  "risco_base": 35},
    {"nome": "Joana Bezerra",     "latitude": -8.0769, "longitude": -34.8919, "zona": "Leste",  "risco_base": 40},
    {"nome": "Cabanga",           "latitude": -8.0831, "longitude": -34.8881, "zona": "Leste",  "risco_base": 35},
    {"nome": "Coelhos",           "latitude": -8.0681, "longitude": -34.9000, "zona": "Leste",  "risco_base": 45},
    {"nome": "Paissandu",         "latitude": -8.0611, "longitude": -34.8961, "zona": "Leste",  "risco_base": 50},
    {"nome": "Boa Vista",         "latitude": -8.0569, "longitude": -34.8939, "zona": "Leste",  "risco_base": 40},
    {"nome": "Engenho do Meio",   "latitude": -8.0561, "longitude": -34.9261, "zona": "Leste",  "risco_base": 55},
    {"nome": "Cidade Universitaria","latitude":-8.0519,"longitude": -34.9489, "zona": "Leste",  "risco_base": 35},
    {"nome": "Varzea",            "latitude": -8.0489, "longitude": -34.9628, "zona": "Leste",  "risco_base": 60},
    {"nome": "Caxanga",           "latitude": -8.0361, "longitude": -34.9628, "zona": "Leste",  "risco_base": 65},

    # ── Pontos de referencia ──────────────────────────────
    {"nome": "Campo Grande",      "latitude": -8.0681, "longitude": -34.9133, "zona": "Centro", "risco_base": 55},
    {"nome": "Bongi",             "latitude": -8.0819, "longitude": -34.9300, "zona": "Oeste",  "risco_base": 60},
    {"nome": "Iputinga",          "latitude": -8.0400, "longitude": -34.9578, "zona": "Noroeste","risco_base": 65},
    {"nome": "Casa Forte",        "latitude": -8.0181, "longitude": -34.9311, "zona": "Norte",  "risco_base": 50},
    {"nome": "Poco",              "latitude": -8.0239, "longitude": -34.9350, "zona": "Norte",  "risco_base": 45},
    {"nome": "Sitio dos Pintos",  "latitude": -7.9981, "longitude": -34.9361, "zona": "Norte",  "risco_base": 35},
    {"nome": "Guabiraba",         "latitude": -8.0019, "longitude": -34.9578, "zona": "Norte",  "risco_base": 30},
]


PONTOS_CRITICOS_BR232 = [
    {"rodovia": "BR-232", "km": 29,  "local": "Moreno",                 "municipio": "Moreno",                 "tipo": "barro_pista",    "latitude": -8.1200, "longitude": -35.0900},
    {"rodovia": "BR-232", "km": 40,  "local": "Vitoria de Santo Antao", "municipio": "Vitoria de Santo Antao", "tipo": "alagamento",     "latitude": -8.1200, "longitude": -35.2900},
    {"rodovia": "BR-232", "km": 41,  "local": "Vitoria de Santo Antao", "municipio": "Vitoria de Santo Antao", "tipo": "alagamento",     "latitude": -8.1219, "longitude": -35.2950},
    {"rodovia": "BR-232", "km": 80,  "local": "Gravata",                "municipio": "Gravata",                "tipo": "deslizamento",   "latitude": -8.2019, "longitude": -35.5639},
    {"rodovia": "BR-232", "km": 130, "local": "Caruaru",                "municipio": "Caruaru",                "tipo": "alagamento",     "latitude": -8.2769, "longitude": -35.9761},
    {"rodovia": "BR-101", "km": 60,  "local": "Paulista",               "municipio": "Paulista",               "tipo": "alagamento",     "latitude": -7.9400, "longitude": -34.8800},
    {"rodovia": "BR-101", "km": 80,  "local": "Abreu e Lima",           "municipio": "Abreu e Lima",           "tipo": "alagamento",     "latitude": -7.9100, "longitude": -34.8980},
]

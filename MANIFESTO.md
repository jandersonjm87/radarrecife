# Sistema de Inteligência Climática e Urbana (IRA)

## Princípio Fundamental

A plataforma não deve funcionar como um simples site de previsão do tempo.

O objetivo é criar um sistema inteligente de monitoramento climático e impacto urbano para Recife, baseado exclusivamente em dados verificáveis, fontes confiáveis e ocorrências reais.

Toda informação apresentada ao usuário deve possuir rastreabilidade e justificativa técnica.

A plataforma deve evitar alarmismo, mas também não pode deixar de alertar quando houver risco real.

## Regra de Ouro

Nenhum alerta crítico poderá ser gerado apenas por previsão meteorológica.

Nenhum bairro poderá ser marcado como área crítica apenas porque existe chance de chuva.

Nenhuma rodovia, avenida ou ponto de trânsito poderá aparecer como crítico sem evidências complementares.

O sistema deve trabalhar sempre com validação cruzada entre múltiplas fontes.

---

# Sistema IRA (Índice de Risco de Alagamento)

O IRA será um índice dinâmico de 0 a 100 calculado automaticamente para cada bairro.

O índice deverá ser atualizado continuamente sem intervenção manual.

O cálculo deve considerar:

### Dados Meteorológicos

* Intensidade da chuva prevista.
* Volume acumulado previsto.
* Acumulado das últimas 24 horas.
* Acumulado das últimas 48 horas.
* Acumulado das últimas 72 horas.
* Probabilidade de precipitação.
* Persistência da chuva.

### Dados Geográficos

* Histórico de alagamentos.
* Proximidade de rios e canais.
* Topografia local.
* Regiões de drenagem crítica.

### Dados Oficiais

* Alertas da APAC.
* Alertas da Defesa Civil.
* Alertas do CEMADEN.
* Comunicados governamentais.

### Dados de Notícias

Monitorar automaticamente:

* Portais de notícias.
* Jornais locais.
* Comunicados oficiais.
* Alertas públicos.

O sistema deve identificar automaticamente menções como:

* Alagamento.
* Via interditada.
* Trânsito parado.
* Deslizamento.
* Chuva intensa.
* Ponto crítico.
* Emergência.

Cada notícia validada deve influenciar o IRA do bairro correspondente.

---

# Sistema de Rodovias e Pontos Críticos

A seção "Pontos Críticos" não deve existir permanentemente.

Ela deve aparecer apenas quando houver registros válidos.

Se não existirem ocorrências confirmadas, exibir:

"Nenhum ponto crítico confirmado neste momento."

O card deve ser criado automaticamente quando houver:

* Notícia validada.
* Alerta oficial.
* Registro confirmado.
* Interdição informada por órgãos competentes.

Quando a situação normalizar, o ponto deve ser removido automaticamente.

---

# Sistema de Notícias Inteligentes

As notícias não devem apenas ser exibidas.

Elas devem alimentar o motor de risco.

Fluxo:

Notícia publicada → IA analisa conteúdo → Identifica bairros citados
→ Identifica nível de gravidade → Valida a fonte → Atualiza IRA
→ Atualiza mapa → Atualiza ranking de bairros

Tudo automaticamente.

---

# Ranking Dinâmico de Bairros

A lista de bairros deve atualizar automaticamente refletindo a situação atual.

Quando os dados mudarem: o IRA muda, o ranking muda, o mapa muda, os alertas mudam.

Tudo em tempo real.

---

# Política Anti-Alarme

O sistema deve ser conservador.

Em caso de dúvida entre dois níveis de risco, utilizar sempre o menor nível até que existam evidências suficientes para escalonamento.

Não marcar regiões críticas sem confirmação.
Não transformar previsão em ocorrência.
Não utilizar linguagem sensacionalista.
Não exibir vermelho sem justificativa robusta.

---

# Transparência Total

Todo alerta deverá possuir explicação com fontes consultadas.

O usuário deve entender claramente por que aquele bairro recebeu determinado nível de risco.

---

# Objetivo Final

Criar a plataforma mais confiável de monitoramento climático e risco urbano para Recife.

O sistema deve agir como um analista técnico especializado, cruzando meteorologia, histórico, geografia, alertas oficiais e notícias em tempo real para informar a população com precisão.

A plataforma deve alertar apenas quando necessário, mas nunca deixar de alertar quando houver risco real comprovado.

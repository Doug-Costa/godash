# DentalGO CRM — Campaigns, Journeys, Identity Resolution & Lifecycle Engine

## 0. Objetivo

Este documento define a arquitetura funcional para evoluir o DentalGO CRM sem criar ambiguidades entre:

- Atendimento comercial / Kanban
- Campanhas
- Jornadas / Fluxos
- Alertas
- Histórico de interações
- Importação e enriquecimento de leads
- Scheduler / execução automática
- Funis de vendas e pós-vendas
- Integrações de canais
- Futuramente, IA para atendimento

**Regra:** antes de implementar, o Antigravity deve inspecionar o código atual e reutilizar entidades, APIs e componentes existentes sempre que possível. Não criar abstrações paralelas apenas para fazer uma feature funcionar.

---

# 1. Modelo mental principal

O sistema deve separar três conceitos:

### Lead / Customer = identidade persistente

A pessoa é a entidade principal. Ela pode possuir várias fontes, campanhas, interações e históricos, mas não deve ser duplicada porque apareceu em outra origem.

Exemplo:

```text
Guilherme Silva
├── User DentalGO desde: 15/11/2021
├── Ex-aluno DentalPress
├── Curso: Prótese
├── Histórico de atendimentos
├── Histórico de campanhas
├── Histórico de interações
└── Estado atual no CRM
```

### Campanha = iniciativa

Campanha responde:

> **QUEM quero atingir e POR QUÊ?**

Exemplo:

```text
Campanha: Reativação Ex-Assinantes Julho 2026
Público: Ex-assinantes
Objetivo: Reativação
Jornada: Reativação 5 dias
Destino: Funil Comercial
```

### Jornada / Flow = mecanismo de execução

Jornada responde:

> **O QUE acontece, EM QUAL ORDEM e SOB QUAIS CONDIÇÕES?**

Exemplo:

```text
Entrada
  ↓
WhatsApp — Dia 1
  ↓
espera 1 dia
  ↓
Email — Dia 2
  ↓
espera 1 dia
  ↓
WhatsApp — Dia 3 + link
  ↓
verificar condição
```

### Atendimento = estado operacional humano

O Kanban responde:

> **O que está acontecendo com este lead agora e quem está tratando dele?**

---

# 2. Identity Resolution / Deduplicação

## Problema

O banco DentalGO já possui:

```text
Guilherme Silva
email: guilherme@email.com
telefone: 44999999999
```

Uma lista importada pode conter:

```text
Guilherme Silva
telefone: 44999999999
ex-aluno de Prótese
origem: DentalPress
```

O sistema NÃO deve criar dois Guilhermes.

Deve produzir:

```text
Guilherme Silva
├── origem DentalGO
├── origem DentalPress
├── ex-aluno de Prótese
├── histórico anterior
└── dados consolidados
```

## Ordem de matching

### Match forte

Priorizar:

1. ID externo conhecido da origem
2. Email normalizado
3. Telefone normalizado
4. Outros identificadores externos confiáveis

### Match contextual

Somente quando não houver match forte:

- nome normalizado
- nome + telefone parcial
- nome + email parcial
- outros dados auxiliares

### Regra crítica

**Nunca fazer merge automático baseado somente em nome quando houver risco relevante de colisão.**

`João Silva` não é identidade suficiente.

Quando a confiança for baixa:

```text
MATCH_CONFIDENCE = LOW
```

e o sistema deve permitir revisão.

---

# 3. Enriquecimento

Importação significa:

```text
SOURCE DATA
    ↓
IDENTITY RESOLUTION
    ↓
MATCH EXISTENTE?
    ├── SIM → ENRICH
    └── NÃO → CREATE
```

O enriquecimento deve ser aditivo e auditável.

Não sobrescrever silenciosamente dados anteriores. Em conflitos, preservar:

```text
valor antigo
valor novo
origem
timestamp
```

---

# 4. Relação correta entre Campanha e Jornada

A relação desejada é:

```text
Campanha
    │
    ├── Público
    ├── Objetivo
    ├── Funil
    └── Jornada
            │
            ├── WhatsApp
            ├── Email
            ├── Call
            ├── Delay
            ├── Condições
            └── Transições
```

Portanto:

> **Campanha seleciona/dispara Jornada.**
>
> **Jornada executa o relacionamento.**
>
> **Atendimento administra a operação humana/comercial.**

---

# 5. Campanha Wizard

O criador de campanha deve ser simplificado conceitualmente.

## Passo 1 — Natureza

Exemplos:

- Campanha Comercial
- Campanha Automática
- Marketing
- Nutrição
- Pós-venda

## Passo 2 — Segmentação

```text
Nome
Data de início
Fonte/base
Status
Regras
Exclusões
Público estimado
```

## Passo 3 — Jornada

```text
Jornada:
[ Selecionar Jornada Existente ]

ou

[ + Criar Nova Jornada ]
```

A Campanha não deve possuir um segundo editor de jornada independente.

A atual “Régua de Relacionamento” deve ser avaliada como candidata a migrar para o editor de Jornada.

---

# 6. Central de Jornadas

A Central de Jornadas é o editor do workflow.

Categorias:

```text
Marketing / Aquecimento
Comercial / Vendas
Pós-venda / Onboarding / CS
Nutrição / Recuperação / Lost
```

Exemplo:

```text
MARKETING
├── Aquecimento 15 dias
├── Leads novos
└── Reativação

COMERCIAL
├── Follow-up padrão
└── Follow-up agressivo

PÓS-VENDA
├── Boas-vindas
├── Onboarding
└── CS 30 dias

NUTRIÇÃO
├── Expirados
└── Perdidos
```

---

# 7. Lifecycle

Exemplo:

```text
LEAD
 ↓
MARKETING
 ↓
COMERCIAL
 ↓
GANHO
 ↓
PÓS-VENDA
```

ou:

```text
LEAD
 ↓
MARKETING
 ↓
COMERCIAL
 ↓
PERDIDO
 ↓
NUTRIÇÃO
 ↓
REATIVAÇÃO
```

As transições devem ser orientadas por eventos e regras.

---

# 8. Exemplo completo

Campanha:

> Ex-assinantes

Público:

```text
status = EXPIRED
```

Jornada:

```text
D0 → Entrada
D1 → WhatsApp
D2 → Email
D3 → WhatsApp + link
```

Se assinou:

```text
GANHO
 ↓
Funil Pós-venda
 ↓
Jornada Onboarding
 ↓
boas-vindas / notícias / uso do produto
```

Se não assinou:

```text
fim da jornada
 ↓
regra de transição
 ↓
Funil Comercial ou Nutrição
```

---

# 9. REGRA CRÍTICA — Suppression / Conflict Control

Um lead pode ser elegível para várias campanhas sem que todas devam executar.

Exemplo:

```text
Guilherme
├── Campanha A: Ex-assinantes
├── Campanha B: Curso de Prótese
└── Atendimento Comercial Humano
```

A regra é:

```text
ELIGIBLE ≠ EXECUTABLE
```

O sistema deve distinguir:

```text
NOT_ENROLLED
ENROLLED
ACTIVE
PAUSED
SUPPRESSED
COMPLETED
CONVERTED
LOST
CANCELLED
```

E registrar a razão:

```text
SUPPRESSED
reason = HUMAN_ATTENDANCE_ACTIVE
```

ou:

```text
SUPPRESSED
reason = CONFLICTING_CAMPAIGN
```

---

# 10. Atendimento humano tem prioridade

Se um lead está em automação e começa atendimento humano:

```text
Campanha
    ↓
Scheduler
    ↓
revalidação
    ↓
HUMAN_ATTENDANCE_ACTIVE
    ↓
não enviar
```

O sistema deve preferir `PAUSE` a simplesmente destruir o contexto da jornada quando houver possibilidade de retomada.

A retomada deve ser explícita e segura.

---

# 11. Campanhas concorrentes

Não assumir:

```text
qualquer campanha nova cancela qualquer campanha antiga
```

Verificar:

1. prioridade
2. tipo
3. lifecycle
4. exclusões
5. conflito de objetivo
6. jornada ativa
7. janela temporal
8. regra de supressão

A política de conflito deve ser determinística e configurável.

---

# 12. Scheduler

O scheduler não pode simplesmente:

```text
SELECT tasks
→ EXECUTE
```

O fluxo correto:

```text
TASK DUE
   ↓
LOAD CONTEXT
   ↓
VALIDATE LEAD
   ↓
VALIDATE CAMPAIGN
   ↓
VALIDATE JOURNEY
   ↓
CHECK SUPPRESSION
   ↓
CHECK HUMAN ATTENDANCE
   ↓
CHECK CONFLICTS
   ↓
CHECK IDEMPOTENCY
   ↓
EXECUTE
   ↓
RECORD INTERACTION
   ↓
UPDATE JOURNEY STATE
   ↓
CREATE NEXT TASK
```

## Regra essencial

O scheduler deve revalidar o estado **no momento da execução**.

Exemplo:

```text
08:00
→ tarefa WhatsApp criada para 14:00

13:30
→ vendedor assume atendimento

14:00
→ scheduler consulta contexto atual
→ bloqueia envio
→ registra motivo
```

O estado atual vence o estado que existia quando a tarefa foi criada.

---

# 13. Idempotência

Retry não pode significar envio duplicado.

Uma execução deve possuir identidade suficiente para ser reconhecida, por exemplo:

```text
campaignId
+
leadId
+
journeyId
+
stepId
+
executionWindow
```

Antes de executar:

```text
já executou?
    ↓
SIM → não executar novamente
NÃO → executar
```

Isso deve proteger contra:

- restart do worker
- retry do BullMQ
- timeout
- resposta perdida
- processo duplicado

---

# 14. Histórico / Auditoria

Toda execução importante deve produzir evento auditável.

Exemplo:

```text
Interaction

type:
WHATSAPP_SENT

campaign:
Reativação Ex-Assinantes

journey:
Reativação 5 dias

step:
WhatsApp D1

provider:
Evolution API

status:
SUCCESS

timestamp:
2026-07-29 14:00
```

Bloqueio também deve ser registrado:

```text
type:
AUTOMATION_SUPPRESSED

reason:
HUMAN_ATTENDANCE_ACTIVE
```

O sistema deve permitir responder:

> “Por que esta mensagem foi enviada?”

e:

> “Por que esta mensagem NÃO foi enviada?”

---

# 15. Eventos de domínio

Considerar eventos como:

```text
LEAD_CREATED
LEAD_IMPORTED
LEAD_ENRICHED
CAMPAIGN_STARTED
JOURNEY_STARTED
STEP_EXECUTED
WHATSAPP_SENT
EMAIL_SENT
CALL_ATTEMPTED
MESSAGE_RECEIVED
HUMAN_ATTENDANCE_STARTED
HUMAN_ATTENDANCE_ENDED
LEAD_CONVERTED
LEAD_LOST
LEAD_REACTIVATED
CAMPAIGN_SUPPRESSED
JOURNEY_PAUSED
JOURNEY_RESUMED
```

Isso alimenta scheduler, histórico, auditoria e posteriormente IA.

---

# 16. Funil ≠ Jornada

Esta distinção deve permanecer explícita.

## Funil

Representa:

> **estado comercial**

```text
Novo Cadastro
Contato Inicial
Em Negociação
Ganho
Perdido
```

## Jornada

Representa:

> **processo automatizado**

```text
WhatsApp D1
→ Email D2
→ WhatsApp D3
→ condição
```

Um lead pode estar:

```text
Funil:
Contato Inicial

Journey:
Reativação Ex-assinantes — Step 2
```

---

# 17. Integrações

O domínio deve trabalhar com ações abstratas:

```text
WHATSAPP
EMAIL
CALL
```

Depois:

```text
WHATSAPP
    ↓
Evolution API / provider

EMAIL
    ↓
SMTP connector

CALL
    ↓
VoIP / telefone
```

O Journey Engine não deve ficar acoplado à implementação específica do provider.

---

# 18. Ordem de implementação

## Fase 1 — Diagnóstico do domínio

Antes de codificar:

- inspecionar schema Prisma
- localizar Lead/User/Customer
- Campaign
- Funnel/Pipeline
- Journey/Flow
- Interaction
- Alert
- Scheduler/Job
- Attendance

Também localizar:

- APIs
- services
- workers
- componentes das três telas
- regras existentes de mudança de estágio

Produzir:

```text
CURRENT:
...

TARGET:
...

GAP:
...

PROPOSED MIGRATION:
...
```

Não criar modelos paralelos sem necessidade.

---

## Fase 2 — Identity Resolution

Implementar/validar:

- normalização de email
- normalização de telefone
- matching
- importação
- enrichment
- prevenção de duplicação
- auditoria

---

## Fase 3 — Campanhas

Fluxo:

```text
Público
→ campanha
→ jornada
→ ativar
```

---

## Fase 4 — Journey Engine

Fluxo mínimo:

```text
entrada
→ step
→ delay
→ action
→ condition
→ next step
```

---

## Fase 5 — Suppression Engine

Testar:

```text
campaign
+
journey
+
human attendance
+
conflicting campaign
```

antes de liberar automações externas.

---

## Fase 6 — Scheduler robusto

Adicionar:

- BullMQ/Redis
- retry
- idempotência
- revalidação
- locks quando necessários
- logs
- observabilidade
- auditoria

---

## Fase 7 — Providers

Somente depois:

```text
WhatsApp
Email
Call
```

---

## Fase 8 — IA

IA é etapa posterior.

Primeiro:

```text
IDENTITY
+
CAMPAIGN
+
JOURNEY
+
FUNNEL
+
ATTENDANCE
+
SUPPRESSION
+
SCHEDULER
+
EVENTS
```

Depois:

```text
AI ASSISTANT
```

A IA poderá posteriormente:

- conversar com leads
- responder dúvidas
- interpretar respostas
- classificar intenção
- sugerir ações
- resumir histórico
- auxiliar vendedores
- recomendar próxima ação

Mas não deve compensar um domínio mal definido.

---

# 19. Testes obrigatórios

## A — Lead novo

```text
Importar Guilherme
→ não existe
→ criar
→ registrar origem
```

## B — Lead existente

```text
Importar Guilherme
→ match por telefone
→ NÃO criar
→ enriquecer
```

## C — Campanha

```text
Campanha Ex-assinantes
→ selecionar público
→ selecionar jornada
→ ativar
```

## D — Jornada

```text
D1 WhatsApp
→ D2 Email
→ D3 WhatsApp
```

## E — Conversão

```text
Lead recebe D1
→ assina
→ interrompe próximos passos de aquisição
→ Ganho
→ Pós-venda
→ onboarding
```

## F — Não conversão

```text
Lead completa jornada
→ não assinou
→ transição definida
→ Comercial ou Nutrição
```

## G — Atendimento humano

```text
Lead está em jornada
→ vendedor assume
→ tarefa automática vence
→ scheduler revalida
→ SUPPRESS
→ motivo registrado
```

## H — Retry

```text
job executado
→ worker cai
→ retry
→ execução reconhecida
→ NÃO enviar novamente
```

## I — Campanhas concorrentes

```text
Lead elegível para A
+
Lead elegível para B

→ verificar prioridade/conflito
→ executar apenas o autorizado
```

---

# 20. Regras de segurança de produto

O Antigravity NÃO deve:

1. Criar entidades duplicadas sem verificar identidade.
2. Criar nova abstração quando já existe uma equivalente.
3. Misturar Funil com Jornada.
4. Misturar Campanha com provider.
5. Enviar automação sem revalidar o contexto atual.
6. Ignorar atendimento humano ativo.
7. Criar retry sem idempotência.
8. Apagar histórico ao mudar de campanha.
9. Sobrescrever dados importados sem preservar origem.
10. Introduzir IA onde uma regra determinística é necessária.
11. Implementar integração antes de definir o fluxo de estado.
12. Fazer mudança estrutural sem documentar o motivo.

---

# 21. Arquitetura conceitual

```text
                         ┌─────────────────┐
                         │      LEAD       │
                         │  Identity Core  │
                         └────────┬────────┘
                                  │
               ┌──────────────────┼──────────────────┐
               │                  │                  │
               ↓                  ↓                  ↓
          CAMPAIGN            FUNNEL             HISTORY
               │                  │                  │
               ↓                  ↓                  │
           AUDIENCE           SALES STATE            │
               │                                     │
               ↓                                     │
           JOURNEY                                   │
               │                                     │
               ↓                                     │
         JOURNEY STEPS                                │
               │                                     │
               ↓                                     │
          SCHEDULER                                  │
               │                                     │
       ┌───────┼────────┐                            │
       ↓       ↓        ↓                            │
   WHATSAPP  EMAIL     CALL                          │
       │       │        │                            │
       └───────┼────────┘                            │
               ↓                                     │
             EVENT ──────────────────────────────────┘
```

---

# 22. Definição de pronto

## Identidade

```text
Guilherme existente
+
Guilherme importado
=
1 pessoa
+
dados enriquecidos
+
histórico preservado
```

## Campanha

```text
Público
→ campanha
→ jornada
```

## Automação

```text
D1 WhatsApp
→ D2 Email
→ D3 WhatsApp
```

## Conversão

```text
assinou
→ interrompe aquisição
→ Ganho
→ Pós-venda
→ onboarding
```

## Conflito

```text
automação pendente
+
atendimento humano ativo
=
automação bloqueada
+
motivo registrado
```

## Segurança

```text
retry
≠
duplicação
```

## Observabilidade

Todo comportamento importante deve ser explicável pelo histórico.

---

# 23. Instrução final ao Antigravity

Antes de alterar código, faça um **diagnóstico do estado atual**.

Não assuma que os nomes usados neste documento correspondem exatamente aos nomes dos models no Prisma.

Procure primeiro.

Depois apresente:

```text
1. O que já existe e funciona
2. O que está parcialmente implementado
3. O que está conceitualmente duplicado
4. O que falta
5. Quais mudanças de schema são necessárias
6. Quais mudanças de API são necessárias
7. Quais mudanças de UI são necessárias
8. Quais riscos de migração existem
9. Qual ordem de implementação você propõe
```

Não reescreva o CRM inteiro.

Faça mudanças incrementais, preservando o que já funciona.

Após cada etapa:

```text
TypeScript
→ Prisma
→ lint
→ build
→ testes
→ validação funcional
```

Se uma mudança puder quebrar dados ou comportamento existente, pare antes da alteração destrutiva e explique a migração.

---

# 24. Regra de ouro

Antes de perguntar:

> “Como faço essa feature?”

pergunte:

> **“Qual entidade é dona dessa decisão?”**

```text
Quem é essa pessoa?
→ Identity / Lead

Quem quero atingir?
→ Campaign / Audience

O que deve acontecer?
→ Journey

Em que estágio comercial está?
→ Funnel / Attendance

Quando executar?
→ Scheduler

Por qual canal?
→ Provider

O que realmente aconteceu?
→ Event / Interaction

Por que não executou?
→ Suppression / AutomationExecution
```

Se uma feature não tiver uma resposta clara para essas perguntas, esclarecer o domínio antes de codificar.

---

# 25. Resumo

> **O DentalGO CRM não deve simplesmente enviar campanhas: ele deve manter uma identidade única do cliente, entender em qual contexto ele está, executar uma jornada apropriada, respeitar atendimento humano e conflitos, registrar cada evento e mover o cliente corretamente pelo lifecycle.**

O objetivo não é criar um sistema “inteligente” que faça coisas imprevisíveis.

O objetivo primeiro é criar um sistema **determinístico, observável, auditável e resistente a conflitos**.

A IA entra depois, em cima desse contexto estruturado.

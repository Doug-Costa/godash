# DentalGO CRM 360
## Enterprise CRM Platform
### Active CRM • Customer Data Platform • Marketing Automation • Customer Success

---

# 1. Objetivo

Este documento define a arquitetura oficial do CRM DentalGO.

Este documento é a única fonte de verdade para desenvolvimento.

Toda implementação deverá seguir rigorosamente este documento.

O objetivo do sistema NÃO é apenas controlar oportunidades comerciais.

O objetivo é acompanhar toda a jornada do cliente desde sua entrada até seu relacionamento contínuo com a empresa.

O CRM deverá funcionar como uma plataforma integrada de:

- CRM Comercial
- Customer Data Platform (CDP)
- Customer Success
- Marketing Automation
- Pós-vendas
- Nutrição
- Business Intelligence

Toda a arquitetura deverá permitir crescimento contínuo sem necessidade de refatorações estruturais.

---

# 2. Arquitetura Geral

A arquitetura será baseada em eventos.

Nenhum módulo deverá conhecer diretamente outro módulo.

Todo relacionamento ocorrerá através de Eventos de Domínio.

```

```
                         MySQL
               (DentalGO Produção)

                        │
                        │ READ ONLY
                        ▼

               Sync Engine (BullMQ)

                        │

                        ▼

                 PostgreSQL CRM

                        │

         ┌──────────────┼──────────────┐

         ▼              ▼              ▼

     Customer       Opportunity      Campaign

         ▼              ▼              ▼

        Flow ------ Automation ------ Tasks

         ▼

     Notification

         ▼

     Interaction

         ▼

      Dashboards
```

---

# 3. Dual Database

## Banco Oficial

MySQL

Responsável por:

- clientes
- pagamentos
- pedidos
- planos
- expiração
- financeiro

Jamais será alterado pelo CRM.

Acesso:

Read Only.

---

## Banco CRM

PostgreSQL

Responsável por:

- Customer
- Opportunity
- Campaign
- Flow
- Pipeline
- Stage
- Interaction
- Automation
- Task
- Dashboards

Toda escrita ocorre exclusivamente aqui.

---

# 4. Stack Oficial

# Stack Oficial do Projeto

## Objetivo

Esta seção define a stack oficial do CRM DentalGO.

A IA deverá utilizar exclusivamente as tecnologias descritas abaixo.

Não substituir bibliotecas existentes sem autorização explícita.

Sempre reutilizar a stack já adotada pelo projeto.

---

# 1. Frontend & Core

Framework

- Next.js 16.2.1

Interface

- React 19

Linguagem

- TypeScript 5

Estilização

- TailwindCSS v4

Objetivo

Toda interface deverá ser construída utilizando os componentes e padrões já existentes do projeto.

Evitar criação de componentes paralelos.

Sempre reutilizar componentes compartilhados.

---

# 2. Banco de Dados

## PostgreSQL

Banco oficial do CRM.

Responsável por:

- Customer
- Opportunity
- Campaign
- Flow
- Pipeline
- Stage
- Automation
- Interaction
- Task
- Dashboard
- BI

ORM

Prisma 6

O PostgreSQL será considerado a fonte oficial de relacionamento do sistema.

---

## MySQL

Banco legado.

Responsável exclusivamente por informações transacionais do DentalGO.

Exemplos

Clientes

Pedidos

Pagamentos

Planos

Expirações

Compras

Renovações

O sistema CRM nunca deverá escrever neste banco.

Apenas leitura.

Utilizar mysql2.

---

# 3. ORM

Prisma

Versão

6.19.x

Responsabilidades

Modelagem

Migrations

Relacionamentos

Queries

Transactions

Nunca utilizar SQL bruto quando o Prisma suportar a operação.

SQL direto apenas para consultas analíticas específicas.

---

# 4. Autenticação

NextAuth v5

Adapter

Prisma Adapter

Criptografia

bcryptjs

Modelo

RBAC

Perfis

Administrador

Supervisor Comercial

Operador

Toda autorização deverá ocorrer no Backend.

Jamais confiar apenas na interface.

---

# 5. Processamento Assíncrono

BullMQ

Redis

Objetivo

Toda tarefa pesada deverá ser processada em background.

Exemplos

Sincronização

Campanhas

Envio de Emails

Envio de WhatsApp

Criação de Tasks

Importações

Dashboards

Health Score

Nunca executar estes processos diretamente na API.

---

Workers oficiais

Sync Worker

Campaign Worker

Automation Worker

Notification Worker

Analytics Worker

Scheduler Worker

Cada Worker deverá possuir responsabilidade única.

---

# 6. Redis

Versão

Redis 7

Cliente

ioredis

Responsabilidades

BullMQ

Cache

Locks

Controle de concorrência

Rate Limiter

Jamais utilizar Redis como banco permanente.

---

# 7. Visualização

Biblioteca

Recharts

Objetivo

Dashboards

KPIs

BI

ROI

LTV

Conversão

Health Score

Toda agregação deverá ocorrer no PostgreSQL.

O Frontend apenas renderiza.

---

# 8. Flow Builder

Biblioteca

@xyflow/react

Objetivo

Editor visual de Flows.

Editor de Automações.

Visualização de Jornadas.

A biblioteca não deverá conter regras de negócio.

Ela apenas representa visualmente os dados.

Toda lógica permanece no Backend.

---

# 9. Automação

Puppeteer

Objetivo

Automações Web

Captura de Dados

Integrações sem API

Importações

Nunca utilizar Puppeteer para tarefas que possuam API oficial.

Priorizar sempre integrações nativas.

---

# 10. Integrações

Email

Mailer Provider

WhatsApp

Evolution

Meta Cloud API

ZAPI

Todos deverão implementar NotificationProvider.

Jamais chamar APIs externas diretamente pelos Controllers.

---

# 11. Infraestrutura

Docker

Docker Compose

Rede isolada

Containers oficiais

NextJS

PostgreSQL

Redis

Nginx

Workers

Todos os serviços deverão ser executáveis através do docker-compose.

Não utilizar dependências externas para funcionamento básico do sistema.

---

# 12. Proxy

Nginx

Responsabilidades

Reverse Proxy

SSL

Compressão

Cache de Assets

Headers

Rate Limit (quando necessário)

---

# 13. Arquitetura Oficial

A arquitetura seguirá obrigatoriamente os princípios abaixo.

Frontend

↓

API

↓

Application Services

↓

Domain Services

↓

Repositories

↓

Prisma

↓

PostgreSQL

---

Processos Assíncronos

↓

BullMQ

↓

Workers

↓

Notification Service

↓

Providers

↓

Integrações

---

# ATTENTION

A IA deverá respeitar rigorosamente a responsabilidade de cada camada.

Frontend apenas apresenta informações.

Controllers apenas recebem requisições.

Application Services coordenam casos de uso.

Domain Services concentram regras de negócio.

Repositories acessam os dados.

Workers executam tarefas assíncronas.

Providers comunicam serviços externos.

Nunca inverter essas responsabilidades.

Toda nova funcionalidade deverá seguir esta arquitetura.

---

# 5. Filosofia do Sistema

O Cliente é permanente.

As Oportunidades são temporárias.

As Campanhas são temporárias.

Os Fluxos são reutilizáveis.

As Automações são reutilizáveis.

O Histórico nunca pode ser perdido.

---

# 6. Modelo de Domínio

## Customer

Representa a pessoa.

Nunca será excluído.

Exemplos

Dr João

Dr Carlos

Dra Maria

Possui:

- dados pessoais
- especialidade
- redes sociais
- histórico
- compras
- LTV
- metadata

Um Customer pode possuir inúmeras Opportunities.

---

## Opportunity

Representa uma oportunidade comercial.

Ela nasce.

Ela evolui.

Ela termina.

Exemplos

Carrinho abandonado

Congresso

Indicação

Livro

Renovação

Uma mesma pessoa pode possuir dezenas de Opportunities durante sua vida.

---

## Campaign

Representa uma campanha.

Exemplos

Congresso Chile

Black Friday

Renovação Julho

Carrinho Abandonado

Ela define:

- público
- origem
- objetivo
- métricas

Ela NÃO define mensagens.

---

## Flow

Representa uma jornada reutilizável.

Exemplos

Onboarding Premium

Nutrição Preço

Recuperação

Pós-venda

Cross Sell

Upsell

Um mesmo Flow pode ser utilizado por diversas campanhas.

---

## Pipeline

Representa um processo.

Exemplos

Comercial

Customer Success

Nutrição

Financeiro

---

## Stage

Representa um estágio dentro do Pipeline.

Pipeline Comercial

Novo

Contato

Negociação

Proposta

Ganho

Perdido

Pipeline Customer Success

Onboarding

Primeiro Acesso

30 Dias

90 Dias

Upsell

---

## Automation

Representa uma ação automática.

Exemplos

Enviar WhatsApp

Enviar Email

Criar Task

Mover Stage

Esperar

Executar Webhook

Criar Nota

Atualizar Campo

Uma Automation pertence a um Flow.

---

## Task

Representa uma atividade.

Ela aparece no Alert Center.

Pode ser criada:

automaticamente

ou

manualmente.

---

## Interaction

Representa o histórico permanente.

Nunca será apagado.

Tudo gera Interaction.

Exemplos

Ligação

Nota

Mensagem enviada

Mensagem lida

Email

Mudança de estágio

Mudança de pipeline

Compra

Renovação

Cancelamento

---

# 7. Eventos do Sistema

Todo o sistema será orientado a eventos.

Eventos padrão

CustomerCreated

OpportunityCreated

OpportunityWon

OpportunityLost

CustomerRenewed

CustomerCancelled

TaskCompleted

AutomationExecuted

EmailSent

WhatsAppSent

EmailRead

WhatsAppRead

CampaignStarted

CampaignFinished

FlowStarted

FlowFinished

Nenhum módulo deve chamar diretamente outro módulo.

Todos escutam Eventos.

---

# 8. Customer 360

A ficha do cliente será o centro do sistema.

Abas

Resumo

Timeline

Oportunidades

Compras

Financeiro

Campanhas

Interações

Notas

Alertas

Arquivos

IA

Metadata

```
Customer

↓

Resumo Geral

↓

Timeline

↓

Compras

↓

Campanhas

↓

Oportunidades

↓

Interações

↓

Notas

↓

Arquivos

↓

IA
```

A Timeline deve ser permanente.

Jamais apagar histórico.

Sempre adicionar novos eventos.

---

# 9. Metadata

Campos experimentais ficarão em JSONB.

Exemplos

Instagram

Facebook

Linkedin

Website

Especialidade Secundária

Observações

Tags

Jamais utilizar JSON para informações críticas como:

Nome

Telefone

Cidade

Plano

Status

Essas informações deverão possuir colunas próprias.

---

# 10. Health Score

Todo Customer possuirá um Health Score.

Valor

0 até 100.

Calculado automaticamente.

Critérios

Login

Renovação

Compras

Tempo sem contato

Emails abertos

WhatsApp respondido

Tempo de uso

Chamados

Cancelamentos

O Health Score será utilizado para:

Priorização

Campanhas

Alertas

IA

Dashboards

---

Fim da Parte 1

# 11. Campaign Engine

## Objetivo

Campaign representa uma ação comercial ou de marketing.

Uma Campaign nunca define diretamente as mensagens.

Ela apenas define:

- Público
- Objetivo
- Segmentação
- Pipeline de entrada
- Flow utilizado
- Indicadores
- Datas
- Status

Exemplos

Black Friday

Congresso Chile

Carrinho Abandonado

Reativação Julho

Renovação Agosto

Uma Campaign poderá utilizar qualquer Flow existente.

---

## Estrutura

Campaign

↓

Segmentação

↓

Objetivo

↓

Pipeline Inicial

↓

Flow

↓

Métricas

↓

Resultados

---

## Objetivos possíveis

SALE

RENEW

UPSELL

CROSS_SELL

ONBOARDING

NURTURING

RECOVERY

EVENT

BOOK

CUSTOM

Esses objetivos serão utilizados pelos Dashboards.

Jamais utilizar Strings livres.

Sempre Enum.

---

# 12. Flow Engine

Flow representa uma jornada reutilizável.

Exemplos

Onboarding Premium

Onboarding Standard

Nutrição Preço

Nutrição Conteúdo

Nutrição Casos Clínicos

Recuperação Premium

Recuperação Cupom

Cross Sell

Upsell

Flow nunca conhece Customer.

Flow apenas descreve ações.

---

Estrutura

Flow

↓

Automation 1

↓

Automation 2

↓

Automation 3

↓

Automation N

---

Flow possui Versionamento.

Exemplo

Onboarding Premium

v1

v2

v3

Clientes antigos permanecem na versão original.

Novos clientes utilizam sempre a última versão.

Nunca alterar um Flow em execução.

Sempre criar nova versão.

---

# 13. Automation Engine

Automation representa uma ação.

Nunca apenas mensagens.

Tipos possíveis

WAIT

EMAIL

WHATSAPP

CREATE_TASK

MOVE_STAGE

MOVE_PIPELINE

CREATE_NOTE

CREATE_INTERACTION

WEBHOOK

UPDATE_FIELD

FINISH_FLOW

START_FLOW

---

Toda Automation possui

Ordem

Delay

Condição

Canal

Provider

Template

Retry

Timeout

Status

---

Exemplo

Dia 0

↓

Enviar WhatsApp

↓

Esperar 3 dias

↓

Enviar Email

↓

Criar Task

↓

Mover Stage

↓

Finalizar Flow

---

# 14. Triggers

Toda Automation inicia através de um Trigger.

Triggers disponíveis

CUSTOMER_CREATED

OPPORTUNITY_CREATED

OPPORTUNITY_WON

OPPORTUNITY_LOST

CAMPAIGN_STARTED

FLOW_STARTED

PAYMENT_CONFIRMED

PLAN_EXPIRED

BOOK_PURCHASED

MANUAL

API

WEBHOOK

SCHEDULE

---

# 15. Conditions

Automation poderá possuir condições.

Exemplos

Plano Premium

Cidade

Especialidade

Health Score

Tempo sem Login

Última Compra

Última Renovação

Tags

Metadata

Caso a condição não seja satisfeita

Pular etapa

Executar etapa alternativa

Encerrar Flow

---

# 16. Wizard de Campanhas

O operador NÃO participa desta tela.

Tela exclusiva do Administrador.

Fluxo

PASSO 1

Marketing

↓

PASSO 2

Comercial

↓

PASSO 3

Pós-venda

↓

PASSO 4

Resumo

---

PASSO 1

Segmentação

Selecionar Público

Filtros

Especialidade

Plano

Compradores

Expirados

Carrinho

Tags

Cidade

Estado

Período

Health Score

Ao alterar qualquer filtro

Executar consulta

Mostrar

Público estimado

Tempo estimado

Receita estimada

---

PASSO 2

Pipeline

Selecionar Pipeline

Selecionar Stage Inicial

Selecionar Operadores

Distribuição

Round Robin

Balanceado

Manual

Quantidade máxima

Limite diário

Horário comercial

---

PASSO 3

Flow

Selecionar Flow Comercial

Selecionar Flow Pós-venda

Selecionar Flow Nutrição

Selecionar Flow Recuperação

Selecionar versão

Selecionar Canal

WhatsApp

Email

Ambos

---

PASSO 4

Resumo

Mostrar

Quantidade

Operadores

Tempo

Mensagens

Custo estimado

ROI esperado

Receita prevista

Botão

Ativar Campaign

---

# 17. Customer Success

Quando uma Opportunity for WON

Executar

Finalizar Opportunity Comercial

↓

Criar Opportunity Customer Success

↓

Selecionar Flow configurado

↓

Agendar Automations

↓

Criar primeira Task

↓

Criar primeira Interaction

Tudo automaticamente.

---

# 18. Nutrição

Quando uma Opportunity for LOST

Administrador define

Motivo

↓

Preço

Sem Tempo

Sem Interesse

Sem Funcionalidade

Sem Resposta

Outro

Cada motivo aponta para um Flow diferente.

Exemplo

Preço

↓

Flow Nutrição Preço

Sem Tempo

↓

Flow Conteúdo

Sem Funcionalidade

↓

Flow Atualizações

---

O administrador poderá alterar posteriormente.

Mover Customer

↓

Flow A

↓

Flow B

Sem perder histórico.

---

# 19. Acompanhamento

Nova tela

Administração

↓

Campanhas

↓

Selecionar Campaign

Mostrar

Resumo

Timeline

Conversão

Pipeline

Flow

Operadores

Receita

---

Indicadores

Leads

Iniciaram

Em andamento

Responderam

Ganhos

Perdidos

Nutrição

Pós-venda

Receita

ROI

LTV

---

Visualização por etapa

Automation

↓

Executada

↓

Sucesso

↓

Falha

↓

Taxa

↓

Tempo Médio

---

Mapa de Conversão

Entrada

↓

Marketing

↓

Comercial

↓

Pós-venda

↓

Renovação

↓

Upgrade

---

# 20. Testes A/B

A/B ocorre no Flow.

Nunca na Campaign.

Flow

Onboarding Premium

↓

Versão A

↓

Versão B

Distribuição

50%

50%

Ou

70%

30%

Dashboards

Conversão

Receita

Tempo Médio

Retenção

Administrador poderá promover

Versão B

↓

Versão Oficial

Sem alterar campanhas antigas.

---

# 21. Dashboard Administrativo

Operador não acessa.

Dashboard exclusivo para Administradores.

Widgets

Campanhas Ativas

Receita Recuperada

Health Médio

Clientes em Risco

Campanhas

Flows

Automations

Operadores

Pipeline

Win Rate

ROI

LTV

---

Cada Campaign possuirá Dashboard próprio.

Resumo

Conversão

ROI

Receita

Leads

Ganhos

Perdidos

Customer Success

Nutrição

Comparativo

Flow A

vs

Flow B

---

# 22. UX do Operador

NÃO ALTERAR.

Esta arquitetura NÃO modifica o fluxo operacional.

Operador continuará utilizando

Kanban

Ficha Comercial

Alert Center

Notas

Mover Card

Perda

Ganho

Agenda

Todo processamento ocorrerá em Background.

Operador não precisa conhecer

Flow

Automation

Campaign

BullMQ

Providers

Versionamento

Toda inteligência pertence ao Administrador.


# 23. Arquitetura de Integrações

Toda comunicação externa deverá ser abstraída.

Nenhum módulo do sistema poderá conhecer diretamente:

- Evolution API
- Z-API
- Meta Cloud API
- Mailer
- SMTP
- SendGrid
- Amazon SES

Toda comunicação será realizada através da camada Notification Provider.

---

Arquitetura

Customer

↓

Automation

↓

NotificationService

↓

NotificationProvider

↓

Evolution

ZAPI

Meta

Mailer

SMTP

↓

Interaction

↓

Dashboard

---

Objetivo

Permitir alterar qualquer provedor sem alterar regras de negócio.

Todo Provider deve implementar exatamente a mesma interface.

---

# 24. Notification Provider

Criar interface

NotificationProvider

Métodos obrigatórios

sendMessage()

sendTemplate()

validateConnection()

healthCheck()

parseWebhook()

Cada Provider deverá implementar esta interface.

---

Providers Oficiais

MailerProvider

EvolutionProvider

MetaProvider

ZapiProvider

InternalSMTPProvider

Todos independentes.

Jamais utilizar switch gigantes.

Utilizar Strategy Pattern.

---

Exemplo

NotificationService

↓

resolveProvider()

↓

provider.send()

↓

Interaction

---

# 25. Integração MAILER

Existe um módulo chamado

MAILER

Já implementado.

A IA deverá analisar integralmente este módulo.

Objetivos

Entender

Arquitetura

Fila

Templates

Envio

Logs

Tratamento de erros

Após compreender o módulo

Criar

MailerProvider

Jamais duplicar lógica existente.

Toda campanha de Email deverá utilizar obrigatoriamente este módulo.

Após integração concluída

Remover a pasta temporária utilizada para análise.

---

Envio rápido

A Ficha Comercial possui botão

Enviar Email

Este botão deverá utilizar exatamente o mesmo MailerProvider.

Não criar outro fluxo.

Toda comunicação por Email deverá passar pelo Mailer.

---

# 26. WhatsApp Providers

O sistema deverá suportar múltiplos provedores.

Providers oficiais

Evolution

Meta Cloud API

Z-API

Arquitetura

NotificationService

↓

Provider

↓

API

O restante do sistema nunca saberá qual Provider está sendo utilizado.

---

# 27. Administração de Conectores

Criar nova área

Administração

↓

Integrações

Cards

Email

WhatsApp

Webhooks

Health

Logs

---

EMAIL

Provider

Mailer

Status

Online

Offline

Botão

Testar envio

Configurações

Endpoint

Token

Remetente

Timeout

Retries

---

WHATSAPP

Selecionar Provider

○ Evolution

○ Meta Cloud

○ Z-API

Campos

URL

Token

Instance

Número

Webhook

Timeout

Retries

Botão

Testar conexão

Botão

Enviar mensagem teste

Mostrar

Último teste

Status

Tempo resposta

---

WEBHOOKS

Cadastrar

Nome

URL

Token

Evento

Retry

Ativo

Logs

---

# 28. Seleção de Canal

No Wizard de Campaign

Adicionar

Canal

WhatsApp

Email

Ambos

Caso WhatsApp

Selecionar Provider

Evolution

Meta

ZAPI

Caso Email

Provider

Mailer

Esta configuração pertence à Campaign.

Não ao Customer.

---

# 29. BullMQ

Todo processamento será assíncrono.

Nenhum envio será realizado diretamente pela API.

Fluxo

Automation

↓

BullMQ

↓

NotificationService

↓

Provider

↓

Interaction

↓

Dashboard

---

Workers

Notification Worker

Automation Worker

Campaign Worker

Sync Worker

Analytics Worker

Todos independentes.

---

Retries

Configurar

Tentativas

Backoff

Timeout

Dead Letter Queue

Logs

---

# 30. Scheduler

Criar Scheduler Oficial.

Executar

Campaigns

Flows

Health Score

Dashboards

Sincronização

Limpeza

Reindexação

Horários configuráveis.

Nunca utilizar Cron espalhado pelo projeto.

Centralizar.

---

# 31. Interaction

Toda comunicação gera Interaction.

Exemplos

EMAIL_SENT

EMAIL_READ

EMAIL_FAILED

WHATS_SENT

WHATS_DELIVERED

WHATS_READ

CALL

NOTE

SYSTEM

TASK_CREATED

TASK_COMPLETED

PIPELINE_CHANGED

STAGE_CHANGED

FLOW_STARTED

FLOW_FINISHED

CAMPAIGN_STARTED

CAMPAIGN_FINISHED

---

Interaction jamais será apagada.

Ela representa o histórico permanente.

---

# 32. Webhooks

Todo Provider deverá possuir endpoint de Webhook.

Responsabilidades

Atualizar Delivery

Atualizar Read

Atualizar Failure

Criar Interaction

Atualizar Dashboard

Criar Alertas

Exemplo

Meta

↓

Webhook

↓

NotificationService

↓

Interaction

↓

Dashboard

---

# 33. Dashboards

Dashboards nunca calcularão grandes volumes no Frontend.

Toda agregação deverá ocorrer no PostgreSQL.

Criar consultas otimizadas.

Exemplos

Win Rate

ROI

LTV

Receita

Conversão

Health Médio

Tempo Médio

Delivery

Read Rate

Response Rate

Todas as APIs deverão retornar dados prontos.

---

# 34. Segurança

Todo acesso deverá utilizar RBAC.

Perfis

Administrador

Supervisor Comercial

Operador

Administrador

Tudo

Supervisor

Campanhas

Flows

Dashboard

Operadores

Leads

Operador

Kanban

Alert Center

Customer

Agenda

Jamais permitir acesso direto ao PostgreSQL pelo Frontend.

---

# 35. Roadmap Oficial

ÉPICO 1

Infraestrutura

PostgreSQL

Redis

Prisma

Migração SQLite

---

ÉPICO 2

Modelo de Domínio

Customer

Opportunity

Campaign

Flow

Automation

Task

Interaction

Pipeline

Stage

---

ÉPICO 3

Motor de Eventos

Events

NotificationService

BullMQ

Scheduler

Workers

---

ÉPICO 4

Sincronização

MySQL

↓

Customer

↓

Opportunity

↓

Campaign

---

ÉPICO 5

CRM Operacional

Kanban

Alert Center

Ficha Comercial

Timeline

Customer 360

---

ÉPICO 6

Campanhas

Campaign Wizard

Segmentação

Distribuição

Flows

Versionamento

---

ÉPICO 7

Automações

Automation Builder

Delay

Conditions

Triggers

Tasks

---

ÉPICO 8

Integrações

Mailer

Evolution

Meta

ZAPI

Webhooks

---

ÉPICO 9

Customer Success

Pipeline CS

Pós-venda

Health Score

Onboarding

---

ÉPICO 10

Nutrição

Fluxos

Motivos

Recuperação

Campanhas

A/B Test

---

ÉPICO 11

Dashboards

BI

ROI

LTV

Win Rate

Conversão

Health

Comparativos

---

# 36. Diretrizes para a Antigravity

Toda implementação deverá seguir rigorosamente este documento.

Não criar arquitetura paralela.

Não duplicar Providers.

Não criar envio direto.

Não utilizar Switch para Providers.

Utilizar Interfaces.

Utilizar Dependency Injection.

Utilizar Event Driven.

Utilizar BullMQ para toda operação assíncrona.

Jamais alterar o fluxo operacional do usuário.

Toda complexidade pertence ao Administrador.

Toda lógica deverá ser reutilizável.

Todo histórico deverá ser permanente.

Toda integração deverá ser desacoplada.

O sistema deverá ser preparado para suportar novos canais de comunicação sem necessidade de alteração das regras de negócio.

Este documento é considerado a arquitetura oficial do CRM DentalGO.

# ATTENTION - FEATURE: TEMPLATE ENGINE

⚠️ IMPORTANTE

A entidade Automation NÃO deverá armazenar diretamente o conteúdo das mensagens.

Automation representa apenas uma ação.

O conteúdo deverá ser abstraído através de uma nova entidade chamada Template.

---

# Objetivo

Permitir reutilização de mensagens.

Permitir versionamento.

Permitir edição pelo Marketing sem alterar Flows.

Permitir testes A/B.

Permitir múltiplos idiomas.

Permitir múltiplos canais.

Evitar duplicação.

---

# Arquitetura

Campaign

↓

Flow

↓

Automation

↓

Template

↓

Notification Provider

↓

Canal

↓

Cliente

---

# Nova Entidade

Template

Representa um conteúdo reutilizável.

Exemplos

Boas-vindas Premium

Recuperação Preço

Carrinho Abandonado

Renovação

Cupom

Pesquisa de Satisfação

Pós-venda

Cross Sell

Upsell

---

# Estrutura

Template

id

name

description

type

version

status

language

subject

content

variables

createdAt

updatedAt

---

type

EMAIL

WHATSAPP

SMS

PUSH

CUSTOM

---

status

DRAFT

ACTIVE

ARCHIVED

---

language

PT

EN

ES

---

variables

JSONB

Exemplo

{

"nome",

"cidade",

"curso",

"plano",

"expiracao",

"consultor"

}

---

# Automation

Automation passa a possuir

templateId

Template

channel

delay

conditions

trigger

provider

retry

timeout

Jamais armazenar conteúdo textual.

---

# Versionamento

Templates deverão possuir Versionamento.

Exemplo

Boas Vindas

v1

v2

v3

Campaigns antigas permanecem utilizando a versão original.

Novas Campaigns utilizam a versão mais recente.

Nunca sobrescrever versões em produção.

Sempre criar nova versão.

---

# Editor Administrativo

Criar nova área

Administração

↓

Templates

Funcionalidades

Criar

Editar

Duplicar

Arquivar

Versionar

Pesquisar

Categorias

Preview

Teste

---

Filtros

Tipo

Idioma

Categoria

Status

Versão

---

Editor

Nome

Descrição

Idioma

Tipo

Assunto

Conteúdo

Variáveis disponíveis

Preview

Botão

Enviar Teste

---

# Variáveis

Sistema deverá substituir automaticamente.

Exemplo

{{customer.name}}

{{customer.city}}

{{customer.specialty}}

{{customer.phone}}

{{customer.email}}

{{customer.plan}}

{{customer.expiration}}

{{operator.name}}

{{campaign.name}}

{{company.name}}

No futuro permitir criação de novas variáveis.

---

# Integração MAILER

Todos os Templates EMAIL deverão utilizar obrigatoriamente o MailerProvider.

Jamais implementar novo mecanismo de envio.

O Mailer será o responsável por:

Renderização

Substituição de Variáveis

Envio

Logs

Histórico

Tratamento de erros

Fila

A IA deverá analisar o módulo MAILER existente antes da implementação.

Caso exista funcionalidade equivalente, reutilizar.

Nunca duplicar código.

---

# Integração WhatsApp

Templates WhatsApp deverão suportar

Evolution

Meta Cloud API

ZAPI

Caso o Provider utilize Template Oficial (Meta)

armazenar o Template ID.

Caso utilize texto livre (Evolution)

armazenar o conteúdo.

A interface deverá ocultar automaticamente os campos incompatíveis conforme o Provider escolhido.

---

# A/B Templates

O sistema deverá permitir Testes A/B.

Exemplo

Flow

↓

Automation

↓

Template A

50%

Template B

50%

Dashboard

Entrega

Leitura

Resposta

Conversão

Receita

Administrador poderá promover o melhor Template para produção.

---

# Histórico

Toda utilização de Template deverá gerar Interaction.

Registrar

Template utilizado

Versão

Provider

Canal

Resultado

Tempo

Erro

Jamais perder rastreabilidade.

---

# IA

No futuro os Templates poderão possuir suporte à IA.

Exemplos

Gerar assunto automaticamente.

Reescrever mensagem.

Criar versão resumida.

Traduzir.

Adequar tom.

Personalizar conteúdo conforme Customer.

Esta funcionalidade deverá ser preparada desde a modelagem inicial.

---

# DIRETRIZ OBRIGATÓRIA

Template representa conteúdo.

Automation representa lógica.

Flow representa jornada.

Campaign representa estratégia.

Customer representa relacionamento.

Jamais misturar essas responsabilidades.

### ATTENTION

Antes de criar qualquer nova entidade ou serviço de envio de mensagens, a IA deve verificar se a responsabilidade pertence ao Template Engine ou ao Notification Provider.

Se a alteração envolver conteúdo da mensagem, utilizar Template.

Se envolver regras de negócio, utilizar Automation.

Se envolver envio, utilizar Notification Provider.

Se envolver estratégia comercial, utilizar Campaign.

Se envolver jornada do cliente, utilizar Flow.

Não misturar responsabilidades.
# ROADMAP DE EXECUÇÃO: DENTALGO CRM 360 
**Fase 3: Active CRM, CDP e Automação Orientada a Eventos**

## 1. VISÃO GERAL E DIRETRIZES PARA A IA (ANTIGRAVITY)
**Atenção, IA:** Você atuará como Engenheiro de Software Sênior. Este documento dita as regras absolutas de arquitetura para a refatoração do CRM DentalGO. Nenhuma linha de código deve quebrar as diretrizes abaixo.

### 1.1. Fluxo de Deploy e Ambiente (Strict Constraints)
*   **Ambiente Alvo:** VPS Ubuntu/Debian executando Docker Compose.
*   **Workflow:** A compilação é local. O código vai para o repositório `/GODASH` (Git). No VPS, roda-se o script de bash `deploy.sh` (pull + docker compose build).
*   **Consequência Arquitetural:** Não utilize features exclusivas de Vercel Edge. Todo o processamento de background deve ser executável dentro do ecossistema Node/Docker tradicional.

### 1.2. A Regra do Dual-DB (Isolamento Absoluto)
O sistema opera com duas "Verdades" separadas:
1.  **A Verdade Financeira (MySQL - `dentalgo_production`):** Conectado via `mysql2/promise` (Read-Only). O CRM **NUNCA** escreve neste banco. 
2.  **A Verdade do Relacionamento (PostgreSQL - CRM Interno):** Conectado via `Prisma ORM`. É aqui que as entidades de CRM (Customers, Journeys, Pipelines) habitam. O PostgreSQL será adicionado ao `docker-compose.yml`.

---

## 2. ÉPICOS DE DESENVOLVIMENTO E INSTRUÇÕES DE EXECUÇÃO

O projeto deve ser executado sequencialmente através dos Épicos abaixo. **IA: Execute apenas o Épico solicitado pelo desenvolvedor no prompt atual.**

### ÉPICO 1: Fundação de Dados (PostgreSQL + Prisma)
**Objetivo:** Substituir o SQLite por PostgreSQL no Docker e modelar as 6 Entidades de Ouro (CDP).
*   **Ação 1:** Atualizar o `docker-compose.yml` adicionando os serviços `crm-postgres` (PostgreSQL 15+) e `crm-redis` (Redis 7-alpine, para o BullMQ).
*   **Ação 2:** Gerar o `prisma/schema.prisma` com `provider = "postgresql"`.
*   **Parâmetros Estritos de Entidade (Prisma):**
    *   `Customer`: Deve conter `id`, `externalPersonId` (Int, único, link com MySQL), `metadata` (JSONB para Instagram, especialidade, etc).
    *   `Journey`: Campanhas/Fluxos com `objective` (String) e meta financeira.
    *   `Pipeline`: Funis flexíveis (Vendas, CS, Nutrição).
    *   `Interaction`: Histórico imutável de log amarrado ao `Customer`.
    *   `Task`: O "Alert Center". Vinculado a `Customer`, `User` (agente) e data/hora (`scheduledFor`).
    *   `Automation`: Regras lógicas que geram `Tasks` automáticas baseadas em eventos.

### ÉPICO 2: Motor de Sincronização e IAM (Sync Engine)
**Objetivo:** Alimentar o PostgreSQL puxando dados do MySQL (Carrinhos abandonados e Expirações) e configurar papéis (RBAC).
*   **Ação 1:** Implementar o BullMQ (`src/lib/queue`). Criar um Worker (`SyncWorker`) rodando em background (`start.sh`).
*   **Ação 2:** O Worker fará query no MySQL (via API existente) e rodará um `upsert` massivo no PostgreSQL alimentando a tabela `Customer`.
*   **Ação 3:** Expandir as views do NextAuth. Administradores veem métricas globais; Agentes (users comuns) consultam a API e recebem APENAS os `Customers` atrelados ao seu `userId`.

### ÉPICO 3: UI/UX — Ficha Comercial 360 e Histórico Contínuo
**Objetivo:** Melhorar o card do cliente para visualizar o perfil completo e a linha do tempo.
*   **Ação 1:** Atualizar a `Ficha de Atendimento Comercial`. Adicionar suporte de leitura/gravação ao campo `metadata` (JSONB) do `Customer` para inputs dinâmicos (Redes Sociais, Atuação).
*   **Ação 2:** Criar o componente de UI `Timeline` para consumir a entidade `Interaction`, mostrando todo o histórico do cliente (campanhas anteriores e atuais), de forma paginada e descentralizada.
*   **Ação 3:** Adicionar modais rigorosos para as saídas de funil. Ao clicar em "Perda", forçar a seleção de um motivo (`lostReason`) e injetar na tabela `Customer`.

### ÉPICO 4: Camada de Integração e Automação (WhatsApp & Email)
**Objetivo:** Transformar as "Tarefas" do Alert Center em comunicação ativa, orquestradas pelo BullMQ.
*   **Ação 1:** Criar `src/lib/services/NotificationService.ts`.
*   **Parâmetros Estritos:**
    *   Método `sendWhatsApp()`: Envia `POST` para Evolution API.
    *   Método `sendEmail()`: Envia `POST` com JSON para o serviço interno de SMTP do cliente.
*   **Ação 2:** Quando um agente clicar em "Atender Alerta", o backend dispara o serviço correspondente e grava uma `Interaction` de sucesso.

### ÉPICO 5: UI/UX — Kanbans de Pós-Venda, Nutrição e Alert Center
**Objetivo:** Permitir a gestão multi-funil unificada.
*   **Ação 1:** Adaptar a página atual do Kanban para ler a tabela `Pipeline`. Criar abas no topo: "Funil Vendas", "Funil CS (Pós-Vendas)", "Funil Nutrição".
*   **Ação 2:** Adicionar *Badges* visuais nos cards dos leads baseados na `Journey` (Campanha) a qual eles pertencem atualmente.
*   **Ação 3:** Aprimorar o `Alert Center` para que leads recém-importados do MySQL sem "dono" sejam exibidos em um quadro global de "Pegar Lead", passando para o Kanban individual do agente ao clicar.

### ÉPICO 6: BI & Dashboards de ROI (Orientado a Objetivos)
**Objetivo:** Substituir painéis transacionais por análise de LTV e conversão de Campanhas.
*   **Ação 1:** Criar a tela "Monitoramento de Jornadas (Campanhas)".
*   **Ação 2:** A API do dashboard não fará cálculos massivos no JavaScript. As queries analíticas devem aproveitar o PostgreSQL para entregar: Taxa de Resposta, Win Rate da Campanha, e Receita Recorrente Recuperada (cruzando com os status no MySQL).

---
**INSTRUÇÃO INICIAL PARA A IA:** Ao receber este documento no contexto, aguarde o desenvolvedor informar qual ÉPICO deve ser implementado. Se solicitado para iniciar, comece IMPRETERIVELMENTE pelo **ÉPICO 1**, gerando as modificações do `docker-compose.yml` e o código completo do `schema.prisma`.
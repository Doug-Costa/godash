# Plano de Desenvolvimento de Requisitos (PDR) — DentalGO CRM v2.0

Este documento estabelece o plano estratégico de desenvolvimento, a arquitetura baseada em **Domain-Driven Design (DDD)** e a estratégia de qualidade baseada em **Test-Driven Development (TDD)** para a migração do protótipo de CRM local para um sistema robusto e seguro baseado em banco de dados relacional dedicado e autenticação integrada.

---

## 1. Arquitetura de Domínio (DDD - Domain-Driven Design)

Para garantir a extensibilidade do sistema, organizamos o desenvolvimento dividindo as responsabilidades e isolando o domínio de negócios da infraestrutura de rede e armazenamento.

### Contextos Delimitados (Bounded Contexts)
```text
┌───────────────────────────────────────┐       ┌───────────────────────────────────────┐
│     Contexto Core (DentalGO)          │       │          Contexto CRM Interno         │
│     - Banco 1 (Read-Only)             │◄──────│          - Banco 2 (Read-Write)       │
│     - Dados Transacionais de Clientes  │ (IDs) │          - Estágios, Notas, IAM       │
└───────────────────────────────────────┘       └───────────────────────────────────────┘
```

1.  **Contexto Transacional Core (Banco 1)**: Representa os dados originais da plataforma DentalGO (cadastros, faturamento, planos, assinaturas). Este contexto é acessado estritamente em modo de leitura (Read-Only) através do driver `mysql2/promise` tradicional.
2.  **Contexto CRM Comercial (Banco 2)**: Representa o ecossistema interno de vendas da equipe comercial. Controla o direcionamento de contatos, histórico de notas escritas pelos agentes e a gestão de colunas do funil (Kanban). É persistido de forma isolada via **Prisma ORM**.

### Entidades do Domínio (Domain Entities)
*   **`LeadState` (Raiz de Agregação)**: Representa a presença comercial de um lead no CRM comercial. Identificado logicamente por seu ID no banco transacional (`externalPersonId`).
*   **`LeadInteraction` (Entidade de Domínio)**: Notas de contato registradas no histórico de interação do lead. Possui vínculo com o autor (agente) e com a data de criação.
*   **`User` (Entidade IAM)**: Agentes de vendas e administradores que operam no sistema, cada um contendo papéis (`role`) como `ADMIN` ou `AGENT` e status de ativação (`isActive`).

### Repositório de Domínio (Domain Repository)
Definido pela interface `ICrmRepository`, abstrai os detalhes de infraestrutura (consultas ao Prisma) do fluxo de negócios da aplicação:

```typescript
export interface ICrmRepository {
  getManyLeadStates(externalPersonIds: number[]): Promise<CrmLeadState[]>;
  updateStage(externalPersonId: number, newStage: string): Promise<CrmLeadState>;
  assignLead(externalPersonId: number, assigneeId: string): Promise<CrmLeadState>;
  addInteraction(externalPersonId: number, text: string, authorId: string): Promise<CrmLeadInteraction>;
  getInteractions(externalPersonId: number): Promise<CrmLeadInteraction[]>;
}
```

---

## 2. Estratégia de Qualidade baseada em Testes (TDD)

O desenvolvimento baseado em **TDD** garante a conformidade com as regras de negócio declaradas no contrato `ICrmRepository` antes da vinculação com as rotas HTTP e ações do frontend.

### Ciclo de Desenvolvimento (Red-Green-Refactor)
1.  **Red**: Escrever testes automatizados unitários cobrindo o comportamento da classe `PrismaCrmRepository` (ex: garantir que a criação de uma nota de interação gere um `upsert` prévio do `LeadState` no estágio padrão `'novo_cadastro'` se ele ainda não estiver cadastrado no CRM). Os testes falharão inicialmente.
2.  **Green**: Implementar o código mínimo necessário em `src/lib/repositories/PrismaCrmRepository.ts` para fazer os testes passarem.
3.  **Refactor**: Otimizar a estrutura do repositório, simplificando consultas redundantes e garantindo que o pool de conexões do Prisma seja reutilizado corretamente.

### Configuração de Testes Sugerida (Jest / Vitest)
Mock do Prisma Client para testes unitários em isolamento da rede:
```typescript
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import prisma from './prisma';

jest.mock('./prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
```

---

## 3. Épicos de Desenvolvimento (Construção do CRM v2.0)

O cronograma do projeto é dividido em seis épicos estruturados:

### Épico 1: Modelagem de Dados Relacional (Concluído)
*   Criação do schema declarativo no Prisma (`prisma/schema.prisma`).
*   Configuração do provedor para MySQL e descarte de arrays nativos para total compatibilidade.
*   Estruturação das tabelas necessárias para autenticação NextAuth (`User`, `Account`, `Session`, `VerificationToken`).
*   Adição de campos de controle IAM em `User` (`role` padrão `'AGENT'`, status `isActive` padrão `true`, e campo `password` para hash criptográfico).
*   Estruturação das tabelas de negócio do CRM (`LeadState` e `LeadInteraction`).

### Épico 2: Contratos de Domínio (Concluído)
*   Criação da tipagem TypeScript estrita e contratos de persistência em `src/lib/domain/crm.types.ts`.
*   Definição de tipos imutáveis para garantir o tráfego de dados isolado das tabelas brutas do Prisma.

### Épico 3: Implementação do Repositório de Domínio (Concluído)
*   Criação da classe de implementação `PrismaCrmRepository` em `src/lib/repositories/PrismaCrmRepository.ts`.
*   Programação da lógica transacional e idempotente (uso de `upsert` no controle de estágios de Leads para evitar violações de chave primária).
*   Garantia automática de pré-cadastro de lead ao salvar notas de contato.

### Épico 4: Configuração da Camada IAM - Segurança (Concluído)
*   Integração do middleware de segurança no Next.js (`src/middleware.ts`) protegendo a rota raiz do painel comercial `/dashboard`.
*   Criação do manipulador unificado de autenticação NextAuth em `src/auth.ts` utilizando o `PrismaAdapter` e o provedor de credenciais por email/senha com criptografia hash via `bcryptjs`.
*   Exposição da rota curinga de autenticação em `src/app/api/auth/[...nextauth]/route.ts`.

### Épico 5: Refatoração da Camada de Rede (Concluído)
*   Remoção total das referências de leitura e gravação no arquivo temporário `crm_store.json`.
*   Atualização da API de estatísticas e painel (`GET /api/crm` e `POST /api/crm`) injetando a classe de persistência `PrismaCrmRepository`.
*   Mapeamento em memória (Merge In-Memory) nos endpoints de KPIs (`/api/kpis`) e listagem de usuários (`/api/users`) utilizando o método `getManyLeadStates` baseado nos IDs gerados pelo Banco 1.

### Épico 6: Aprimoramento da Interface do Usuário (UI/UX)
*   **Novos Filtros Avançados**:
    *   Filtro de leads por data de aquisição do cadastro no banco core.
    *   Filtro dinâmico por Plano de Assinatura (Ex: Core Anual, Core Recorrente, Cadastro Grátis).
    *   Filtro por Responsável Comercial (Agente do CRM atribuído).
*   **Ficha e Gestão Comercial**:
    *   Adição de campo seletor dropdown na ficha de atendimento para atribuir ou alterar o Agente responsável (`assigneeId`) pelo lead.
    *   Exposição visual da data de cadastro do lead.
*   **Melhorias Visuais**:
    *   Exibição do nome e avatar do Agente ativo nas notas de contato.
    *   Layout responsivo para os filtros superiores e novas transições suaves no Kanban de Leads.

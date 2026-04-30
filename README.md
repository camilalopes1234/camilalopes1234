# Premium Sales CRM

CRM web para operação comercial consultiva com foco em leads high ticket, pipeline em Kanban, follow-up, agenda comercial, propostas, dashboard executivo e inbox de WhatsApp.

## Stack

- Next.js App Router
- TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- NextAuth com login por credenciais
- Zod
- Recharts
- Deploy preparado para Vercel

## Módulos

- Login com perfis `admin` e `comercial`
- Dashboard comercial
- Gestão de leads com busca, filtros e detalhe
- Pipeline em Kanban
- Agenda comercial
- Avaliações
- Oportunidades
- Inbox de chatbot e WhatsApp

## Estrutura principal

```text
src/
  app/
    (protected)/
      agenda
      conversations
      dashboard
      evaluations
      leads
      opportunities
      pipeline
      settings
    api/
  components/
  lib/
  server/
    auth
    db
    permissions
    queries
    repositories
    schemas
    services
prisma/
  schema.prisma
  seed.ts
```

## Variáveis de ambiente

Copie `.env.example` para `.env`.

```bash
cp .env.example .env
```

### Produção com Supabase

Este projeto já está preparado para usar:

- `DATABASE_URL` para runtime com pool
- `DIRECT_URL` para migrations e Prisma CLI

Use as strings do botão `Connect` no painel do Supabase.

Exemplo:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:SUA_SENHA@aws-0-SUA-REGIAO.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:SUA_SENHA@db.PROJECT_REF.supabase.co:5432/postgres"
NEXTAUTH_SECRET="gere-um-secret-longo"
NEXTAUTH_URL="http://localhost:3000"
WHATSAPP_VERIFY_TOKEN="change-me"
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
```

Notas:

- `DATABASE_URL`:
  usada pela aplicação em runtime
  no Supabase, prefira a string do pooler em `6543`
- `DIRECT_URL`:
  usada por `migrate`, `db pull`, `studio` e comandos Prisma
  no Supabase, prefira a conexão direta em `5432`

Referências oficiais:

- [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma)
- [Prisma + Supabase](https://www.prisma.io/docs/v6/orm/overview/databases/supabase)
- [Supabase connection strings](https://supabase.com/docs/reference/postgres/connection-strings)

## Como rodar localmente com Supabase

1. Instale as dependências:

```bash
npm install
```

2. Gere o Prisma Client:

```bash
npm run prisma:generate
```

3. Rode a migration inicial no banco do Supabase:

```bash
npm run prisma:migrate -- --name init
```

4. Popule o banco com dados fictícios:

```bash
npm run db:seed
```

5. Suba a aplicação:

```bash
npm run dev
```

6. Abra:

```text
http://localhost:3000
```

## Usuários de teste

Depois do seed:

- Admin: `admin@premiumsalescrm.com`
- Comercial: `comercial@premiumsalescrm.com`
- Senha: `12345678`

## Scripts úteis

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:studio
npm run db:seed
```

## Regras de negócio implementadas

- Lead novo entra em `Novo Lead`
- Toda interação atualiza a última interação
- Próxima ação sincroniza tarefa de follow-up
- `Fechado` aceita valor fechado
- `Perdido` exige motivo de perda
- Dashboard respeita o escopo do usuário logado
- Comercial enxerga apenas itens próprios
- Admin enxerga toda a operação

## Seed

O seed cria:

- 2 usuários (`admin` e `comercial`)
- leads em várias etapas
- interações
- tarefas pendentes e atrasadas
- avaliações
- oportunidades
- dados demo para conversas e mensagens

## WhatsApp e chatbot

Estrutura já existente:

- `Conversation` e `Message` no Prisma
- inbox em `/conversations`
- envio manual de mensagem pela inbox
- webhook em `/api/webhooks/whatsapp`
- service layer para handoff e normalização de números

Variáveis futuras:

```env
WHATSAPP_VERIFY_TOKEN="seu-token"
WHATSAPP_ACCESS_TOKEN="seu-token-da-meta"
WHATSAPP_PHONE_NUMBER_ID="seu-phone-number-id"
```

## Deploy na Vercel

1. Envie o repositório para o GitHub.
2. Importe o projeto na Vercel.
3. Configure as variáveis:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
4. Rode migrations no banco de produção:

```bash
npm run prisma:deploy
```

5. Faça o deploy.

## Validação

Última validação executada no projeto:

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

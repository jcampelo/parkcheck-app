# ParkCheck MVP — Design Spec

**Data:** 2026-05-10
**Status:** Aprovado

## Contexto

Aplicação web para check-in e check-out de veículos em um único estacionamento. O projeto existe como protótipo vanilla HTML/CSS/JS com persistência em localStorage. O objetivo deste MVP é migrar para infraestrutura real: Supabase como backend e Vercel como hospedagem, mantendo a leveza e simplicidade do app atual.

## Stack

- **Frontend:** Vanilla HTML/CSS/JS com Vite como build tool
- **Backend/DB:** Supabase (PostgreSQL + Auth + Realtime)
- **Hospedagem:** Vercel (detecta Vite automaticamente)
- **Auth:** Supabase Auth com usuário fixo único para o gerente (sem cadastro aberto)

## Páginas

| Página | Acesso | Responsabilidade |
|--------|--------|-----------------|
| `index.html` | Público | Landing com seleção de papel (Cliente / Gerente) |
| `cliente.html` | Público | Formulário de check-in + geração de voucher PNG |
| `login.html` | Público | Tela de login do gerente (nova) |
| `gerente.html` | Privado (requer sessão) | Dashboard com lista de veículos, checkout e configurações |

Os arquivos `parkcheck-estacionamento*.html` e `parkcheck-gerente*.html` são protótipos descartados e serão removidos.

## Estrutura de arquivos

```
park-check/
├── index.html
├── cliente.html
├── login.html          ← novo
├── gerente.html
├── src/
│   ├── supabase.js     ← inicialização do client + env vars
│   ├── auth.js         ← login, logout, verificação de sessão
│   ├── db.js           ← operações de check-in, check-out, settings
│   └── realtime.js     ← subscription WebSocket (Supabase Realtime)
├── vite.config.js
├── package.json
└── .env.local          ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

## Schema Supabase

### Tabela `check_ins`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid (PK) | Gerado automaticamente |
| `plate` | text | Placa do veículo |
| `name` | text | Nome do motorista |
| `phone` | text | Telefone |
| `checkin_time` | timestamptz | Momento de entrada |
| `status` | text | `active` ou `completed` |
| `checkout_time` | timestamptz | Momento de saída (null se ativo) |
| `amount` | numeric | Valor cobrado (null se ativo) |

### Tabela `settings`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | int (PK) | Sempre 1 (registro único) |
| `rate_first_hour` | numeric | Tarifa da primeira hora |
| `rate_subsequent` | numeric | Tarifa das horas subsequentes |
| `use_subsequent_rate` | boolean | Habilita tarifa progressiva |
| `show_cost` | boolean | Exibe custo em tempo real no dashboard |

### RLS (Row Level Security)

- `check_ins`: leitura e escrita livres para o role `anon` (cliente faz check-in sem login; gerente lê/edita com a mesma chave anon — suficiente para MVP single-tenant)
- `settings`: leitura livre; escrita restrita ao role `authenticated` (somente gerente logado altera tarifas)

## Fluxo de autenticação

1. Gerente acessa `gerente.html`
2. `auth.js` verifica sessão ativa via `supabase.auth.getSession()`
3. Se não autenticado → redireciona para `login.html`
4. `login.html` chama `supabase.auth.signInWithPassword()` com e-mail/senha fixos pré-cadastrados no Supabase
5. Após login bem-sucedido → redireciona para `gerente.html`

## Realtime

`realtime.js` abre uma subscription na tabela `check_ins` ao carregar `gerente.html`:

```js
supabase
  .channel('check_ins')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, handleChange)
  .subscribe()
```

Substitui o `setInterval` de 10 segundos do protótipo atual. Conexão WebSocket única, sem polling.

## Deploy

1. `npm run build` → Vite gera `dist/`
2. Vercel detecta o Vite automaticamente via `vite.config.js`
3. Env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) configuradas no painel da Vercel
4. Cada push na branch principal dispara deploy automático

## O que não está no escopo deste MVP

- Multi-tenant (múltiplos estacionamentos)
- Relatórios históricos avançados
- Pagamento online
- App mobile nativo

# ParkCheck MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o ParkCheck de localStorage para Supabase (DB + Auth + Realtime) com Vite como build tool e deploy na Vercel.

**Architecture:** Vanilla HTML/CSS/JS com Vite para bundling. Módulos JS em `src/` isolam Supabase client, auth, CRUD e Realtime. Os HTMLs existentes são adaptados para importar esses módulos. Supabase Realtime substitui o `setInterval` de refresh de dados.

**Tech Stack:** Vite 5, @supabase/supabase-js 2, Vercel (detecção automática), Supabase (PostgreSQL + Auth + Realtime)

---

### Task 1: Supabase — Tabelas, RLS e Realtime

**Files:**
- Nenhum arquivo local — executar no SQL Editor do Supabase Dashboard

- [ ] **Step 1: Criar tabela `check_ins`**

Acesse o Supabase Dashboard → SQL Editor e execute:

```sql
create table check_ins (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  name text not null,
  phone text not null,
  checkin_time timestamptz not null default now(),
  status text not null default 'active',
  checkout_time timestamptz,
  amount numeric
);
```

- [ ] **Step 2: Criar tabela `settings` com linha padrão**

```sql
create table settings (
  id int primary key default 1,
  rate_first_hour numeric not null default 10,
  rate_subsequent numeric not null default 8,
  use_subsequent_rate boolean not null default true,
  show_cost boolean not null default true
);

insert into settings (id) values (1) on conflict do nothing;
```

- [ ] **Step 3: Habilitar RLS e criar políticas**

```sql
-- check_ins: anon pode ler e escrever (MVP single-tenant)
alter table check_ins enable row level security;
create policy "anon_all" on check_ins for all to anon using (true) with check (true);

-- settings: anon lê, authenticated (gerente) atualiza
alter table settings enable row level security;
create policy "anon_read" on settings for select to anon using (true);
create policy "auth_update" on settings for update to authenticated using (true);
```

- [ ] **Step 4: Habilitar Realtime na tabela `check_ins`**

```sql
alter publication supabase_realtime add table check_ins;
```

- [ ] **Step 5: Criar usuário fixo do gerente**

Supabase Dashboard → Authentication → Users → "Add user" (Invite ou Create)
- E-mail: (e-mail do gerente)
- Senha: (senha segura)

Anote o e-mail e senha — serão usados no `login.html`.

---

### Task 2: Vite + npm — Setup do projeto

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `.env.local`
- Create: `.gitignore`

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "park-check",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0"
  },
  "devDependencies": {
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Criar `vite.config.js`**

```js
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cliente: resolve(__dirname, 'cliente.html'),
        gerente: resolve(__dirname, 'gerente.html'),
        login: resolve(__dirname, 'login.html'),
      }
    }
  }
})
```

- [ ] **Step 3: Criar `.env.local` com as credenciais do Supabase**

Obtenha em Supabase Dashboard → Settings → API:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

- [ ] **Step 4: Criar `.gitignore`**

```
node_modules/
dist/
.env.local
.superpowers/
```

- [ ] **Step 5: Instalar dependências**

```bash
npm install
```

Resultado esperado: pasta `node_modules/` criada, `package-lock.json` gerado.

- [ ] **Step 6: Verificar que o dev server sobe**

```bash
npm run dev
```

Resultado esperado: `http://localhost:5173` acessível no browser com `index.html` carregando.

- [ ] **Step 7: Commit**

```bash
git init
git add package.json package-lock.json vite.config.js .gitignore
git commit -m "feat: setup vite + supabase-js"
```

---

### Task 3: src/supabase.js — Client init

**Files:**
- Create: `src/supabase.js`

- [ ] **Step 1: Criar o arquivo**

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

- [ ] **Step 2: Verificar no console do browser**

Abra o browser em `http://localhost:5173`. No console:
```js
import('/src/supabase.js').then(m => console.log(m.supabase))
```
Resultado esperado: objeto SupabaseClient sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/supabase.js
git commit -m "feat: add supabase client init"
```

---

### Task 4: src/auth.js — Autenticação

**Files:**
- Create: `src/auth.js`

- [ ] **Step 1: Criar o arquivo**

```js
import { supabase } from './supabase.js'

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = '/login.html'
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    window.location.href = '/login.html'
    return null
  }
  return session
}
```

- [ ] **Step 2: Commit**

```bash
git add src/auth.js
git commit -m "feat: add auth module"
```

---

### Task 5: src/db.js — CRUD com Supabase

**Files:**
- Create: `src/db.js`

O módulo converte snake_case do Supabase para camelCase internamente, preservando a compatibilidade com o código dos HTMLs existentes.

- [ ] **Step 1: Criar o arquivo**

```js
import { supabase } from './supabase.js'

function toLocal(r) {
  return {
    id: r.id,
    plate: r.plate,
    name: r.name,
    phone: r.phone,
    checkinTime: new Date(r.checkin_time).getTime(),
    checkoutTime: r.checkout_time ? new Date(r.checkout_time).getTime() : null,
    status: r.status,
    amount: r.amount,
  }
}

function settingsToLocal(s) {
  return {
    rateFirstHour: s.rate_first_hour,
    rateSubsequent: s.rate_subsequent,
    useSubsequentRate: s.use_subsequent_rate,
    showCost: s.show_cost,
  }
}

export async function createCheckin({ plate, name, phone }) {
  const { data, error } = await supabase
    .from('check_ins')
    .insert({ plate, name, phone, status: 'active' })
    .select()
    .single()
  if (error) throw error
  return toLocal(data)
}

export async function plateIsActive(plate) {
  const { data } = await supabase
    .from('check_ins')
    .select('id')
    .eq('plate', plate)
    .eq('status', 'active')
    .limit(1)
  return data && data.length > 0
}

export async function getActiveCheckins() {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('status', 'active')
    .order('checkin_time', { ascending: false })
  if (error) throw error
  return data.map(toLocal)
}

export async function getRecentCheckouts(limit = 10) {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('status', 'completed')
    .order('checkout_time', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data.map(toLocal)
}

export async function getTodayCheckins() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .gte('checkin_time', today.toISOString())
  if (error) throw error
  return data.map(toLocal)
}

export async function completeCheckout(id, amount) {
  const { error } = await supabase
    .from('check_ins')
    .update({ status: 'completed', checkout_time: new Date().toISOString(), amount })
    .eq('id', id)
  if (error) throw error
}

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()
  if (error) return { rateFirstHour: 10, rateSubsequent: 8, useSubsequentRate: true, showCost: true }
  return settingsToLocal(data)
}

export async function updateSettings({ rateFirstHour, rateSubsequent, useSubsequentRate }) {
  const { error } = await supabase
    .from('settings')
    .update({ rate_first_hour: rateFirstHour, rate_subsequent: rateSubsequent, use_subsequent_rate: useSubsequentRate })
    .eq('id', 1)
  if (error) throw error
}
```

- [ ] **Step 2: Commit**

```bash
git add src/db.js
git commit -m "feat: add db module with supabase crud"
```

---

### Task 6: src/realtime.js — WebSocket subscription

**Files:**
- Create: `src/realtime.js`

- [ ] **Step 1: Criar o arquivo**

```js
import { supabase } from './supabase.js'

export function subscribeToCheckins(onChange) {
  return supabase
    .channel('check_ins_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, onChange)
    .subscribe()
}

export function unsubscribe(channel) {
  supabase.removeChannel(channel)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/realtime.js
git commit -m "feat: add realtime subscription module"
```

---

### Task 7: Criar login.html

**Files:**
- Create: `login.html`

- [ ] **Step 1: Criar o arquivo**

Copie a estrutura de CSS de `cliente.html` (variáveis `:root`, reset, `#app`, `app-header`, `main-content`, `.form-*`, `.btn`) e use o seguinte HTML e script:

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>ParkCheck · Entrar</title>
<style>
  /* Cole aqui todo o bloco <style> de cliente.html */
</style>
</head>
<body>
<div id="app">
  <header class="app-header">
    <div class="app-logo">Park<span>Check</span></div>
    <div class="role-badge">Gerente</div>
  </header>
  <div class="main-content">
    <div class="hero" style="margin-top:32px">
      <h1>Entrar</h1>
      <p>Acesso restrito ao gerente do estacionamento.</p>
    </div>
    <form id="loginForm" autocomplete="on">
      <div class="form-group">
        <label class="form-label" for="email">E-mail</label>
        <input class="form-input" type="email" id="email" placeholder="gerente@email.com" required autofocus>
      </div>
      <div class="form-group">
        <label class="form-label" for="password">Senha</label>
        <input class="form-input" type="password" id="password" placeholder="••••••••" required>
      </div>
      <p id="loginError" style="color:oklch(55% 0.18 25);font-size:14px;text-align:center;margin-bottom:12px;display:none"></p>
      <button type="submit" class="btn btn-primary" id="loginBtn">Entrar</button>
    </form>
  </div>
</div>
<script type="module">
import { signIn, getSession } from './src/auth.js'

getSession().then(s => { if (s) window.location.href = '/gerente.html' })

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value
  const btn = document.getElementById('loginBtn')
  const err = document.getElementById('loginError')
  btn.disabled = true
  btn.textContent = 'Entrando…'
  err.style.display = 'none'
  try {
    await signIn(email, password)
    window.location.href = '/gerente.html'
  } catch {
    err.textContent = 'E-mail ou senha incorretos.'
    err.style.display = 'block'
    btn.disabled = false
    btn.textContent = 'Entrar'
  }
})
</script>
</body>
</html>
```

- [ ] **Step 2: Testar no browser**

Acesse `http://localhost:5173/login.html`. Tente login com credenciais erradas → deve mostrar mensagem de erro. Tente com credenciais corretas → deve redirecionar para `/gerente.html`.

- [ ] **Step 3: Commit**

```bash
git add login.html
git commit -m "feat: add login page with supabase auth"
```

---

### Task 8: Migrar cliente.html

**Files:**
- Modify: `cliente.html`

As únicas mudanças são no bloco `<script>`: remover `loadData`/`saveData`, importar `createCheckin` e `plateIsActive`, tornar `handleCheckin` async.

- [ ] **Step 1: Substituir o bloco `<script>` por versão com módulos**

Troque `<script>` por `<script type="module">` e substitua o conteúdo do script por:

```js
import { createCheckin, plateIsActive } from './src/db.js'

// Manter as funções de formatação e UI existentes sem alteração:
// formatDate, formatTime, formatDateTime, showScreen, showToast, resetFlow, renderDone, downloadVoucher

function formatDate(d) { return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' }) }
function formatTime(d) { return d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) }
function formatDateTime(d) { return formatDate(d) + ' às ' + formatTime(d) }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(id).classList.add('active')
  if (id === 'screen-form') document.getElementById('checkinForm').reset()
}

function showToast(msg) {
  const t = document.getElementById('toast')
  t.innerHTML = msg; t.classList.add('show')
  clearTimeout(t._tid); t._tid = setTimeout(() => t.classList.remove('show'), 2400)
}

window.resetFlow = () => showScreen('screen-form')

let _lastCheckin = null

function renderDone(c) {
  _lastCheckin = c
  const dt = new Date(c.checkinTime)
  document.getElementById('confirmDetails').innerHTML =
    '<div class="detail-item"><span class="detail-label">Placa</span><span class="detail-value plate">'+c.plate+'</span></div>'+
    '<div class="detail-item"><span class="detail-label">Nome</span><span class="detail-value">'+c.name+'</span></div>'+
    '<div class="detail-item"><span class="detail-label">Telefone</span><span class="detail-value">'+c.phone+'</span></div>'+
    '<div class="detail-item"><span class="detail-label">Data</span><span class="detail-value">'+formatDate(dt)+'</span></div>'+
    '<div class="detail-item"><span class="detail-label">Entrada</span><span class="detail-value">'+formatTime(dt)+'</span></div>'+
    '<div class="detail-item"><span class="detail-label">Codigo</span><span class="detail-value">'+c.id+'</span></div>'
  document.getElementById('voucherCard').innerHTML =
    '<div class="vc-header">ParkCheck &middot; Comprovante de Entrada</div>'+
    '<div class="vc-plate">'+c.plate+'</div>'+
    '<div class="vc-time">'+formatDateTime(dt)+'</div>'+
    '<div style="font-size:13px;margin-top:6px">'+c.name+' &middot; '+c.phone+'</div>'+
    '<div class="vc-footer">Codigo '+c.id+'</div>'
}

window.downloadVoucher = function() {
  const c = _lastCheckin; if (!c) return
  const canvas = document.createElement('canvas')
  canvas.width = 840; canvas.height = 440
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,840,440)
  const grad = ctx.createLinearGradient(0,0,840,100)
  grad.addColorStop(0,'#1a6ff5'); grad.addColorStop(1,'#3b82f6')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.roundRect(0,0,840,100,[12,12,0,0]); ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 36px -apple-system, "Segoe UI", system-ui, sans-serif'
  ctx.fillText('ParkCheck', 44, 65)
  const dt = new Date(c.checkinTime)
  ctx.fillStyle = '#1a1a2e'
  ctx.font = '600 22px -apple-system, system-ui, sans-serif'
  ctx.fillText('Comprovante de Entrada', 44, 145)
  ctx.font = '700 60px -apple-system, system-ui, sans-serif'
  ctx.fillText(c.plate, 44, 215)
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(44,240); ctx.lineTo(796,240); ctx.stroke()
  ctx.font = '500 21px -apple-system, system-ui, sans-serif'
  ctx.fillStyle = '#6b7280'; ctx.fillText('Cliente', 44, 285)
  ctx.fillStyle = '#1a1a2e'; ctx.fillText(c.name, 44, 314)
  ctx.fillStyle = '#6b7280'; ctx.fillText('Telefone', 280, 285)
  ctx.fillStyle = '#1a1a2e'; ctx.fillText(c.phone, 280, 314)
  ctx.fillStyle = '#6b7280'; ctx.fillText('Data', 560, 285)
  ctx.fillStyle = '#1a1a2e'; ctx.fillText(formatDate(dt), 560, 314)
  ctx.fillStyle = '#6b7280'; ctx.fillText('Horario de entrada', 44, 360)
  ctx.fillStyle = '#1a1a2e'; ctx.fillText(formatTime(dt), 44, 389)
  ctx.fillStyle = '#6b7280'; ctx.fillText('Codigo', 280, 360)
  ctx.fillStyle = '#1a1a2e'; ctx.fillText(c.id, 280, 389)
  ctx.fillStyle = '#d1d5db'
  ctx.font = '400 13px -apple-system, system-ui, sans-serif'
  ctx.fillText('Guarde este comprovante. Apresente no caixa para liberacao do veiculo.', 44, 428)
  const a = document.createElement('a')
  a.download = 'ParkCheck_Comprovante_'+c.plate+'.png'
  a.href = canvas.toDataURL('image/png')
  a.click()
  showToast('Comprovante baixado!')
}

// handleCheckin agora usa Supabase
document.getElementById('checkinForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const plate = document.getElementById('plate').value.trim().toUpperCase()
  const name = document.getElementById('name').value.trim()
  const phone = document.getElementById('phone').value.trim()
  if (!plate || !name || !phone) return

  const active = await plateIsActive(plate)
  if (active) { showToast('Esta placa já está registrada no pátio'); return }

  showScreen('screen-loading')
  try {
    const entry = await createCheckin({ plate, name, phone })
    renderDone(entry)
    showScreen('screen-done')
    setTimeout(window.downloadVoucher, 400)
  } catch {
    showToast('Erro ao registrar. Tente novamente.')
    showScreen('screen-form')
  }
})
```

- [ ] **Step 2: Remover `onsubmit="handleCheckin(event)"` do form**

No HTML do `cliente.html`, remova o atributo `onsubmit` do `<form id="checkinForm">`, pois o listener agora é registrado via JS.

- [ ] **Step 3: Testar no browser**

1. Acesse `http://localhost:5173/cliente.html`
2. Preencha os dados e submeta → spinner aparece → tela de confirmação com placa/nome/hora
3. Verifique no Supabase Dashboard → Table Editor → `check_ins` que o registro apareceu
4. Tente submeter a mesma placa → deve mostrar toast de placa duplicada

- [ ] **Step 4: Commit**

```bash
git add cliente.html
git commit -m "feat: migrate cliente.html to supabase"
```

---

### Task 9: Migrar gerente.html

**Files:**
- Modify: `gerente.html`

As mudanças são: adicionar `type="module"`, importar módulos, tornar funções async, substituir localStorage por chamadas ao `db.js`, adicionar realtime e botão de logout, remover o `setInterval` de refresh de dados (manter o de timers de duração).

- [ ] **Step 1: Alterar `<script>` para `<script type="module">` e adicionar imports**

Substitua a abertura do script e as primeiras variáveis por:

```js
import { getActiveCheckins, getRecentCheckouts, getTodayCheckins,
         getSettings, updateSettings, completeCheckout } from './src/db.js'
import { requireAuth, signOut } from './src/auth.js'
import { subscribeToCheckins } from './src/realtime.js'

let _timer = null
let _activeCheckins = []
let _settings = { rateFirstHour: 10, rateSubsequent: 8, useSubsequentRate: true, showCost: true }
```

- [ ] **Step 2: Remover as funções `loadSettings`, `saveSettings`, `loadData`, `saveData`, `getActive`, `getCompleted`, `getToday`**

Essas 7 funções são substituídas pelos imports de `db.js`.

- [ ] **Step 3: Tornar `render()` assíncrono**

Substitua a função `render()` por:

```js
async function render() {
  _settings = await getSettings()
  const s = _settings
  _activeCheckins = await getActiveCheckins()
  const today = await getTodayCheckins()
  const completed = await getRecentCheckouts()

  document.getElementById('statActive').textContent = _activeCheckins.length
  document.getElementById('activeBadge').textContent = _activeCheckins.length
  document.getElementById('statToday').textContent = today.length

  const rateText = s.useSubsequentRate
    ? '1ª hora <strong>'+fmtCurrency(s.rateFirstHour)+'</strong> · Hora extra <strong>'+fmtCurrency(s.rateSubsequent)+'</strong>'
    : 'Preço fixo <strong>'+fmtCurrency(s.rateFirstHour)+'/hora</strong>'
  document.getElementById('rateSummary').innerHTML = rateText

  const list = document.getElementById('vehicleList')
  const empty = document.getElementById('emptyState')

  if (_activeCheckins.length === 0) {
    list.innerHTML = ''; empty.style.display = 'flex'
  } else {
    empty.style.display = 'none'
    list.innerHTML = _activeCheckins.map(c => {
      const dur = calcDuration(c.checkinTime, null)
      const cost = calcAmount(dur.min, s)
      const dIn = new Date(c.checkinTime)
      return '<div class="vehicle-card">'+
        '<div class="vehicle-info">'+
        '<div class="vehicle-plate">'+c.plate+'</div>'+
        '<div class="vehicle-name"><span class="status-dot"></span>'+c.name+'</div>'+
        (c.phone ? '<div class="vehicle-name" style="margin-top:1px">'+c.phone+'</div>' : '')+
        '</div>'+
        '<div class="vehicle-time">'+
        '<div class="vehicle-duration" data-id="'+c.id+'">'+fmtDuration(c.checkinTime,null)+'</div>'+
        '<div class="vehicle-cost" data-cost-id="'+c.id+'">'+fmtCurrency(cost)+'</div>'+
        '<div class="vehicle-entry">'+fmtTime(dIn)+'</div>'+
        '</div>'+
        '<button class="btn-small" onclick="openCheckout(\''+c.id+'\')">Check-out</button>'+
        '</div>'
    }).join('')
  }

  const hist = document.getElementById('historyList')
  const hEmpty = document.getElementById('historyEmpty')
  if (completed.length === 0) {
    hist.innerHTML = ''; hEmpty.style.display = 'flex'
  } else {
    hEmpty.style.display = 'none'
    hist.innerHTML = completed.map(c => {
      const dOut = new Date(c.checkoutTime)
      return '<div class="history-row">'+
        '<div><div class="h-plate">'+c.plate+'</div><div class="h-time">'+fmtDateTime(dOut)+'</div></div>'+
        '<div class="h-amount">'+fmtCurrency(c.amount)+'</div>'+
        '</div>'
    }).join('')
  }

  if (_timer) clearInterval(_timer)
  _timer = setInterval(updateTimers, 10000)
}
```

- [ ] **Step 4: Atualizar `updateTimers` para usar `_settings` e `_activeCheckins`**

Substitua a função `updateTimers` por:

```js
function updateTimers() {
  _activeCheckins.forEach(c => {
    const el = document.querySelector('[data-id="'+c.id+'"]')
    if (el) el.textContent = fmtDuration(c.checkinTime, null)
    const cel = document.querySelector('[data-cost-id="'+c.id+'"]')
    if (cel) cel.textContent = fmtCurrency(calcAmount(calcDuration(c.checkinTime, null).min, _settings))
  })
  document.getElementById('statActive').textContent = _activeCheckins.length
  document.getElementById('activeBadge').textContent = _activeCheckins.length
}
```

- [ ] **Step 6: Atualizar `openCheckout` para usar `_activeCheckins`**

```js
window.openCheckout = function(id) {
  const c = _activeCheckins.find(x => x.id === id)
  if (!c) return
  const now = Date.now()
  const dur = calcDuration(c.checkinTime, now)
  const detail = calcAmountDetail(dur.min, _settings)
  const dIn = new Date(c.checkinTime)
  const dOut = new Date(now)

  document.getElementById('modalOverlay').style.display = 'flex'
  document.getElementById('modalOverlay').innerHTML =
    '<div class="modal-sheet" onclick="event.stopPropagation()">'+
    '<div class="modal-handle"></div>'+
    '<h3>Check-out do veículo</h3>'+
    '<div class="checkout-details">'+
    '<div class="checkout-row"><span class="clabel">Placa</span><span class="cvalue" style="font-family:var(--font-display);letter-spacing:0.06em;font-weight:600">'+c.plate+'</span></div>'+
    '<div class="checkout-row"><span class="clabel">Cliente</span><span class="cvalue">'+c.name+'</span></div>'+
    (c.phone ? '<div class="checkout-row"><span class="clabel">Telefone</span><span class="cvalue">'+c.phone+'</span></div>' : '')+
    '<div class="checkout-row"><span class="clabel">Entrada</span><span class="cvalue">'+fmtDateTime(dIn)+'</span></div>'+
    '<div class="checkout-row"><span class="clabel">Saída</span><span class="cvalue">'+fmtDateTime(dOut)+'</span></div>'+
    '<div class="checkout-row"><span class="clabel">Permanência</span><span class="cvalue">'+fmtDuration(c.checkinTime,now)+'</span></div>'+
    '<div class="checkout-row checkout-total"><span class="clabel">Valor a cobrar</span><span class="cvalue">'+fmtCurrency(detail.total)+'</span></div>'+
    '</div>'+
    '<div class="checkout-breakdown">'+
    '<div class="bk-row"><span>1ª hora</span><span>'+fmtCurrency(detail.firstAmount)+'</span></div>'+
    (detail.extraAmount > 0 ? '<div class="bk-row"><span>Horas extras ('+Math.ceil(detail.extraMin/60)+' × '+fmtCurrency(detail.extraAmount / Math.ceil(detail.extraMin/60))+')</span><span>'+fmtCurrency(detail.extraAmount)+'</span></div>' : '')+
    '</div>'+
    '<div class="modal-actions">'+
    '<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn btn-danger" onclick="confirmCheckout(\''+c.id+'\','+detail.total+')">Confirmar saída</button>'+
    '</div>'+
    '</div>'
}
```

- [ ] **Step 7: Atualizar `confirmCheckout` para usar Supabase**

```js
window.confirmCheckout = async function(id, amount) {
  await completeCheckout(id, amount)
  document.getElementById('modalOverlay').style.display = 'none'
  showToast('Check-out realizado — ' + fmtCurrency(amount))
  await render()
}
```

- [ ] **Step 8: Atualizar `saveSettingsAction` para usar Supabase**

```js
window.saveSettingsAction = async function() {
  const v1 = parseFloat(document.getElementById('settingsFirstHour').value) || 10
  const v2 = parseFloat(document.getElementById('settingsSubsequent').value) || 8
  const useSub = document.getElementById('toggleSubsequentRate').classList.contains('on')
  await updateSettings({ rateFirstHour: v1, rateSubsequent: v2, useSubsequentRate: useSub })
  document.getElementById('settingsOverlay').style.display = 'none'
  showToast('Preços atualizados')
  await render()
}
```

- [ ] **Step 9: Atualizar `refresh()` para async**

```js
window.refresh = async function() { await render(); showToast('Atualizado') }
```

- [ ] **Step 10: Adicionar botão de logout ao header do `gerente.html`**

Após o botão de settings no header, adicione:

```html
<button class="icon-btn" id="logoutBtn" title="Sair">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
</button>
```

- [ ] **Step 11: Substituir inicialização no final do script**

Remova `render()` e `window.addEventListener('storage', ...)` e substitua por:

```js
// Inicializar com auth + realtime
;(async () => {
  await requireAuth()
  document.getElementById('logoutBtn').addEventListener('click', signOut)
  await render()
  subscribeToCheckins(async () => { await render() })
})()
```

- [ ] **Step 12: Testar no browser**

1. Acesse `http://localhost:5173/gerente.html` → deve redirecionar para `/login.html`
2. Faça login → deve ir para `gerente.html` com dashboard carregado
3. Em outra aba, acesse `cliente.html` e faça um check-in → `gerente.html` deve atualizar automaticamente sem refresh
4. Faça check-out de um veículo → deve desaparecer da lista e aparecer no histórico
5. Abra Configurações, altere uma tarifa, salve → resumo de tarifas deve atualizar
6. Clique em "Sair" → deve redirecionar para `login.html`

- [ ] **Step 13: Commit**

```bash
git add gerente.html
git commit -m "feat: migrate gerente.html to supabase + realtime"
```

---

### Task 10: Atualizar index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Verificar link para gerente**

Abra `index.html` e confirme que o link para o gerente aponta para `gerente.html` (não `login.html`). O `requireAuth()` em `gerente.html` já redireciona para login quando necessário. Se o link apontar para `gerente.html`, está correto — não mude.

- [ ] **Step 2: Remover links para arquivos de protótipo**

Se `index.html` contiver referências a `parkcheck-*.html`, remova-as.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "chore: update index links"
```

---

### Task 11: Remover arquivos de protótipo

**Files:**
- Delete: `parkcheck-estacionamento.html`
- Delete: `parkcheck-estacionamento-2.html`
- Delete: `parkcheck-gerente.html`
- Delete: `parkcheck-gerente-2.html`

- [ ] **Step 1: Deletar os 4 arquivos**

```bash
rm parkcheck-estacionamento.html parkcheck-estacionamento-2.html parkcheck-gerente.html parkcheck-gerente-2.html
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove prototype files"
```

---

### Task 12: Build e deploy na Vercel

**Files:**
- Nenhum arquivo novo

- [ ] **Step 1: Verificar build local**

```bash
npm run build
```

Resultado esperado: pasta `dist/` criada com `index.html`, `cliente.html`, `gerente.html`, `login.html` e assets em `dist/assets/`.

- [ ] **Step 2: Testar build localmente**

```bash
npm run preview
```

Acesse `http://localhost:4173` e teste o fluxo completo (login, check-in, dashboard, checkout).

- [ ] **Step 3: Criar repositório no GitHub e fazer push**

```bash
git remote add origin https://github.com/<seu-usuario>/park-check.git
git push -u origin main
```

- [ ] **Step 4: Conectar na Vercel**

1. Acesse vercel.com → "Add New Project"
2. Importe o repositório `park-check`
3. Vercel detecta Vite automaticamente (Framework Preset: Vite)
4. Clique em "Deploy" (sem alterar nada ainda)

- [ ] **Step 5: Adicionar variáveis de ambiente na Vercel**

Após o primeiro deploy (que falhará por falta das env vars):
- Vercel → projeto → Settings → Environment Variables
- Adicione: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Clique em "Redeploy"

- [ ] **Step 6: Verificar deploy**

Acesse a URL gerada pela Vercel e teste o fluxo completo em produção.

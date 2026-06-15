# Fase 0 + Fase 1a — Fundação Supabase & Produtos · Plano de Implementação

> **Para quem executa:** SUB-SKILL OBRIGATÓRIA — use `superpowers:executing-plans` (execução em blocos
> com checkpoints, conforme escolha do dono do projeto) para implementar este plano tarefa a tarefa.
> Os passos usam caixas de seleção (`- [ ]`) para acompanhamento.

**Goal:** Tirar os produtos de dentro do código (`menuData.js`) e colocá-los num banco Supabase real,
com um painel `/admin` protegido por login onde o dono cadastra produtos e categorias; o cardápio
público passa a ler tudo do banco.

**Architecture:** Mantém o app React/Vite atual. Adiciona o cliente Supabase (Postgres + Auth + RLS),
um conjunto pequeno de tabelas (`categories`, `products`), e uma área `/admin` via React Router
protegida por login. Uma camada fina de acesso a dados (`src/lib/`) isola as chamadas ao Supabase do
resto do app, para que telas não falem direto com o banco. O cardápio público troca o import de
`menuData.js` por uma leitura assíncrona do banco, com o mesmo formato de dados de antes.

**Tech Stack:** React 18, Vite, Tailwind, Framer Motion, Lucide (já existentes) · `@supabase/supabase-js`
· `react-router-dom` · Vitest + Testing Library (para testes).

---

## Decisões de ambiente (confirmadas em 2026-06-15)

- Supabase: o dono **tem conta, mas ainda não criou o projeto**. A Tarefa 1 cobre a criação.
- Painel: **mesmo site, rota `/admin`** (reaproveita o deploy Vercel atual).
- Acesso: **login único** (só o dono). Sem perfis de atendente.
- Execução: **em blocos com checkpoints**.

---

## Estrutura de arquivos

**Criar:**
- `.env.local` — adicionar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (NÃO commitar).
- `.env.example` — modelo das variáveis (commitado, sem valores reais).
- `src/lib/supabase.js` — instancia e exporta o cliente Supabase único.
- `src/lib/products.js` — funções de acesso a produtos/categorias (listar, criar, editar, remover).
- `src/lib/auth.js` — funções de login/logout/sessão.
- `src/auth/AuthProvider.jsx` — contexto React com a sessão do usuário.
- `src/auth/RequireAuth.jsx` — componente que protege rotas do `/admin`.
- `src/admin/AdminLayout.jsx` — layout base do painel (cabeçalho, navegação lateral, sair).
- `src/admin/LoginPage.jsx` — tela de login.
- `src/admin/DashboardPlaceholder.jsx` — página inicial do `/admin` (placeholder até a Fase 5).
- `src/admin/ProductsPage.jsx` — lista/CRUD de produtos.
- `src/admin/ProductForm.jsx` — formulário de criar/editar produto.
- `src/admin/CategoriesPage.jsx` — CRUD de categorias.
- `supabase/migrations/0001_init.sql` — SQL das tabelas + RLS (versionado).
- `scripts/migrate-menudata.mjs` — script único que importa os produtos do `menuData.js` para o banco.
- Testes: `src/lib/products.test.js`, `src/auth/RequireAuth.test.jsx`, `src/admin/ProductForm.test.jsx`.

**Modificar:**
- `package.json` — novas dependências e script de teste.
- `src/main.jsx` — envolver o app no `BrowserRouter` e `AuthProvider`; definir rotas.
- `src/App.jsx` — passa a ser a rota do cardápio público; troca `import { menuData }` por leitura do banco.
- `vite.config.js` — adicionar config do Vitest (ambiente jsdom).

**Manter intacto (não mexer):** todos os componentes do cardápio (`Header`, `CategoryNav`,
`MenuSection`, `ItemCard`, `ProductModal`, `CartDrawer`) — eles recebem os mesmos dados de antes.

---

## Convenção de dados (compatibilidade com o cardápio atual)

O cardápio espera hoje um array de categorias assim (de `menuData.js`):

```js
[{ id, name, emoji, items: [{ id, name, price, desc, image, available }] }]
```

A camada `src/lib/products.js` deve devolver **exatamente esse formato** ao cardápio, montado a partir
das tabelas do banco. Assim os componentes do cardápio não precisam mudar. (No banco os ids são uuid;
para o cardápio eles continuam servindo como chave única — o formato externo é o mesmo.)

---

# FASE 0 — Fundação

### Task 1: Criar o projeto Supabase e guardar as chaves

Esta tarefa é manual (feita pelo dono no navegador) — sem código, mas é pré-requisito de tudo.

- [ ] **Step 1: Criar o projeto**

No site do Supabase (já logado): "New project" → nome `vo-neis`, região `South America (São Paulo)`,
definir uma senha forte do banco (guardar num gerenciador de senhas). Aguardar o provisionamento.

- [ ] **Step 2: Copiar as chaves**

Em Project Settings → API, copiar:
- `Project URL`
- `anon public` key (chave pública — pode ir pro frontend)

- [ ] **Step 3: Criar `.env.local` (NÃO commitar)**

Criar `.env.local` na raiz com:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

Conferir que `.env.local` está no `.gitignore` (já está, segundo o projeto).

- [ ] **Step 4: Criar `.env.example` (commitado, sem valores)**

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 5: Commit**

```bash
git add .env.example
git commit -m "chore: adiciona .env.example para Supabase"
```

---

### Task 2: Criar as tabelas e a segurança (RLS) no banco

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Escrever o SQL das tabelas**

Criar `supabase/migrations/0001_init.sql`:

```sql
-- Categorias do cardápio
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Produtos
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  price numeric(10,2) not null default 0,
  cost numeric(10,2) not null default 0,
  unit text not null default 'fatia',
  image_url text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index products_category_id_idx on public.products(category_id);
```

- [ ] **Step 2: Adicionar Row Level Security ao mesmo arquivo**

Anexar em `0001_init.sql`:

```sql
-- Liga RLS
alter table public.categories enable row level security;
alter table public.products enable row level security;

-- Cardápio público: qualquer um pode LER (anon). Só produtos ativos importam,
-- mas a leitura é liberada; o filtro de "active" é feito na query do cardápio.
create policy "leitura publica categorias"
  on public.categories for select
  to anon, authenticated using (true);

create policy "leitura publica produtos"
  on public.products for select
  to anon, authenticated using (true);

-- Escrita: somente usuários autenticados (o dono logado no /admin).
create policy "escrita autenticada categorias"
  on public.categories for all
  to authenticated using (true) with check (true);

create policy "escrita autenticada produtos"
  on public.products for all
  to authenticated using (true) with check (true);
```

- [ ] **Step 3: Rodar a migração no banco**

Aplicar via o conector Supabase deste ambiente (ferramenta `apply_migration`, name `0001_init`,
conteúdo do arquivo). Alternativa manual: colar o SQL no SQL Editor do painel Supabase e executar.

- [ ] **Step 4: Verificar que as tabelas existem**

Listar as tabelas (ferramenta `list_tables` do conector, schema `public`).
Esperado: aparecem `categories` e `products`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat: cria tabelas categories e products com RLS"
```

---

### Task 3: Instalar dependências e configurar testes

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`

- [ ] **Step 1: Instalar pacotes**

```bash
npm install @supabase/supabase-js react-router-dom
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Adicionar script de teste ao `package.json`**

Em `"scripts"`, adicionar:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Configurar o Vitest no `vite.config.js`**

Substituir o conteúdo de `vite.config.js` por:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
})
```

- [ ] **Step 4: Criar o setup de testes**

Criar `src/test-setup.js`:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Rodar o teste (vazio) pra confirmar que a config funciona**

Run: `npm test`
Esperado: Vitest roda e diz "no test files found" (sem erro de configuração).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js src/test-setup.js
git commit -m "chore: adiciona supabase-js, react-router e vitest"
```

---

### Task 4: Criar o cliente Supabase

**Files:**
- Create: `src/lib/supabase.js`

- [ ] **Step 1: Escrever o cliente**

Criar `src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não definidas. Veja .env.example.'
  )
}

export const supabase = createClient(url, anonKey)
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase.js
git commit -m "feat: instancia cliente Supabase"
```

---

### Task 5: Camada de autenticação

**Files:**
- Create: `src/lib/auth.js`
- Create: `src/auth/AuthProvider.jsx`

- [ ] **Step 1: Escrever as funções de auth**

Criar `src/lib/auth.js`:

```js
import { supabase } from './supabase'

export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}

export function getSession() {
  return supabase.auth.getSession()
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session))
}
```

- [ ] **Step 2: Escrever o provider de sessão**

Criar `src/auth/AuthProvider.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { getSession, onAuthChange } from '../lib/auth'

const AuthContext = createContext({ session: null, loading: true })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getSession().then(({ data }) => {
      if (active) {
        setSession(data.session)
        setLoading(false)
      }
    })
    const { data: sub } = onAuthChange((s) => setSession(s))
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth.js src/auth/AuthProvider.jsx
git commit -m "feat: camada de autenticacao Supabase com contexto de sessao"
```

---

### Task 6: Proteção de rotas (RequireAuth) — com teste

**Files:**
- Create: `src/auth/RequireAuth.jsx`
- Test: `src/auth/RequireAuth.test.jsx`

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/auth/RequireAuth.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import { AuthContextForTest } from './testUtils'

function renderWith(session, loading = false) {
  return render(
    <AuthContextForTest value={{ session, loading }}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<div>Tela de login</div>} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <div>Conteudo protegido</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContextForTest>
  )
}

test('redireciona para /login quando nao ha sessao', () => {
  renderWith(null)
  expect(screen.getByText('Tela de login')).toBeInTheDocument()
})

test('mostra o conteudo quando ha sessao', () => {
  renderWith({ user: { id: '1' } })
  expect(screen.getByText('Conteudo protegido')).toBeInTheDocument()
})
```

- [ ] **Step 2: Exportar o contexto cru no `AuthProvider.jsx` e criar o utilitário de teste**

Primeiro, em `src/auth/AuthProvider.jsx`, exportar o contexto cru. Trocar a linha
`const AuthContext = createContext(...)` por:

```jsx
export const AuthContext = createContext({ session: null, loading: true })
```

(remover o `const` antigo; o restante do arquivo continua igual, pois já usa `AuthContext`.)

Depois criar `src/auth/testUtils.jsx` (injeta sessão nos testes sem o Supabase real), usando
`import` ESM em vez de `require`:

```jsx
import { AuthContext } from './AuthProvider'

export const AuthContextForTest = ({ value, children }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
)
```

- [ ] **Step 3: Rodar o teste e ver falhar**

Run: `npm test src/auth/RequireAuth.test.jsx`
Esperado: FAIL — `RequireAuth` ainda não existe.

- [ ] **Step 4: Implementar o RequireAuth**

Criar `src/auth/RequireAuth.jsx`:

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="p-8 text-center text-ink/50">Carregando…</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}
```

- [ ] **Step 5: Rodar o teste e ver passar**

Run: `npm test src/auth/RequireAuth.test.jsx`
Esperado: PASS (2 testes).

- [ ] **Step 6: Commit**

```bash
git add src/auth/RequireAuth.jsx src/auth/RequireAuth.test.jsx src/auth/testUtils.jsx src/auth/AuthProvider.jsx
git commit -m "feat: protecao de rotas RequireAuth com testes"
```

---

### Task 7: Tela de login

**Files:**
- Create: `src/admin/LoginPage.jsx`

- [ ] **Step 1: Escrever a tela**

Criar `src/admin/LoginPage.jsx`:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) setError('E-mail ou senha incorretos.')
    else navigate('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-card">
        <h1 className="mb-5 font-display text-2xl italic text-ink">Painel · Vó Neis</h1>
        <label className="mb-1 block font-sans text-sm text-ink/70">E-mail</label>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="mb-4 w-full rounded-lg border border-accent/30 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
        />
        <label className="mb-1 block font-sans text-sm text-ink/70">Senha</label>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
          className="mb-4 w-full rounded-lg border border-accent/30 px-3 py-2.5 font-sans text-sm outline-none focus:border-accent"
        />
        {error && <p className="mb-3 font-sans text-sm text-red-500">{error}</p>}
        <button
          type="submit" disabled={busy}
          className="w-full rounded-full bg-accent py-3 font-sans text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Criar o usuário dono no Supabase**

No painel Supabase → Authentication → Users → "Add user": criar o e-mail/senha do dono.
(Login único; não há cadastro aberto na tela.)

- [ ] **Step 3: Commit**

```bash
git add src/admin/LoginPage.jsx
git commit -m "feat: tela de login do painel"
```

---

### Task 8: Layout do painel e roteamento

**Files:**
- Create: `src/admin/AdminLayout.jsx`
- Create: `src/admin/DashboardPlaceholder.jsx`
- Modify: `src/main.jsx`

- [ ] **Step 1: Criar o layout do painel**

Criar `src/admin/AdminLayout.jsx`:

```jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth'
import { LayoutDashboard, Package, Tags, LogOut } from 'lucide-react'

const link = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm ${
    isActive ? 'bg-accent text-white' : 'text-ink/70 hover:bg-accentLight'
  }`

export default function AdminLayout() {
  const navigate = useNavigate()
  async function handleLogout() {
    await signOut()
    navigate('/login')
  }
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-56 flex-col gap-1 border-r border-accent/15 bg-card p-3">
        <h1 className="mb-3 px-2 font-display text-xl italic text-ink">Vó Neis</h1>
        <NavLink to="/admin" end className={link}><LayoutDashboard size={18} /> Painel</NavLink>
        <NavLink to="/admin/produtos" className={link}><Package size={18} /> Produtos</NavLink>
        <NavLink to="/admin/categorias" className={link}><Tags size={18} /> Categorias</NavLink>
        <button onClick={handleLogout} className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm text-ink/60 hover:bg-accentLight">
          <LogOut size={18} /> Sair
        </button>
      </aside>
      <main className="flex-1 p-6"><Outlet /></main>
    </div>
  )
}
```

- [ ] **Step 2: Criar o placeholder do dashboard**

Criar `src/admin/DashboardPlaceholder.jsx`:

```jsx
export default function DashboardPlaceholder() {
  return (
    <div>
      <h2 className="mb-2 font-display text-2xl italic text-ink">Painel</h2>
      <p className="font-sans text-sm text-ink/60">
        O dashboard com faturamento, lucro e estoque chega na Fase 5, quando houver dados de vendas.
        Por enquanto, use o menu para cadastrar Produtos e Categorias.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Reescrever `src/main.jsx` com as rotas**

Substituir o conteúdo de `src/main.jsx` por:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthProvider'
import RequireAuth from './auth/RequireAuth'
import AdminLayout from './admin/AdminLayout'
import LoginPage from './admin/LoginPage'
import DashboardPlaceholder from './admin/DashboardPlaceholder'
import ProductsPage from './admin/ProductsPage'
import CategoriesPage from './admin/CategoriesPage'
import './index.css'
import 'lenis/dist/lenis.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={<RequireAuth><AdminLayout /></RequireAuth>}
          >
            <Route index element={<DashboardPlaceholder />} />
            <Route path="produtos" element={<ProductsPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)

const splash = document.getElementById('splash')
if (splash) {
  const started = performance.now()
  const MIN_SHOW = 2000
  requestAnimationFrame(() => {
    const wait = Math.max(0, MIN_SHOW - (performance.now() - started))
    setTimeout(() => {
      splash.classList.add('splash-hide')
      setTimeout(() => splash.remove(), 650)
    }, wait)
  })
}
```

> `ProductsPage` e `CategoriesPage` são criadas nas Tasks 10 e 11. Para o app compilar antes disso,
> crie stubs temporários `export default function ProductsPage(){return null}` e idem para Categorias,
> e substitua pelo conteúdo real nas próximas tasks.

- [ ] **Step 4: Garantir que a Vercel redireciona rotas para o index (SPA)**

Criar `vercel.json` na raiz (para `/admin` não dar 404 ao recarregar):

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

- [ ] **Step 5: Rodar o app e testar login → painel**

Run: `npm run dev`
Esperado: `/` mostra o cardápio; `/admin` redireciona para `/login`; após entrar com o usuário criado,
mostra o layout do painel com o placeholder.

- [ ] **Step 6: Commit**

```bash
git add src/admin/AdminLayout.jsx src/admin/DashboardPlaceholder.jsx src/main.jsx vercel.json
git commit -m "feat: layout do painel /admin com rotas protegidas"
```

---

# FASE 1a — Produtos

### Task 9: Camada de dados de produtos e categorias — com teste

**Files:**
- Create: `src/lib/products.js`
- Test: `src/lib/products.test.js`

- [ ] **Step 1: Escrever o teste que falha (formato do cardápio)**

Criar `src/lib/products.test.js` — testa a função pura que monta o formato do cardápio a partir das
linhas do banco (sem chamar o Supabase real):

```js
import { groupForMenu } from './products'

test('agrupa produtos por categoria no formato do cardapio', () => {
  const categories = [
    { id: 'c1', name: 'Fatias', emoji: '🎂', sort_order: 0 },
    { id: 'c2', name: 'Potes', emoji: '🍮', sort_order: 1 },
  ]
  const products = [
    { id: 'p1', category_id: 'c1', name: 'Ninho', price: 18, description: 'x', image_url: null, active: true },
    { id: 'p2', category_id: 'c1', name: 'Limão', price: 18, description: null, image_url: null, active: false },
    { id: 'p3', category_id: 'c2', name: 'Red Velvet', price: 16, description: null, image_url: null, active: true },
  ]
  const menu = groupForMenu(categories, products)
  expect(menu).toHaveLength(2)
  expect(menu[0]).toMatchObject({ id: 'c1', name: 'Fatias', emoji: '🎂' })
  expect(menu[0].items.map((i) => i.name)).toEqual(['Ninho', 'Limão'])
  expect(menu[0].items[0]).toMatchObject({ id: 'p1', price: 18, available: true })
  expect(menu[0].items[1].available).toBe(false)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test src/lib/products.test.js`
Esperado: FAIL — `groupForMenu` não existe.

- [ ] **Step 3: Implementar a camada de dados**

Criar `src/lib/products.js`:

```js
import { supabase } from './supabase'

export function groupForMenu(categories, products) {
  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order)
  return sorted.map((cat) => ({
    id: cat.id,
    name: cat.name,
    emoji: cat.emoji,
    items: products
      .filter((p) => p.category_id === cat.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        desc: p.description,
        image: p.image_url,
        available: p.active,
      })),
  }))
}

export async function fetchMenu() {
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('products').select('*').order('name'),
  ])
  return groupForMenu(categories ?? [], products ?? [])
}

export async function listProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('name')
  if (error) throw error
  return data
}

export async function saveProduct(product) {
  const { id, ...fields } = product
  const query = id
    ? supabase.from('products').update(fields).eq('id', id)
    : supabase.from('products').insert(fields)
  const { error } = await query
  if (error) throw error
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function listCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function saveCategory(category) {
  const { id, ...fields } = category
  const query = id
    ? supabase.from('categories').update(fields).eq('id', id)
    : supabase.from('categories').insert(fields)
  const { error } = await query
  if (error) throw error
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test src/lib/products.test.js`
Esperado: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/products.js src/lib/products.test.js
git commit -m "feat: camada de dados de produtos e categorias"
```

---

### Task 10: Tela de Categorias (CRUD)

**Files:**
- Create: `src/admin/CategoriesPage.jsx` (substitui o stub)

- [ ] **Step 1: Implementar a tela**

Substituir `src/admin/CategoriesPage.jsx` por:

```jsx
import { useEffect, useState } from 'react'
import { listCategories, saveCategory, deleteCategory } from '../lib/products'
import { Plus, Trash2 } from 'lucide-react'

export default function CategoriesPage() {
  const [cats, setCats] = useState([])
  const [draft, setDraft] = useState({ name: '', emoji: '', sort_order: 0 })

  async function reload() {
    setCats(await listCategories())
  }
  useEffect(() => {
    reload()
  }, [])

  async function add(e) {
    e.preventDefault()
    if (!draft.name.trim()) return
    await saveCategory(draft)
    setDraft({ name: '', emoji: '', sort_order: 0 })
    reload()
  }

  async function remove(id) {
    if (!confirm('Remover esta categoria?')) return
    await deleteCategory(id)
    reload()
  }

  return (
    <div>
      <h2 className="mb-4 font-display text-2xl italic text-ink">Categorias</h2>
      <form onSubmit={add} className="mb-5 flex gap-2">
        <input value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
          placeholder="🎂" className="w-16 rounded-lg border border-accent/30 px-3 py-2 text-center" />
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Nome da categoria" className="flex-1 rounded-lg border border-accent/30 px-3 py-2" />
        <button className="flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> Adicionar
        </button>
      </form>
      <ul className="space-y-2">
        {cats.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg bg-card px-4 py-3 shadow-card">
            <span className="font-sans text-sm text-ink">{c.emoji} {c.name}</span>
            <button onClick={() => remove(c.id)} className="text-ink/30 hover:text-red-500"><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Testar no navegador**

Run: `npm run dev` → `/admin/categorias`. Adicionar "Fatias de Bolo 🎂", conferir que aparece e some
ao remover. Conferir no painel Supabase (Table editor) que a linha foi criada.

- [ ] **Step 3: Commit**

```bash
git add src/admin/CategoriesPage.jsx
git commit -m "feat: CRUD de categorias no painel"
```

---

### Task 11: Formulário e tela de Produtos (CRUD) — com teste do formulário

**Files:**
- Create: `src/admin/ProductForm.jsx`
- Create: `src/admin/ProductsPage.jsx` (substitui o stub)
- Test: `src/admin/ProductForm.test.jsx`

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/admin/ProductForm.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import ProductForm from './ProductForm'

const categorias = [{ id: 'c1', name: 'Fatias' }]

test('chama onSave com os dados preenchidos', () => {
  const onSave = vi.fn()
  render(<ProductForm categories={categorias} onSave={onSave} onCancel={() => {}} />)
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ninho' } })
  fireEvent.change(screen.getByLabelText('Preço'), { target: { value: '18' } })
  fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'c1' } })
  fireEvent.click(screen.getByText('Salvar'))
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Ninho', price: 18, category_id: 'c1' })
  )
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test src/admin/ProductForm.test.jsx`
Esperado: FAIL — `ProductForm` não existe.

- [ ] **Step 3: Implementar o formulário**

Criar `src/admin/ProductForm.jsx`:

```jsx
import { useState } from 'react'

export default function ProductForm({ categories, initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial ?? { name: '', price: 0, cost: 0, unit: 'fatia', description: '', image_url: '', category_id: '', active: true }
  )
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function submit(e) {
    e.preventDefault()
    onSave({ ...form, price: Number(form.price), cost: Number(form.cost) })
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-card p-4 shadow-card">
      <div>
        <label htmlFor="pf-name" className="mb-1 block text-sm text-ink/70">Nome</label>
        <input id="pf-name" value={form.name} onChange={set('name')} required
          className="w-full rounded-lg border border-accent/30 px-3 py-2" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="pf-price" className="mb-1 block text-sm text-ink/70">Preço</label>
          <input id="pf-price" type="number" step="0.01" value={form.price} onChange={set('price')}
            className="w-full rounded-lg border border-accent/30 px-3 py-2" />
        </div>
        <div className="flex-1">
          <label htmlFor="pf-cost" className="mb-1 block text-sm text-ink/70">Custo (provisório)</label>
          <input id="pf-cost" type="number" step="0.01" value={form.cost} onChange={set('cost')}
            className="w-full rounded-lg border border-accent/30 px-3 py-2" />
        </div>
      </div>
      <div>
        <label htmlFor="pf-cat" className="mb-1 block text-sm text-ink/70">Categoria</label>
        <select id="pf-cat" value={form.category_id} onChange={set('category_id')}
          className="w-full rounded-lg border border-accent/30 px-3 py-2">
          <option value="">— selecione —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="pf-desc" className="mb-1 block text-sm text-ink/70">Descrição</label>
        <textarea id="pf-desc" value={form.description ?? ''} onChange={set('description')}
          className="w-full rounded-lg border border-accent/30 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="pf-img" className="mb-1 block text-sm text-ink/70">URL da foto (opcional)</label>
        <input id="pf-img" value={form.image_url ?? ''} onChange={set('image_url')}
          className="w-full rounded-lg border border-accent/30 px-3 py-2" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">Salvar</button>
        <button type="button" onClick={onCancel} className="rounded-full border border-accent/30 px-5 py-2 text-sm text-ink/70">Cancelar</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test src/admin/ProductForm.test.jsx`
Esperado: PASS.

- [ ] **Step 5: Implementar a tela de produtos (lista + form + margem)**

Criar `src/admin/ProductsPage.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { listProducts, saveProduct, deleteProduct, listCategories } from '../lib/products'
import ProductForm from './ProductForm'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { brl } from '../utils'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [editing, setEditing] = useState(null) // objeto produto | 'new' | null

  async function reload() {
    const [p, c] = await Promise.all([listProducts(), listCategories()])
    setProducts(p)
    setCategories(c)
  }
  useEffect(() => {
    reload()
  }, [])

  async function handleSave(data) {
    await saveProduct(data)
    setEditing(null)
    reload()
  }
  async function remove(id) {
    if (!confirm('Remover este produto?')) return
    await deleteProduct(id)
    reload()
  }

  function margem(p) {
    if (!p.price) return '—'
    const pct = ((p.price - p.cost) / p.price) * 100
    return `${pct.toFixed(0)}%`
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl italic text-ink">Produtos</h2>
        {!editing && (
          <button onClick={() => setEditing('new')}
            className="flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
            <Plus size={16} /> Novo produto
          </button>
        )}
      </div>

      {editing ? (
        <ProductForm
          categories={categories}
          initial={editing === 'new' ? null : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg bg-card px-4 py-3 shadow-card">
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-sm font-semibold text-ink">{p.name}</p>
                <p className="font-sans text-xs text-ink/50">
                  {p.categories?.name ?? 'sem categoria'} · {brl(Number(p.price))} · margem {margem(p)}
                </p>
              </div>
              <button onClick={() => setEditing(p)} className="text-ink/40 hover:text-accent"><Pencil size={16} /></button>
              <button onClick={() => remove(p.id)} className="text-ink/30 hover:text-red-500"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Testar no navegador**

Run: `npm run dev` → `/admin/produtos`. Criar um produto, editar, ver a margem calculada, remover.
Conferir no Supabase que as linhas refletem as ações.

- [ ] **Step 7: Commit**

```bash
git add src/admin/ProductForm.jsx src/admin/ProductForm.test.jsx src/admin/ProductsPage.jsx
git commit -m "feat: CRUD de produtos com formulario e margem"
```

---

### Task 12: Migrar os produtos do `menuData.js` para o banco

**Files:**
- Create: `scripts/migrate-menudata.mjs`

- [ ] **Step 1: Escrever o script de migração**

Criar `scripts/migrate-menudata.mjs` (roda uma vez, no Node, usando a service role key para inserir):

```js
import { createClient } from '@supabase/supabase-js'
import { menuData } from '../src/menuData.js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.')
  process.exit(1)
}
const supabase = createClient(url, serviceKey)

for (const [order, cat] of menuData.entries()) {
  const { data: catRow, error: catErr } = await supabase
    .from('categories')
    .insert({ name: cat.name, emoji: cat.emoji, sort_order: order })
    .select()
    .single()
  if (catErr) { console.error('Categoria', cat.name, catErr.message); process.exit(1) }

  const rows = cat.items.map((it) => ({
    category_id: catRow.id,
    name: it.name,
    price: it.price,
    cost: 0,
    description: it.desc,
    image_url: it.image,
    active: it.available !== false,
  }))
  const { error: prodErr } = await supabase.from('products').insert(rows)
  if (prodErr) { console.error('Produtos de', cat.name, prodErr.message); process.exit(1) }
  console.log(`OK: ${cat.name} (${rows.length} itens)`)
}
console.log('Migração concluída.')
```

- [ ] **Step 2: Rodar o script (uma vez)**

Pegar a `service_role` key em Project Settings → API (chave secreta — NÃO vai pro frontend, só usada aqui).

```bash
SUPABASE_URL="https://SEU-PROJETO.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key" \
node scripts/migrate-menudata.mjs
```

Esperado: imprime "OK: <categoria> (N itens)" para cada categoria e "Migração concluída.".

- [ ] **Step 3: Conferir no painel**

No Supabase (Table editor), `categories` tem as categorias e `products` tem ~50 produtos.
Conferir também em `/admin/produtos` que a lista aparece preenchida.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-menudata.mjs
git commit -m "chore: script de migracao do menuData para o banco"
```

---

### Task 13: Cardápio público lendo do banco

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Localizar o uso atual de `menuData`**

Em `src/App.jsx`, hoje há `import { menuData } from './menuData'` e um `useMemo` que monta `menu` a
partir de `menuData` aplicando a disponibilidade do localStorage. Vamos trocar a **fonte** de `menuData`
fixo por um estado carregado do banco, mantendo o resto.

- [ ] **Step 2: Trocar o import por carregamento assíncrono**

Em `src/App.jsx`:

Remover a linha `import { menuData } from './menuData'`.
Adicionar `import { fetchMenu } from './lib/products'` junto aos outros imports.

Logo após os outros `useState`, adicionar:

```jsx
const [menuData, setMenuData] = useState([])
const [menuLoading, setMenuLoading] = useState(true)

useEffect(() => {
  fetchMenu()
    .then((data) => setMenuData(data))
    .catch((err) => console.error('Erro ao carregar cardápio:', err))
    .finally(() => setMenuLoading(false))
}, [])
```

> Isso mantém o nome `menuData` como variável local, então todo o resto do `App.jsx` que já usa
> `menuData` (os `useMemo` de `menu`, `flatItems`, etc.) continua funcionando sem mudança.

- [ ] **Step 3: Tratar o estado de carregamento**

No início do JSX retornado pelo `App` (antes do conteúdo principal), adicionar uma guarda simples para
não renderizar o cardápio vazio enquanto carrega — encontrar o primeiro elemento retornado e inserir
antes dele:

```jsx
if (menuLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="font-sans text-sm text-ink/50">Carregando o cardápio…</p>
    </div>
  )
}
```

> Colocar essa guarda logo no começo do `return`/corpo do componente, após os hooks (hooks nunca podem
> ficar abaixo de um `return` condicional).

- [ ] **Step 4: Lidar com `menuData[0]` no estado inicial**

Há `const [activeId, setActiveId] = useState(menuData[0].id)` no topo, que quebraria com array vazio.
Trocar por:

```jsx
const [activeId, setActiveId] = useState(null)
```

E, dentro do `useEffect` que carrega o menu, após `setMenuData(data)`, definir o primeiro id:

```jsx
if (data.length) setActiveId(data[0].id)
```

- [ ] **Step 5: Testar no navegador**

Run: `npm run dev` → `/`. O cardápio deve aparecer com os mesmos produtos, agora vindos do banco.
Editar um preço em `/admin/produtos`, recarregar `/` e confirmar que o novo preço aparece.

- [ ] **Step 6: Rodar todos os testes**

Run: `npm test`
Esperado: todos os testes passam.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat: cardapio publico le os produtos do banco"
```

---

## Verificação final (antes de considerar concluído)

- [ ] `npm test` — todos verdes.
- [ ] `npm run build` — build sem erros (rodar na máquina do dono; o sandbox tem binários de outra plataforma).
- [ ] `/` mostra o cardápio vindo do banco; produto desativado no admin some do cardápio.
- [ ] `/admin` exige login; logout volta para `/login`.
- [ ] Criar/editar/remover produto e categoria reflete no cardápio e no Supabase.
- [ ] `.env.local` e a service role key **não** foram commitados.
- [ ] Deploy na Vercel: configurar as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no
      painel da Vercel (Settings → Environment Variables) e fazer o deploy.

---

## O que NÃO está nesta fase (próximas)

- Ficha técnica de ingredientes e custo automático → **Fase 1b** (o campo `cost` aqui é provisório/manual).
- Estoque do dia / abrir caixa → **Fase 1c**.
- Combos (tabelas `combos`/`combo_items`) → entram na **Fase 1b/1c** conforme necessidade.
- PDV, financeiro, marketing, dashboard → **Fases 2 a 5**.


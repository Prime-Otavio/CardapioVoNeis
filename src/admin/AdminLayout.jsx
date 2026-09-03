import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth'
import { PinProvider } from './PinGate'
import { StoreProvider, useStore } from './StoreProvider'
import { ToastProvider } from './Toast'
import {
  LayoutDashboard, BarChart3, Package, Tags, Gift, FlaskConical, ClipboardList,
  Wallet, Settings, LogOut, Store, ListPlus, Bike, MoreHorizontal, X,
} from 'lucide-react'

// Menu completo (desktop) e, no celular, o que sobra atrás do botão "Mais".
const MENU = [
  { to: '/admin/balcao', label: 'Balcão', icon: Store, principal: true, end: false },
  { to: '/admin', label: 'Painel', icon: LayoutDashboard, principal: true, end: true },
  { to: '/admin/ifood', label: 'iFood', icon: Bike, principal: true, end: false },
  { to: '/admin/adicionais', label: 'Adicionais', icon: ListPlus },
  { to: '/admin/visao-geral', label: 'Visão geral', icon: BarChart3 },
  { to: '/admin/produtos', label: 'Produtos', icon: Package },
  { to: '/admin/categorias', label: 'Categorias', icon: Tags },
  { to: '/admin/combos', label: 'Combos', icon: Gift },
  { to: '/admin/ingredientes', label: 'Ingredientes', icon: FlaskConical },
  { to: '/admin/ficha-tecnica', label: 'Ficha técnica', icon: ClipboardList },
  { to: '/admin/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

const PRINCIPAIS = MENU.filter((m) => m.principal)

export default function AdminLayout() {
  return (
    <StoreProvider>
      <ToastProvider>
        <PinProvider>
          <Chrome />
        </PinProvider>
      </ToastProvider>
    </StoreProvider>
  )
}

// Desktop: sidebar. Celular: cabeçalho com seletor de loja e tab bar embaixo,
// no alcance do polegar — o painel é usado em pé, no balcão.
function Chrome() {
  const navigate = useNavigate()
  const [maisAberto, setMaisAberto] = useState(false)

  async function sair() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#FAF7F4] text-ink lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-ink/10 bg-white px-3 py-5 lg:flex">
        <div className="mb-5 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent font-display text-lg italic text-white">
            V
          </div>
          <div className="leading-tight">
            <p className="font-sans text-sm font-semibold text-ink">Vó Neis</p>
            <p className="font-sans text-[11px] text-ink/40">Painel de gestão</p>
          </div>
        </div>

        <div className="mb-3 px-2">
          <SeletorLoja />
        </div>

        {MENU.map(({ to, label, icon: Icone, end }) => (
          <NavLink key={to} to={to} end={end} className={estiloLink}>
            <Icone size={18} /> {label}
          </NavLink>
        ))}

        <button
          onClick={sair}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm text-ink/50 hover:bg-accentLight hover:text-ink"
        >
          <LogOut size={18} /> Sair
        </button>
      </aside>

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink/10 bg-[#FAF7F4]/95 px-4 py-3 backdrop-blur lg:hidden">
        <p className="font-display text-xl italic text-ink">Vó Neis</p>
        <div className="ml-auto min-w-0 max-w-[55%]">
          <SeletorLoja />
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-28 lg:overflow-y-auto lg:px-7 lg:py-6 lg:pb-6">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink/10 bg-white lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PRINCIPAIS.map(({ to, label, icon: Icone, end }) => (
          <NavLink key={to} to={to} end={end} className={estiloAba}>
            <Icone size={22} /> {label}
          </NavLink>
        ))}
        <button onClick={() => setMaisAberto(true)} className={estiloAba({ isActive: false })}>
          <MoreHorizontal size={22} /> Mais
        </button>
      </nav>

      {maisAberto && (
        <div className="fixed inset-0 z-40 flex items-end bg-ink/45 lg:hidden" onClick={() => setMaisAberto(false)}>
          <div
            className="max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-background p-5"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-2xl italic text-ink">Mais</h3>
              <button onClick={() => setMaisAberto(false)} aria-label="Fechar" className="p-2 text-ink/40">
                <X size={20} />
              </button>
            </div>
            {MENU.filter((m) => !m.principal).map(({ to, label, icon: Icone }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMaisAberto(false)}
                className="flex items-center gap-3 border-b border-ink/10 py-4 font-sans text-base text-ink"
              >
                <Icone size={20} className="text-ink/45" /> {label}
              </NavLink>
            ))}
            <button
              onClick={sair}
              className="flex w-full items-center gap-3 py-4 font-sans text-base text-red-500"
            >
              <LogOut size={20} /> Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SeletorLoja() {
  const { stores, storeId, setStoreId } = useStore()
  if (stores.length < 2) return null
  return (
    <select
      value={storeId ?? ''}
      onChange={(e) => setStoreId(e.target.value)}
      aria-label="Loja"
      className="w-full truncate rounded-full border border-ink/15 bg-white px-3 py-2 font-sans text-sm font-semibold text-ink"
    >
      {stores.map((l) => (
        <option key={l.id} value={l.id}>
          {l.name.replace('Vó Neis — ', '')}
          {l.active ? '' : ' (fechada)'}
        </option>
      ))}
    </select>
  )
}

const estiloLink = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm transition-colors ${
    isActive ? 'bg-accent text-white' : 'text-ink/60 hover:bg-accentLight hover:text-ink'
  }`

const estiloAba = ({ isActive }) =>
  `flex flex-1 flex-col items-center justify-center gap-1 py-2.5 font-sans text-[11px] font-bold ${
    isActive ? 'text-accent' : 'text-ink/45'
  }`

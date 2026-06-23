import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth'
import { PinProvider } from './PinGate'
import { LayoutDashboard, BarChart3, Package, Tags, FlaskConical, ClipboardList, Wallet, Settings, LogOut } from 'lucide-react'

const link = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm transition-colors ${
    isActive ? 'bg-accent text-white' : 'text-ink/60 hover:bg-accentLight hover:text-ink'
  }`

export default function AdminLayout() {
  const navigate = useNavigate()
  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <PinProvider>
    <div className="flex min-h-screen bg-[#FAF7F4] text-ink">
      <aside className="flex w-60 flex-col gap-1 border-r border-ink/10 bg-white px-3 py-5">
        <div className="mb-5 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent font-display text-lg italic text-white">
            V
          </div>
          <div className="leading-tight">
            <p className="font-sans text-sm font-semibold text-ink">Vó Neis</p>
            <p className="font-sans text-[11px] text-ink/40">Painel de gestão</p>
          </div>
        </div>

        <NavLink to="/admin" end className={link}>
          <LayoutDashboard size={18} /> Painel
        </NavLink>
        <NavLink to="/admin/visao-geral" className={link}>
          <BarChart3 size={18} /> Visão geral
        </NavLink>
        <NavLink to="/admin/produtos" className={link}>
          <Package size={18} /> Produtos
        </NavLink>
        <NavLink to="/admin/categorias" className={link}>
          <Tags size={18} /> Categorias
        </NavLink>
        <NavLink to="/admin/ingredientes" className={link}>
          <FlaskConical size={18} /> Ingredientes
        </NavLink>
        <NavLink to="/admin/ficha-tecnica" className={link}>
          <ClipboardList size={18} /> Ficha técnica
        </NavLink>
        <NavLink to="/admin/financeiro" className={link}>
          <Wallet size={18} /> Financeiro
        </NavLink>
        <NavLink to="/admin/configuracoes" className={link}>
          <Settings size={18} /> Configurações
        </NavLink>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm text-ink/50 hover:bg-accentLight hover:text-ink"
        >
          <LogOut size={18} /> Sair
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto px-7 py-6">
        <Outlet />
      </main>
    </div>
    </PinProvider>
  )
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthProvider'
import RequireAuth from './auth/RequireAuth'
import AdminLayout from './admin/AdminLayout'
import LoginPage from './admin/LoginPage'
import DashboardPage from './admin/DashboardPage'
import ProductsPage from './admin/ProductsPage'
import CategoriesPage from './admin/CategoriesPage'
import './index.css'
import 'lenis/dist/lenis.css'

// Quando rodando como o "site do painel" (VITE_APP_MODE=painel, definido no
// segundo projeto Vercel), a raiz abre direto o painel em vez do cardápio.
const isPainel = import.meta.env.VITE_APP_MODE === 'painel'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={isPainel ? <Navigate to="/admin" replace /> : <App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={<RequireAuth><AdminLayout /></RequireAuth>}
          >
            <Route index element={<DashboardPage />} />
            <Route path="produtos" element={<ProductsPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)

// Remove a splash assim que o app montar (com tempo mínimo para a animação)
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

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

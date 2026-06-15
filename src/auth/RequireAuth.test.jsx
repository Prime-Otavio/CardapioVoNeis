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

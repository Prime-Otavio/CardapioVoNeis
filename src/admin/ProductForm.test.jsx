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

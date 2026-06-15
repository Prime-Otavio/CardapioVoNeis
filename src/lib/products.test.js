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

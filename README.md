# Vó Neis Confeitaria — Cardápio Digital

Cardápio digital interativo com carrinho, pedido via WhatsApp e modo administrador para controle de estoque do dia.

## Stack

React (Vite) · Tailwind CSS · Framer Motion · Lucide React

## Como rodar

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

## Manutenção

Tudo que precisa de edição rotineira está em dois arquivos:

- **`src/menuData.js`** — categorias, itens e preços. Para adicionar foto a um item, troque `image: null` pela URL da imagem; ela preenche o card automaticamente. Sem URL, mostra o placeholder "Foto em breve" com o emoji da categoria.
- **`src/config.js`** — PIN do admin (padrão `1234`), número do WhatsApp e nome da loja.

## Modo Estoque do Dia

Botão de engrenagem ⚙ no canto inferior esquerdo → digite o PIN. Cada card ganha um botão para marcar como disponível/indisponível. O estado fica salvo no navegador (localStorage). "Resetar tudo" volta todos para disponível.

Itens indisponíveis aparecem com a tarja "Indisponível hoje" e não podem ser adicionados ao carrinho.

## Pedido via WhatsApp

O botão no carrinho monta a mensagem agrupada por categoria com quantidades, subtotais e total, e abre a conversa com o número configurado.
"# CardapioVoNeis" 

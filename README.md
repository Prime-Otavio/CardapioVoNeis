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

## Multi-loja

O sistema atende duas unidades com **catálogos 100% independentes** — cada loja
tem suas próprias categorias, produtos, preços, combos, caixa e despesas. Não é
um catálogo compartilhado com disponibilidade por loja.

| | Sede (`sede`) | Centro (`centro`) |
|---|---|---|
| Endereço | Rua Floriano Peixoto, 3030 — Jardim Sontag | Rua Rui Barbosa, 775 — Centro |
| Situação | ativa | em construção, `active = false` |
| WhatsApp | 5511933976800 | ainda não tem |

- **Painel:** o seletor de loja fica no topo da barra lateral e vale para todas
  as telas. A escolha fica no `localStorage`, então não volta para a sede a cada
  refresh.
- **Cardápio:** a loja vem de `?loja=<slug>` na URL, senão de `VITE_STORE_SLUG`,
  senão é a loja principal ativa. O parâmetro da URL vence até para loja
  inativa — é assim que se confere a Loja 2 antes de inaugurar.
- O número do WhatsApp vem da **linha da loja**, não mais do `config.js`. Loja
  sem número deixa os botões de pedido desativados em vez de mandar o pedido
  para a unidade errada.

> ⚠️ **Ainda não é por loja:** as funções do banco `register_sale`,
> `report_daily`, `report_top_products`, `report_by_payment` e
> `financial_result` são anteriores ao multi-loja e não recebem `store_id` —
> quando a Loja 2 abrir, elas vão somar as duas unidades. Só as telas que fazem
> query direta na tabela já estão filtradas. Corrigir no SQL antes da
> inauguração.

## Adicionais

Caldas, coberturas e recheios são **grupos reutilizáveis** (`option_groups` →
`options`, ligados aos produtos por `product_option_groups`, N:N). O ganho é
poder criar "Calda" uma vez e aplicá-la às 24 fatias de bolo de uma vez, na tela
**Adicionais** do painel — que também liga e desliga opção individual (acabou a
calda de ninho no meio da tarde: some do cardápio na hora, sem apagar nada).

No cardápio, os grupos aparecem na tela do produto e a escolha entra na mensagem
do WhatsApp. Opção com `extra_price > 0` soma no preço do item.

A calda que estava fixa no código continua aparecendo **apenas** para produto que
ainda não tem grupo cadastrado, para nada sumir do cardápio durante a transição.

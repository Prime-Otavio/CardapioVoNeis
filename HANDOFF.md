# Handoff: Painel de Gestão Vó Neis Confeitaria (ERP + cardápio)

**Data:** 2026-06-28
**Status:** Em andamento — sistema funcional no ar; última tarefa entregue (upload de fotos) aguardando deploy pelo usuário, e tratamento de fotos aguardando o usuário enviar os arquivos.

---

## 1. Objetivo

Transformar um cardápio digital simples (React/Vite, dados fixos no código) num sistema de gestão completo para a confeitaria "Vó Neis" (ERP + BI). O sistema tem duas faces no mesmo código: o **cardápio público** (cliente, pede via WhatsApp) e o **painel de gestão** (dono, em `/admin`), publicados como **dois sites separados** na Vercel. Tudo persistido no **Supabase**.

---

## 2. Contexto essencial

**Stack:** React 18 + Vite + Tailwind + Framer Motion + Lucide + React Router. Backend: **Supabase** (Postgres + Auth + Storage + RLS). Gráficos: Recharts. Testes: Vitest (poucos).

**Infra / deploy:**
- Repositório GitHub: `Prime-Otavio/CardapioVoNeis` (público), branch `main`. Todo `git push` dispara deploy automático na Vercel.
- **Dois projetos Vercel apontando para o MESMO repo:**
  - `cardapiovoneis` → `cardapiovoneis.vercel.app` (o cardápio do cliente).
  - `painelvoneis` → `painelvoneis-alpha.vercel.app` (o painel; tem a env var `VITE_APP_MODE=painel`, que faz a raiz `/` redirecionar direto pro `/admin`).
- Env vars (nos dois projetos): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Só no painel: `VITE_APP_MODE=painel`.
- Projeto Supabase: nome **"Vo Neis"**, ref **`rvxzddtvxhqomlszchdb`**, região sa-east-1. Conta do Supabase é uma SEGUNDA conta do usuário (não a mesma do conector inicial) — o conector deste ambiente já enxerga ela.

**Decisões importantes já tomadas (e por quê):**
- **Cardápio e painel = mesmo código, dois endereços.** Decidido para não duplicar projeto/manutenção. Aparência distinta resolve o "parecer profissional"; subdomínio real só com domínio próprio (usuário ainda usa `.vercel.app` grátis).
- **Custo por ficha técnica de ingredientes** (não custo chutado): usuário cadastra ingredientes + receita, sistema calcula custo e margem reais.
- **Marketing por IA** foi planejado mas NÃO construído (é o único dos 5 módulos originais que falta).
- **100% online** (sem offline) na versão atual.
- **Login único** (só o dono). Email do login: `veragroup.ia@gmail.com` (criado manualmente no Supabase Auth pelo usuário).
- **PIN do dono = `092207`** (definido pelo usuário; guardado com hash no banco). ⚠️ Apareceu no chat — recomendar trocar em Configurações.
- **Cardápio mostra catálogo completo quando caixa fechado; só produtos do caixa quando aberto; esgotados ficam com tarja "Esgotado".**

**⚠️ ARMADILHA CRÍTICA — OneDrive trunca arquivos:** o projeto está em pasta sincronizada por OneDrive. No sandbox Linux, o `bash`/`git` veem versões em CACHE truncadas ou "tudo deletado". **Nunca rodar `git add`/`commit`/`push` do ambiente** — os commits são feitos pelo USUÁRIO no PC dele. Sempre verificar integridade de arquivos editados com a ferramenta **Read** (que baixa a versão real), não com bash. Já houve 3+ casos de arquivo truncado quebrando o build. Também: o `npm install`/`build`/`test` não rodam no sandbox porque o `node_modules` é compilado para Windows. Memória registrada em `git-onedrive-sandbox.md`.

---

## 3. O que já foi feito (cronológico)

1. **Ajuste do carrinho mobile** (CartDrawer): layout em 2 linhas no celular, botões maiores.
2. **Design completo dos 5 módulos** → `docs/superpowers/specs/2026-06-15-painel-gestao-vo-neis-design.md`.
3. **Plano de implementação Fase 0/1a** → `docs/superpowers/plans/2026-06-15-fase0-fase1a-fundacao-produtos.md`.
4. **Fundação:** Supabase configurado; tabelas `categories`, `products` com RLS; cliente Supabase; auth + login; layout `/admin` com sidebar; rotas protegidas; `vercel.json` (SPA rewrites).
5. **Produtos no banco:** CRUD produtos/categorias; **68 produtos migrados** do `menuData.js` para o banco (via SQL no conector); cardápio passou a ler do banco (`fetchPublicMenu`).
6. **PDV / Vendas:** tabelas `sales`/`sale_items`; função `register_sale` (atômica, baixa estoque, bloqueia sem estoque); tela "Nova venda"; números reais no painel.
7. **Caixa:** `cash_sessions` + `daily_stock`; abrir caixa com **troco inicial**; **sangrias** (`cash_withdrawals`); **fechamento profissional** com conferência de dinheiro (esperado vs contado, diferença); **reabrir caixa**.
8. **Ficha técnica:** tabelas `ingredients` (com `cost_per_base_unit` gerado) + `recipes`; funções `recalc_product_cost` / `recalc_products_by_ingredient`; telas Ingredientes e Ficha técnica (custo/margem ao vivo).
9. **Financeiro:** tabela `expenses`; função `financial_result`; tela com resultado do mês (faturamento − CMV − despesas = lucro) e lançamento/edição de gastos.
10. **Visão geral (BI):** funções `report_daily`, `report_top_products`, `report_by_payment`; página com Recharts (linha faturamento/lucro, barras top produtos, pagamento), seletor 7/30/90 dias.
11. **PIN do dono:** tabela `app_settings` (pin_hash, pgcrypto/bcrypt); funções `set_owner_pin`/`verify_owner_pin`/`owner_pin_is_set`; componente `PinGate` (`requirePin`); proteção em: excluir venda (`delete_sale` devolve estoque), excluir produto/ingrediente/categoria/combo, reabrir caixa, excluir gasto. Tela Configurações pra trocar PIN.
12. **Tudo editável:** edição de categorias (nome/emoji), gastos, quantidade do estoque do dia.
13. **Combos:** tabelas `combos`/`combo_items`; tela de cadastro no painel; **faixa de combos em destaque no topo do cardápio** (CombosBanner, clicável → pede pelo WhatsApp).
14. **Cardápio ligado ao caixa:** com caixa aberto mostra só produtos do dia, marca "Esgotado".
15. **Abrir caixa repete sobras de ontem** (pré-preenche quantidades).
16. **Adicionar produto ao caixa já aberto** (botão "Add produto" + modal).
17. **Substituídos os `prompt()` feios** por modais bonitos (`InputModal`) na sangria e ajuste de estoque.
18. **Fotos removidas** dos 68 produtos (usuário pediu) — feito via SQL (`image_url = null`).
19. **Upload de fotos no painel:** bucket Storage `produtos` (público) + políticas RLS; `src/lib/storage.js` (`uploadProductImage`); botão "Escolher foto" com preview no `ProductForm`. **← ÚLTIMA TAREFA, aguardando o usuário dar push.**

**Bugs corrigidos no caminho (todos relevantes pra entender o código):**
- Carrinho não funcionava: `id: Number(id)` virava NaN com uuid do banco → trocado por `id`.
- `index.html` truncado pelo OneDrive quebrou build → reescrito.
- Tela branca no `/admin`: faltava importar ícone `Pencil` no DashboardPage.
- Cardápio não filtrava pelo caixa: bug de desestruturação em `fetchPublicMenu` (`session.data` quando já era `session`) → corrigido para `session`/`session.id`.
- Opção de **calda** sumiu: era controlada por ids antigos (`'fatias'`/`'potes-copos'`); agora decide pelo NOME da categoria (`temCalda(catName)` em CartDrawer e ProductModal).

---

## 4. Estado atual

**Funciona (no ar):** cardápio lendo do banco; painel completo (produtos, categorias, combos, ingredientes, ficha técnica, financeiro, visão geral, configurações); abrir/fechar caixa com conferência; vendas com baixa de estoque; PIN protegendo ações; combos no topo do cardápio; cardápio filtrando pelo caixa.

**Pendente de deploy (código pronto no disco, falta o usuário dar push):**
- Upload de foto no `ProductForm` (commit sugerido: `feat: upload de foto do produto direto no painel`).

**Aguardando o usuário:**
- Enviar as fotos reais dos produtos no chat, para Claude TRATAR (recorte de fundo, luz/cor — "qualidade estúdio" estilo Van Cake). Usuário quer as duas coisas: upload (feito) + tratamento (a fazer quando enviar arquivos).

**Estado dos caixas no banco (pode mudar):** caixa de hoje frequentemente precisa estar "aberto" pra testar o filtro do cardápio. Já houve caixas esquecidos abertos em datas passadas — ajustados manualmente via SQL.

---

## 5. Próximos passos (ordenados)

1. **Usuário:** dar `git push` da tarefa de upload de fotos (e de qualquer correção pendente). Lembrar do `del .git\index.lock` antes, se a trava aparecer.
2. **Tratar as fotos:** quando o usuário enviar os arquivos no chat, recortar fundo / ajustar para nível estúdio. Perguntar o estilo: fundo branco limpo (catálogo) vs. fundo mantido/desfocado. Devolver prontas para ele subir pelo botão de upload.
3. **Trocar o PIN** (`092207` vazou no chat) — orientar o usuário a usar a tela Configurações.
4. **Marketing com IA** — único módulo dos 5 que falta. Plano de dia gerado por IA a partir das vendas + mercado de confeitaria. (Ver seção 7 do design doc.)
5. Opcionais já mencionados: editar venda item-a-item (hoje é excluir+relançar); histórico de caixas anteriores; combo clicável que adiciona ao carrinho (hoje abre WhatsApp); otimizar painel no mobile.

---

## 6. Perguntas em aberto

- **Estilo das fotos tratadas:** fundo branco (catálogo) ou fundo natural/desfocado? (perguntar ao enviar).
- **Combo no carrinho:** o usuário quer que o combo seja adicionado ao carrinho como item (mais complexo) ou está ok abrir WhatsApp direto (atual)?
- **Domínio próprio:** usuário usa `.vercel.app` grátis. Subdomínio "de verdade" (`painel.voneis...`) só com domínio comprado — decisão futura dele.
- **Marketing IA:** custo por chamada de API e o que a IA consegue/não consegue "ver" do mercado já foi explicado; confirmar se quer construir.

---

## 7. Artefatos relevantes

**Caminho do projeto (Windows):** `C:\Users\ombar\OneDrive\Documentos\Otavio\Vera Projetos\Cardapio Vo Neis`

**Supabase project_id:** `rvxzddtvxhqomlszchdb`
**Supabase URL:** `https://rvxzddtvxhqomlszchdb.supabase.co`
**Anon key (pública, ok no front):** `sb_publishable_zoApqHm5Sz6uzV0FPEZuTA_b-X4ztNY`

**Migrações SQL** (em `supabase/migrations/`): 0001_init, 0002_seed_menudata, 0003_revoke_rls_auto_enable_execute, 0004_cash_sessions_daily_stock, 0005_sales, 0006_cash_closing, 0007_ingredients_recipes, 0008_expenses, 0009_owner_pin, 0010_delete_sale, 0011_report_functions, 0012_combos, 0013_storage_produtos.

**Tabelas principais:** categories, products, combos, combo_items, cash_sessions, daily_stock, sales, sale_items, cash_withdrawals, ingredients, recipes, expenses, app_settings. Bucket Storage: `produtos` (público).

**Arquivos-chave do front:**
- `src/App.jsx` — cardápio público (usa `fetchPublicMenu`, combos, calda via catName).
- `src/main.jsx` — rotas; `VITE_APP_MODE==='painel'` redireciona `/`→`/admin`.
- `src/lib/`: `supabase.js`, `auth.js`, `products.js` (fetchPublicMenu, groupForMenu), `cash.js`, `sales.js`, `ingredients.js`, `finance.js`, `reports.js`, `combos.js`, `pin.js`, `storage.js`.
- `src/admin/`: AdminLayout (sidebar + PinProvider), DashboardPage (caixa do dia, é o "Painel"), OpenCashScreen, NewSaleScreen, CloseCashScreen, AddProductToCash, InputModal, ProductsPage, ProductForm, CategoriesPage, CombosPage, IngredientsPage, RecipePage, FinancePage, OverviewPage, SettingsPage, PinGate.
- `src/components/`: Header, CategoryNav, MenuSection, ItemCard (tarja Esgotado), CartDrawer, ProductModal, CombosBanner.

**Comandos do usuário (no PC dele):**
```
del .git\index.lock        (se a trava aparecer)
git add -A
git commit -m "..."
git push                   (dispara deploy automático)
```

**Docs:** `docs/superpowers/specs/2026-06-15-painel-gestao-vo-neis-design.md` (visão dos 5 módulos), `docs/superpowers/plans/2026-06-15-fase0-fase1a-fundacao-produtos.md`, `PUBLICAR.md` (guia de deploy).

---

## 8. Instruções pra próxima sessão

- **Idioma:** o usuário fala **português (BR)**, informal e direto, às vezes com pressa/frustração ("faça logo", "ta feio"). Responder em PT-BR, com calma e clareza, sem jargão técnico desnecessário. Ele NÃO é desenvolvedor — explicar o "porquê" em linguagem simples.
- **Ferramentas:** há conector **Supabase** (fazer migrações/queries direto) e conector **Vercel** (ver deploys/erros). Usá-los. Para erro de runtime, pedir ao usuário o **F12 → Console** (resolveu vários bugs rápido).
- **NUNCA commitar do ambiente** (OneDrive corrompe). O usuário dá o push. Sempre dar a ele a linha de `git` pronta no fim de cada entrega.
- **Sempre verificar integridade com Read** (não bash) após editar arquivos — OneDrive trunca e quebra o build silenciosamente.
- **Não rodar `npm`/`build`/`test`** no sandbox (node_modules é Windows).
- **Estilo de trabalho aprovado:** usar AskUserQuestion para decisões de negócio; construir em blocos; criar tarefas (TaskCreate); ser honesto sobre limitações (ex: não inventar foto de produto real; avisar que PIN no chat é inseguro).
- **Cuidado com ids:** produtos/categorias usam **uuid** do banco; qualquer lógica que dependa de id antigo do `menuData.js` (texto) está errada. Calda/colher decidem por NOME de categoria.
- O usuário valoriza muito **visual bonito e profissional** — capricho nas telas importa pra ele tanto quanto a função.

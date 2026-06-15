# Painel de Gestão — Vó Neis Confeitaria

**Data:** 2026-06-15
**Status:** Design para aprovação
**Autor:** Brainstorm com o time da Vera Group / Próximos Milionários

---

## 1. Visão geral

Hoje existe um **cardápio digital** (React + Vite, sem backend): produtos fixos no código
(`menuData.js`), carrinho que envia o pedido pelo WhatsApp, e um "modo estoque" que só marca
item como disponível/indisponível no navegador (localStorage). Não há banco de dados, registro
de vendas, nem números financeiros.

O objetivo é construir um **Painel de Gestão profissional** — um pequeno ERP + BI para a
confeitaria — cobrindo cinco áreas: cadastro/estoque, vendas (PDV), financeiro, marketing e um
dashboard que reúne tudo. Os dados ficam num banco de verdade (**Supabase**) para que estoque,
faturamento e lucro sejam reais e atualizados automaticamente.

> **Decisão de escopo:** os cinco módulos são sistemas independentes. Construir todos de uma vez
> seria meses de trabalho com alto risco de retrabalho. Este documento desenha **a visão completa
> dos cinco**, mas a construção é **faseada** — cada fase entrega valor sozinha e vira base da
> próxima. As fases estão na seção 9.

### Quem usa

- **Dona/atendente (operação diária):** abre o caixa, cadastra os bolos do dia, lança vendas.
  Precisa de telas grandes, simples, à prova de erro — "que todo mundo consiga usar".
- **Gestor (você):** olha dashboard, financeiro, ROI e aprova o plano de marketing do dia.

---

## 2. Arquitetura geral

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                 │
│                                                          │
│  ┌──────────────┐   ┌──────────────────────────────┐   │
│  │ Cardápio      │   │ Painel de Gestão (/admin)     │   │
│  │ público       │   │  - Dashboard                  │   │
│  │ (já existe)   │   │  - Produtos & Estoque         │   │
│  │               │   │  - PDV / Vendas               │   │
│  │ envia pedido  │   │  - Financeiro                 │   │
│  │ p/ WhatsApp   │   │  - Marketing                  │   │
│  └──────┬───────┘   └───────────────┬──────────────┘   │
│         │                           │                    │
└─────────┼───────────────────────────┼───────────────────┘
          │                           │
          │  registra cliques         │  CRUD + leituras
          ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase                                                │
│  - Postgres (tabelas)                                    │
│  - Auth (login do painel)                                │
│  - Row Level Security (protege os dados)                 │
│  - Realtime (estoque atualiza na tela sozinho)           │
└─────────────────────────────────────────────────────────┘
```

**Stack mantida:** React 18, Vite, Tailwind, Framer Motion, Lucide (já no projeto).
**Adições:** `@supabase/supabase-js` (cliente), Recharts (gráficos), React Router (rotas do painel).

**Princípio de organização:** o cardápio público continua funcionando como está. O painel é uma
área nova protegida por login, em `/admin`. Os produtos deixam de ser hardcoded e passam a vir do
Supabase — o próprio cardápio público lê do banco, então editar um preço no painel reflete no
cardápio automaticamente.

> ✅ **DECIDIDO:** o cardápio público lê os produtos do Supabase (fonte única). Editar preço/foto no
> painel reflete no cardápio automaticamente.
>
> ✅ **DECIDIDO (acesso):** **um único login** — só você (e quem tiver sua senha). Sem perfis
> separados de atendente. O PIN atual `1234` é substituído por login Supabase de verdade.

---

## 3. Modelo de dados (Supabase / Postgres)

Tabelas centrais. Nomes em inglês por convenção; rótulos na tela em português.

### 3.1 Produtos e composição

**`products`** — cada item vendável (uma fatia de bolo, um pote, um bolo inteiro).
| campo | tipo | descrição |
|---|---|---|
| id | uuid | PK |
| name | text | "Maracujá com Chocolate" |
| category_id | uuid | FK → categories |
| price | numeric | preço de venda |
| cost | numeric | **custo calculado** a partir da ficha técnica (gerado pelo sistema) |
| unit | text | 'fatia', 'pote', 'inteiro', 'cento' |
| image_url | text | foto (opcional) |
| description | text | descrição do cardápio |
| active | bool | aparece no cardápio? |
| created_at | timestamptz | |

**`categories`** — Fatias, Potes & Copos, Bolos Inteiros, Doces, etc.
(id, name, emoji, sort_order)

**`combos`** — conjuntos com preço promocional (ex.: "3 fatias por R$ 50").
(id, name, price, active)

**`combo_items`** — o que entra em cada combo.
(combo_id, product_id, quantity)

> ✅ **DECIDIDO:** o custo do produto vem de uma **ficha técnica** (receita). Você cadastra os
> ingredientes uma vez (com preço de compra) e, em cada produto, informa **quanto de cada
> ingrediente entra**. O sistema calcula o `cost` automaticamente (soma dos ingredientes da
> receita). Quando o preço de um ingrediente muda, o custo de todos os produtos que o usam é
> recalculado. Isso dá margem **real**, não chutada.

**`ingredients`** — insumos: farinha, ovos, leite ninho, embalagem, etc.
| campo | tipo | descrição |
|---|---|---|
| id | uuid | |
| name | text | "Leite Ninho 400g" |
| purchase_unit | text | unidade de compra: 'lata', 'kg', 'dúzia', 'pacote' |
| purchase_price | numeric | quanto custou a unidade de compra |
| purchase_qty | numeric | quanto vem na unidade (ex.: 400 g) |
| base_unit | text | unidade de uso na receita: 'g', 'ml', 'un' |
| cost_per_base_unit | numeric | **gerado**: preço por g/ml/un (pra calcular a receita) |

**`recipes`** — ficha técnica: liga produto → ingredientes e a quantidade usada de cada um.
| campo | tipo | descrição |
|---|---|---|
| id | uuid | |
| product_id | uuid | FK |
| ingredient_id | uuid | FK |
| quantity | numeric | quanto desse ingrediente entra (na base_unit) |

> O `cost` do produto = soma de `quantity × cost_per_base_unit` de cada linha da receita.
> Recalculado automaticamente quando muda o preço de um ingrediente ou a receita.

### 3.2 Estoque e caixa do dia

**`daily_stock`** — quanto de cada produto foi produzido/disponibilizado num dia.
| campo | tipo | descrição |
|---|---|---|
| id | uuid | |
| business_date | date | o dia |
| product_id | uuid | FK |
| qty_initial | int | quantos foram feitos hoje |
| qty_sold | int | vendidos (atualiza com as vendas) |
| qty_remaining | int | sobra (gerado: initial − sold) |

**`cash_sessions`** — abertura/fechamento de caixa.
(id, business_date, opened_at, closed_at, opening_notes, status)

### 3.3 Vendas

**`sales`** — cada venda (uma sacola/cliente).
| campo | tipo | descrição |
|---|---|---|
| id | uuid | |
| cash_session_id | uuid | FK |
| sold_at | timestamptz | |
| total | numeric | |
| payment_method | text | 'dinheiro','pix','cartão' |
| channel | text | 'balcão','whatsapp','ifood'... |

**`sale_items`** — linhas de cada venda.
(id, sale_id, product_id, qty, unit_price, unit_cost) — guardamos preço e custo **no momento da
venda**, pra que relatórios históricos não mudem se o preço futuro mudar.

### 3.4 Financeiro

**`expenses`** — gastos (ingredientes, gás, embalagem, marketing pago, etc.).
(id, expense_date, category, description, amount, payment_method)

**`expense_categories`** — Insumos, Marketing, Operacional, Equipamento...

### 3.5 Marketing

**`marketing_events`** — eventos do site/cardápio (clique no cardápio, clique no WhatsApp, abertura
de produto). Alimentado pelo próprio site.
(id, event_type, product_id?, occurred_at, session_id, source)

**`marketing_metrics`** — métricas externas lançadas manualmente ou via integração (seguidores
Insta, alcance, cliques no link da bio).
(id, metric_date, source, metric_name, value)

**`marketing_actions`** — o "plano do dia": ações sugeridas pelo sistema para você **aprovar**.
(id, action_date, title, rationale, status['sugerido','aprovado','recusado','feito'], result_notes)

> ✅ **DECIDIDO (marketing por IA):** o "plano do dia" é gerado por **IA**. A IA recebe um resumo
> dos seus dados (vendas recentes, produtos mais clicados vs. mais vendidos, dia da semana,
> sazonalidade, dados do Insta lançados) + conhecimento geral do **mercado de confeitaria** e
> devolve 2–4 ações sugeridas com justificativa, para você aprovar. **Limites importantes a saber:**
> a IA não "navega" o mercado em tempo real nem lê concorrentes automaticamente — ela usa o
> conhecimento que já tem sobre confeitaria + os SEUS números. Cada geração tem um pequeno custo de
> API. Os dados do Insta entram **manualmente** numa tela simples (integração direta com a API do
> Instagram é fase futura, exige conta business + aprovação da Meta).

---

## 4. Módulo 1 — Produtos, Combos & Estoque

**Objetivo:** ser a fonte única de produtos e controlar o estoque do dia.

### Telas
- **Lista de produtos** — busca, filtro por categoria, editar preço/custo/foto, ativar/desativar.
  Mostra a **margem** (preço − custo) e o **% de lucro** em cada linha.
- **Editar produto** — nome, categoria, preço, custo, unidade, foto, descrição.
- **Combos** — montar combos escolhendo produtos e quantidades, definir preço promocional.
- **Abrir caixa / Bolos do dia** — tela grande e interativa: para cada produto, a atendente digita
  "quantos fiz hoje". Botões de + / − bem grandes. Salva como `daily_stock` do dia e abre a
  `cash_session`. Essa é a tela "que todo mundo consegue usar".

### Migração inicial
Importar os ~50 produtos que já estão no `menuData.js` para a tabela `products` (script único),
para não recadastrar tudo na mão.

---

## 5. Módulo 2 — PDV / Lançamento de Vendas

**Objetivo:** registrar vendas rápido e dar baixa no estoque automaticamente.

### Telas
- **Lançar venda (PDV):** grade de produtos do dia (só os com estoque). Toca no produto → entra na
  sacola → escolhe forma de pagamento → confirma. Ao confirmar:
  - cria `sale` + `sale_items`
  - **baixa o estoque** (`daily_stock.qty_sold += qty`) automaticamente
  - via **Supabase Realtime**, a contagem de estoque some/atualiza em todas as telas abertas
- **Vendas do dia:** lista das vendas, total do dia, ticket médio, ranking de mais vendidos.
- **Fechar caixa:** resumo do dia (total vendido, por forma de pagamento, sobra de estoque) e
  fecha a `cash_session`.

> ✅ **DECIDIDO (fluxo WhatsApp):** o cliente fala com vocês no WhatsApp, vocês mandam ele para o
> cardápio, e **vocês finalizam a venda no PDV** — que registra a venda e dá baixa no estoque. Sem
> automação WhatsApp→venda; o lançamento no PDV é o passo que fecha tudo. Vale tanto para venda de
> balcão quanto para pedido que veio pelo WhatsApp.

---

## 6. Módulo 3 — Financeiro

**Objetivo:** transformar vendas e gastos em faturamento, lucro e ROI.

### Telas
- **Gastos:** lançar despesas por categoria; lista e total por período.
- **Resultado (DRE simplificada):** por dia/semana/mês →
  Faturamento − Custo dos produtos vendidos (CMV, vem do `unit_cost` das vendas) − Despesas =
  **Lucro**. Mostra margem %.
- **Lucro por produto:** ranking de quais produtos dão mais lucro (não só mais venda).
- **ROI:** retorno sobre investimento, principalmente para marketing —
  (lucro atribuído ao período de campanha − gasto de marketing) ÷ gasto de marketing.

> ⚠️ **SUPOSIÇÃO (ROI):** ROI de marketing exige ligar gasto de campanha a vendas do período.
> Versão inicial: ROI **por período** (gastei X em marketing na semana, lucro foi Y). Atribuição
> por campanha específica (qual post gerou qual venda) é fase futura.

---

## 7. Módulo 4 — Marketing

**Objetivo:** acompanhar engajamento e receber um **plano de ações do dia para aprovar**.

### Telas
- **Painel de engajamento:** cliques no cardápio, produtos mais clicados vs. mais vendidos,
  cliques no botão WhatsApp, por dia. (Dados vêm do próprio site via `marketing_events`.)
- **Dados do Insta (entrada manual):** tela simples para lançar seguidores, alcance, cliques na
  bio do dia/semana.
- **Plano do dia (aprovação):** o sistema gera 2–4 ações sugeridas com base nos dados anteriores,
  cada uma com uma justificativa ("por quê"). Você **aprova, recusa ou marca como feita**. Ex.:
  - "Fazer story do *Maracujá com Chocolate* — teve 40 cliques essa semana mas poucas vendas."
  - "Promoção fim de tarde na terça — terças vendem 30% menos."

> ⚠️ **SUPOSIÇÃO:** as sugestões são geradas por **regras simples sobre os dados** (não IA/LLM no
> começo). Dá pra evoluir para sugestões geradas por IA numa fase futura. Confirmar se a abordagem
> por regras atende o que você imagina por "monta um plano que pode dar certo".

---

## 8. Módulo 5 — Dashboard

**Objetivo:** visão executiva numa tela só.

- **Cards de topo:** faturamento de hoje, lucro de hoje, ticket médio, nº de vendas.
- **Gráficos:** faturamento dos últimos 30 dias, top produtos, vendas por forma de pagamento,
  estoque atual (o que ainda tem pra vender hoje).
- **Atalhos:** abrir caixa, lançar venda, ver plano de marketing.
- **Comparativos:** hoje vs. ontem, semana vs. semana passada.

---

## 9. Plano de fases (ordem de construção)

Cada fase é entregável e usável sozinha.

| Fase | Entrega | Por que nesta ordem |
|---|---|---|
| **0 — Fundação** | Supabase configurado (tabelas, auth, RLS), `@supabase/supabase-js` no projeto, login único do painel, layout base do `/admin`. | Tudo depende do banco e do login. |
| **1a — Produtos** | Cadastro de produtos/categorias/combos; migração do `menuData.js`; cardápio público passa a ler do banco. | É a fonte de dados de todo o resto. |
| **1b — Ficha técnica** | Cadastro de ingredientes + receita por produto; custo e margem calculados automaticamente. | Dá margem real; precisa dos produtos da 1a. |
| **1c — Estoque do dia** | Tela "bolos do dia / abrir caixa" grande e interativa. | Precisa dos produtos da 1a. |
| **2 — PDV & Vendas** | Lançar venda, baixa de estoque automática (Realtime), vendas do dia, fechar caixa. | Precisa dos produtos/estoque da Fase 1. |
| **3 — Financeiro** | Gastos, DRE simplificada, lucro por produto, ROI por período. | Precisa das vendas (Fase 2) e custos (Fase 1). |
| **4 — Marketing** | Captura de cliques no site, entrada de dados do Insta, plano do dia para aprovar. | Usa vendas + cliques já existentes. |
| **5 — Dashboard** | Visão executiva reunindo tudo. | Faz sentido por último, quando há dados reais. |

> Cada fase, quando chegar a vez, ganha seu **próprio spec detalhado + plano de implementação**.
> Este documento é o mapa geral; ele não desce ao detalhe de implementação de cada fase.

---

## 10. Custos e considerações

- **Supabase:** plano gratuito atende o começo (até 500 MB de banco, 50k usuários auth). Cresce
  bem se precisar.
- **Hospedagem:** o projeto já está na Vercel — continua lá.
- **Segurança:** painel protegido por login Supabase + Row Level Security. O PIN atual (`1234`)
  some; vira login de verdade.
- **Offline:** ✅ **DECIDIDO** — versão inicial é **100% online** (exige internet na loja). O plano B
  offline fica como **melhoria de fase futura**, para não atrasar a entrega nem trazer o recurso
  mais arriscado (sincronização e conflito de estoque) logo de cara.

---

## 11. Decisões tomadas

Todas confirmadas em 2026-06-15:

1. ✅ **Cardápio público lê do Supabase** — fonte única de verdade. — seção 2.
2. ✅ **Custo por ficha técnica de ingredientes** — você cadastra ingredientes e a receita de cada
   produto; o sistema calcula custo e margem. — seção 3.1.
3. ✅ **WhatsApp → cardápio → finaliza no PDV** — vocês fecham a venda manualmente no PDV, que dá
   baixa no estoque. — seção 5.
4. ✅ **Marketing por IA** — IA analisa seus dados + mercado de confeitaria e sugere o plano do dia
   para aprovação. Dados do Insta lançados manualmente. — seção 7.
5. ✅ **100% online** na versão inicial; offline como fase futura. — seção 10.
6. ✅ **Login único** — só você (e quem tiver sua senha). — seção 2.

### Impacto no plano de fases

A escolha da **ficha técnica de ingredientes** (item 2) aumenta o escopo da Fase 1: além de
produtos, ela passa a incluir o cadastro de **ingredientes** e **receitas**. Para manter cada
entrega pequena e usável, a Fase 1 fica subdividida:

- **Fase 1a — Produtos & Categorias:** cadastro, preço, foto, migração do `menuData.js`, cardápio
  lendo do banco. (Custo entra manualmente como provisório até a 1b.)
- **Fase 1b — Ficha técnica:** cadastro de ingredientes + receita por produto; custo e margem
  passam a ser calculados automaticamente.
- **Fase 1c — Estoque do dia / abrir caixa:** tela grande e interativa dos "bolos do dia".

> **Próximo passo:** partir para o **plano de implementação da Fase 0 (fundação Supabase) + Fase 1a
> (produtos)**, usando a skill de planejamento.

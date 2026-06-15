# Como publicar — Cardápio + Painel (Vercel)

Seu projeto está no GitHub (`Prime-Otavio/CardapioVoNeis`) ligado à Vercel.
Então **todo `git push` atualiza o site sozinho.** São duas etapas.

---

## ETAPA 1 — Atualizar o cardápio (que já existe)

Tudo o que construímos (produtos vindos do banco, sem engrenagem, painel) precisa subir.

### 1.1 — Commitar e enviar pro GitHub
No terminal, na pasta do projeto:

```
git add .
git commit -m "feat: painel admin, produtos no Supabase, fluxo de caixa"
git push
```

Isso já dispara um deploy automático do cardápio na Vercel.

### 1.2 — Adicionar as variáveis do Supabase na Vercel (uma vez só)
O site precisa das chaves do banco pra funcionar publicado.

1. Acesse vercel.com → projeto **cardapiovoneis**
2. **Settings** → **Environment Variables**
3. Adicione estas duas (valores estão no seu arquivo `.env.local`):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://rvxzddtvxhqomlszchdb.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `sb_publishable_zoApqHm5Sz6uzV0FPEZuTA_b-X4ztNY` |

   Marque os três ambientes (Production, Preview, Development).
4. Depois de salvar, vá em **Deployments** → no último deploy clique nos `...` → **Redeploy**
   (pra ele pegar as variáveis novas).

Pronto: **cardapiovoneis.vercel.app** mostra o cardápio lendo do banco.

---

## ETAPA 2 — Criar o site separado do painel

Mesmo código, segundo endereço. Importando o mesmo GitHub num novo projeto Vercel.

1. Acesse vercel.com → **Add New...** → **Project**
2. Em **Import Git Repository**, escolha **`Prime-Otavio/CardapioVoNeis`** (o mesmo do cardápio)
3. **Project Name:** `painel-voneis`  → o endereço será `painel-voneis.vercel.app`
4. **Framework Preset:** Vite (deve detectar sozinho)
5. Antes de clicar em Deploy, abra **Environment Variables** e adicione **TRÊS**:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://rvxzddtvxhqomlszchdb.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `sb_publishable_zoApqHm5Sz6uzV0FPEZuTA_b-X4ztNY` |
   | `VITE_APP_MODE` | `painel` |

   > A `VITE_APP_MODE = painel` é o que faz esse endereço abrir **direto no painel**
   > (login do `/admin`) em vez do cardápio.
6. Clique em **Deploy**.

Pronto: **painel-voneis.vercel.app** abre direto o login do painel.

---

## Resumo dos dois sites

| Endereço | O que mostra | Variáveis |
|---|---|---|
| cardapiovoneis.vercel.app | Cardápio (cliente) | URL + ANON_KEY |
| painel-voneis.vercel.app | Painel de gestão (você) | URL + ANON_KEY + APP_MODE=painel |

Os dois usam o mesmo código (mesmo GitHub) e o mesmo banco (Supabase Vo Neis).
Cada `git push` atualiza os dois automaticamente.

---

## Falta criar seu LOGIN do painel (uma vez)

Sem isso, o `/admin` não deixa entrar.

1. Supabase → projeto **Vo Neis** → **Authentication** → **Users**
2. **Add user** → **Create new user**
3. Email: `veragroup.ia@gmail.com` · Senha: (você escolhe e anota)
4. Marque **Auto Confirm User** → **Create user**

Esse e-mail + senha é o login do painel.

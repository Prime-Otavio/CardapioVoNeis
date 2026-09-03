# Publicar do zero — GitHub + Vercel numa conta sua

Guia para colocar o **cardápio** e o **painel** no ar em endereços que você controla,
sem depender da conta Vercel de terceiros onde os projetos estão hoje.

São **dois sites** saindo do **mesmo código** e do **mesmo banco**. A única diferença
entre eles é uma variável de ambiente.

---

## Antes de começar, junte estas 3 informações

Você vai colar isso na Vercel mais adiante:

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://rvxzddtvxhqomlszchdb.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_zoApqHm5Sz6uzV0FPEZuTA_b-X4ztNY` |
| `VITE_APP_MODE` | `painel` — **só no site do painel** |

> A `ANON_KEY` é pública por design: ela vai dentro do JavaScript que o navegador
> baixa, então qualquer visitante consegue lê-la. Quem protege os dados é o RLS no
> Supabase, não o segredo dessa chave. Pode colar sem medo.
>
> O que **nunca** pode ir para a Vercel nem para o código: a `service_role key` do
> Supabase e as credenciais do iFood. Essas ficam só nos secrets do Supabase.

---

## ETAPA 1 — O código no GitHub

O repositório `Prime-Otavio/CardapioVoNeis` **já é seu** e já tem tudo. Se você vai
continuar usando ele, **pule para a Etapa 2** — não precisa subir arquivo nenhum.

Faça esta etapa só se quiser um repositório novo, do zero.

### 1.1 Criar o repositório

1. Entre no github.com com a sua conta
2. Botão **+** (canto superior direito) → **New repository**
3. **Repository name:** `cardapio-vo-neis` (ou o nome que preferir)
4. Marque **Private** se não quiser o código visível para qualquer um
5. **Não** marque "Add a README" — o projeto já tem um
6. **Create repository**

### 1.2 Subir os arquivos

Use o ZIP `cardapio-vo-neis.zip` que veio junto com este guia.

**Pelo navegador (funciona no celular, mas é chato com muitos arquivos):**

1. Descompacte o ZIP no seu computador
2. No repositório vazio, clique em **uploading an existing file**
3. Arraste **todo o conteúdo** da pasta descompactada — não a pasta, o conteúdo
4. Escreva uma mensagem qualquer e clique em **Commit changes**

**Pelo computador, com Git (mais confiável):**

```
cd caminho/da/pasta/descompactada
git init
git add .
git commit -m "codigo inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/cardapio-vo-neis.git
git push -u origin main
```

> ⚠️ O ZIP **não** contém `node_modules` nem `dist`, e isso está certo — a Vercel
> gera os dois sozinha. Também não contém nenhuma chave: o `.env.example` é só um
> modelo em branco.

---

## ETAPA 2 — O site do CARDÁPIO na Vercel

1. Entre em **vercel.com** e crie/entre com a **sua** conta
   (o jeito mais simples é **Continue with GitHub**, aí ela já enxerga seus repos)
2. **Add New...** → **Project**
3. Em **Import Git Repository**, escolha o repositório do projeto
   - Se ele não aparecer: **Adjust GitHub App Permissions** e libere o acesso a ele
4. **Project Name:** `cardapio-voneis` → o endereço vai ser `cardapio-voneis.vercel.app`
5. **Framework Preset:** deve detectar **Vite** sozinho. Se não detectar, escolha Vite.
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Abra **Environment Variables** e adicione **DUAS**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. **Deploy** e espere terminar

---

## ETAPA 3 — O site do PAINEL na Vercel

Mesmo repositório, segundo projeto. É o `VITE_APP_MODE=painel` que faz este endereço
abrir direto no login do painel em vez do cardápio.

1. **Add New...** → **Project**
2. Escolha **o mesmo repositório** de novo
3. **Project Name:** `painel-voneis` → `painel-voneis.vercel.app`
4. Em **Environment Variables**, adicione **TRÊS**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_MODE` = `painel`
5. **Deploy**

---

## ETAPA 4 — Deixar os previews abertos (o problema que te travou)

Por padrão a Vercel **protege os previews com login da conta dela**. É por isso que
você não conseguiu abrir os links de preview: eles pediam login numa conta que não é
sua. O site de produção não tem essa trava — só os previews.

Se quiser conseguir abrir preview de branch no celular, em **cada um dos dois projetos**:

1. **Settings** → **Deployment Protection**
2. Em **Vercel Authentication**, mude para **Disabled**
3. **Save**

> Os nomes dessa tela mudam de tempos em tempos. A ideia é a mesma: desligar a
> exigência de login para ver os deploys de preview.
>
> Só desligue se não te incomodar que qualquer pessoa com o link veja uma versão
> em teste. O painel continua pedindo e-mail e senha de qualquer jeito — desligar
> isso não abre o painel para ninguém.

---

## ETAPA 5 — Conferir que funcionou

1. Abra o endereço do **cardápio**. Os produtos têm que aparecer.
   - Página em branco ou lista vazia → veja "Se der problema" abaixo.
2. Abra o endereço do **painel**. Tem que cair na tela de login.
3. Entre com `veragroup.ia@gmail.com` e sua senha.
   - Esqueceu a senha? Supabase → **Authentication** → **Users** → nos `...` do seu
     usuário → **Send password recovery**.
4. Vá em **Balcão**, toque em **Esgotou** num produto qualquer.
5. Recarregue o cardápio: aquele produto tem que aparecer riscado/indisponível.

Se o passo 5 funcionar, está tudo ligado de ponta a ponta.

---

## Se der problema

**Cardápio abre em branco.**
Quase sempre é variável de ambiente. As variáveis do Vite são **coladas no código na
hora do build** — adicionar depois não muda o site que já subiu. Vá em
**Deployments** → no último deploy, `...` → **Redeploy**.

**Página em branco ao abrir `/admin` direto.**
É o roteamento de SPA. O arquivo `vercel.json` do projeto já resolve isso; confirme
que ele foi para o GitHub junto (arquivos que começam com ponto e arquivos de
configuração às vezes ficam de fora quando se arrasta pasta no navegador).

**"Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não definidas".**
Faltou uma das duas, ou o nome está diferente. Tem que ser exatamente esse, maiúsculas
inclusive, com o prefixo `VITE_`.

**O painel abre o cardápio em vez do login.**
Faltou `VITE_APP_MODE=painel` nesse projeto — ou faltou o redeploy depois de adicioná-la.
Você também sempre pode chegar no painel pela URL `/admin`.

**Login diz que a senha não confere e você tem certeza que está certa.**
Confira se o usuário existe em Supabase → Authentication → Users, e se está confirmado.

---

## Depois, quando estiver tudo no ar

- **Domínio próprio** (ex.: `cardapio.voneis.com.br`): no projeto → **Settings** →
  **Domains** → **Add**. A Vercel mostra o que apontar no seu provedor de domínio.
- **Os projetos antigos**, na conta de terceiro, continuam ligados a este mesmo
  repositório e vão continuar recebendo deploy a cada push. Quando os seus estiverem
  funcionando, vale pedir para desconectarem ou apagarem aqueles — senão ficam dois
  pares de sites vivos e é fácil divulgar o endereço errado.
- **Daí em diante**, todo push no GitHub atualiza os dois sites sozinho. Não precisa
  mexer na Vercel de novo.

# Deploy na Vercel (modo SPA estático)

Este projeto suporta **dois alvos de build**:

- **Lovable / Cloudflare Workers** (padrão, com SSR + server functions) — usado quando você publica pela Lovable.
- **Vercel / SPA estático** (sem SSR) — ativado quando `BUILD_TARGET=vercel` está presente.

A coexistência é segura: nenhum dos dois pipelines interfere no outro.

---

## ⚠️ Limitação importante do build SPA

O build da Vercel é **client-side puro**, então:

- ✅ **Funciona normalmente:** páginas, login, inspeções em tempo real, agendamento, dashboard — tudo que conversa direto com o Supabase pelo client.
- ❌ **Fica indisponível na Vercel:** gerenciamento de administradores no painel admin (criar / listar / remover / resetar senha de admins). Essa funcionalidade depende de `service_role` e só roda no build SSR (Lovable / Cloudflare). Se um usuário tentar usar essas ações na versão Vercel, verá uma mensagem informando que o recurso só está disponível na versão publicada pela Lovable.

Se você precisa desses recursos administrativos em produção, **continue publicando pela Lovable**.

---

## 1. Conectar o repositório

1. No editor da Lovable, abra **Connectors → GitHub** e crie/conecte o repositório.
2. Na Vercel, clique em **Add New → Project** e importe esse repositório do GitHub.

## 2. Configurações do projeto na Vercel

Tudo já está no `vercel.json`. Na tela "Configure Project" da Vercel, deixe como está:

| Campo | Valor |
|---|---|
| **Framework Preset** | `Other` |
| **Build Command** | (em branco — vem do `vercel.json`: `bun run build:vercel`) |
| **Output Directory** | (em branco — vem do `vercel.json`: `dist`) |
| **Install Command** | (em branco — vem do `vercel.json`: `bun install`) |
| **Node.js Version** | 20.x ou superior |

## 3. Variáveis de ambiente

Em **Project → Settings → Environment Variables**, adicione (Production, Preview e Development):

```
VITE_SUPABASE_URL=https://jlvcavgpgweklgrrjkms.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<seu publishable key — mesmo do .env atual>
VITE_SUPABASE_PROJECT_ID=jlvcavgpgweklgrrjkms
```

> **Não** configure `SUPABASE_SERVICE_ROLE_KEY` na Vercel. Como o build é SPA, qualquer variável seria exposta no bundle do cliente. As funções administrativas que precisam dela só rodam no build da Lovable.

## 4. Como o switch funciona

- `vite.config.ts` detecta `BUILD_TARGET=vercel` (ou `VERCEL=1`) e troca:
  - usa `index.html` na raiz como entry HTML (em vez do shell SSR);
  - bootstrap em `src/spa/entry.tsx` monta o `RouterProvider` do TanStack Router em modo client;
  - aliases substituem `@tanstack/react-start` e `@/server/admins.functions` por shims em `src/spa/` que evitam vazar código de servidor;
  - emite tudo em `dist/` (SPA estático).
- `vercel.json` aponta `outputDirectory: "dist"` e tem rewrite `/(.*) → /` para que rotas profundas (refresh em `/admin`, links diretos) sejam servidas pelo `index.html`.

## 5. Deploy

Após configurar as env vars, clique em **Deploy** na Vercel. Cada `git push` na branch principal dispara um novo deploy automaticamente.

---

## Arquivos relevantes

- **`vite.config.ts`** — branch SPA quando `BUILD_TARGET=vercel`.
- **`vercel.json`** — `outputDirectory: dist` + rewrite SPA.
- **`index.html`** — entry HTML usado APENAS pelo build Vercel (ignorado pelo TanStack Start no build Lovable).
- **`src/spa/entry.tsx`** — bootstrap React/Router para SPA.
- **`src/spa/react-start-shim.ts`** — shim no-op de `createServerFn` / `createMiddleware` / `useServerFn`.
- **`src/spa/admins.functions.stub.ts`** — stub das funções administrativas que jogam mensagem clara em produção SPA.
- **`.vercelignore`** — exclui `wrangler.jsonc` e artefatos Cloudflare do upload Vercel.
- **`package.json`** — scripts `build:vercel` e `vercel-build` (este último o nome convencional que a Vercel detecta).

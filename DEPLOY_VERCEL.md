# Deploy na Vercel

Este projeto suporta **dois alvos de build**:

- **Lovable / Cloudflare Workers** (padrão) — usado quando você publica pela Lovable.
- **Vercel / Node.js** — ativado quando a env `BUILD_TARGET=vercel` está presente.

A coexistência é segura: nenhum dos dois pipelines interfere no outro.

---

## 1. Conectar o repositório

1. No editor da Lovable, abra **Connectors → GitHub** e crie/conecte o repositório.
2. Na Vercel, clique em **Add New → Project** e importe esse repositório do GitHub.

## 2. Configurações do projeto na Vercel

Na tela "Configure Project" da Vercel:

| Campo | Valor |
|---|---|
| **Framework Preset** | `Other` (deixe a Vercel detectar pelo `vercel.json`) |
| **Build Command** | (deixe em branco — usa o do `vercel.json`: `bun run build:vercel`) |
| **Output Directory** | (deixe em branco — usa o do `vercel.json`: `.vercel/output`) |
| **Install Command** | (deixe em branco — usa o do `vercel.json`: `bun install`) |
| **Node.js Version** | 20.x ou superior |

> O `vercel.json` na raiz já define todos esses valores. Você só precisa garantir que a Vercel use Node 20+.

## 3. Variáveis de ambiente

Vá em **Project → Settings → Environment Variables** e adicione (todas como *Production*, *Preview* e *Development*):

### Públicas (expostas no bundle do client)
```
VITE_SUPABASE_URL=https://jlvcavgpgweklgrrjkms.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<seu publishable key — mesmo do .env atual>
VITE_SUPABASE_PROJECT_ID=jlvcavgpgweklgrrjkms
```

### Privadas (server-only, usadas em server functions)
```
SUPABASE_URL=https://jlvcavgpgweklgrrjkms.supabase.co
SUPABASE_PUBLISHABLE_KEY=<mesmo valor do publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key — pegar no painel Cloud da Lovable>
```

> ⚠️ **Nunca** prefixe `SUPABASE_SERVICE_ROLE_KEY` com `VITE_`. Isso exporia a chave no bundle do navegador.

## 4. Build target

O script `bun run build:vercel` define `BUILD_TARGET=vercel`, que é lido em `vite.config.ts`. Quando essa flag estiver ativa, é necessário trocar o preset SSR do TanStack Start de `cloudflare` para `vercel`.

### ⚠️ Adaptação manual necessária no `vite.config.ts`

Hoje o `vite.config.ts` usa `@lovable.dev/vite-tanstack-config`, que injeta o preset Cloudflare automaticamente. Para Vercel, substitua por uma config explícita quando `BUILD_TARGET === "vercel"`:

```ts
// vite.config.ts
import { defineConfig as defineLovable } from "@lovable.dev/vite-tanstack-config";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default process.env.BUILD_TARGET === "vercel"
  ? defineConfig({
      plugins: [
        tsconfigPaths(),
        tailwindcss(),
        tanstackStart({ target: "vercel" }),
        viteReact(),
      ],
    })
  : defineLovable();
```

**Por que não fizemos isso direto?** Porque editar o `vite.config.ts` para incluir o branch Vercel é uma decisão de arquitetura — você pode preferir um repositório dedicado a Vercel ou continuar 100% na Lovable. Quando quiser ativar de fato o build na Vercel, edite o `vite.config.ts` conforme acima.

## 5. Deploy

Após configurar as env vars, clique em **Deploy** na Vercel. Cada `git push` para a branch principal dispara um novo deploy automaticamente.

---

## Resumo dos arquivos adicionados

- **`vercel.json`** — comandos de build/install e diretório de output para a Vercel.
- **`.vercelignore`** — exclui `wrangler.jsonc` e artefatos Cloudflare do upload Vercel.
- **`package.json`** — novos scripts `build:vercel` e `vercel-build` (este último é o nome convencional que a Vercel detecta automaticamente).
- **`cross-env`** — devDependency que permite setar `BUILD_TARGET=vercel` em qualquer SO.

Nenhum desses arquivos afeta o build atual da Lovable.

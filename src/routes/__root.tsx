import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Residencial Cores de Outono — Manutenção" },
      { name: "description", content: "Sistema de controle de manutenção de exaustores do Residencial Cores de Outono." },
      { property: "og:title", content: "Residencial Cores de Outono — Manutenção" },
      { name: "twitter:title", content: "Residencial Cores de Outono — Manutenção" },
      { property: "og:description", content: "Sistema de controle de manutenção de exaustores do Residencial Cores de Outono." },
      { name: "twitter:description", content: "Sistema de controle de manutenção de exaustores do Residencial Cores de Outono." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/069ade91-9309-4afc-b327-db7c309838b0/id-preview-61f416fb--4724eeb3-60b3-44c5-8451-640f7b03ed1e.lovable.app-1776704215984.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/069ade91-9309-4afc-b327-db7c309838b0/id-preview-61f416fb--4724eeb3-60b3-44c5-8451-640f7b03ed1e.lovable.app-1776704215984.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
      <Analytics />
    </>
  );
}

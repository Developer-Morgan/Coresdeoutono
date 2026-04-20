import { Link, useLocation } from "@tanstack/react-router";
import { Wind, ClipboardList, Home, Shield } from "lucide-react";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Início", icon: Home },
  { to: "/agendar", label: "Agendar Vistoria", icon: ClipboardList },
  { to: "/admin", label: "Administração", icon: Shield },
];

export function SiteLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="bg-[var(--gradient-header)] text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-md bg-accent/90 flex items-center justify-center shadow-[var(--shadow-soft)]">
            <Wind className="h-6 w-6 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight">Residencial Cores de Outono</h1>
            <p className="text-xs text-primary-foreground/70">Programa de Manutenção de Exaustores</p>
          </div>
        </div>
        {/* Tabs */}
        <nav className="bg-primary/95 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 flex">
            {tabs.map((t) => {
              const active = location.pathname === t.to || (t.to !== "/" && location.pathname.startsWith(t.to));
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium tracking-wide uppercase transition-colors border-b-2 ${
                    active
                      ? "border-accent text-primary-foreground bg-white/5"
                      : "border-transparent text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-border bg-card mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Residencial Cores de Outono</span>
          <span className="text-xs">Elaborado por <span className="font-semibold text-foreground">Charles</span></span>
        </div>
      </footer>
    </div>
  );
}

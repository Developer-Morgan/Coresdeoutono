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
      <header className="bg-[var(--gradient-header)] text-primary-foreground sticky top-0 z-30 shadow-[var(--shadow-soft)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-5 flex items-center gap-3 sm:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-accent/90 flex items-center justify-center shadow-[var(--shadow-soft)] shrink-0">
            <Wind className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-semibold tracking-tight leading-tight truncate">Residencial Cores de Outono</h1>
            <p className="text-[10px] sm:text-xs text-primary-foreground/70 leading-tight">Programa de Manutenção de Exaustores</p>
          </div>
        </div>
        {/* Tabs — desktop / tablet */}
        <nav className="hidden sm:block bg-primary/95 border-t border-white/5">
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 sm:pb-8">
        {children}
      </main>

      {/* Bottom nav — mobile only, very visible */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-primary text-primary-foreground border-t border-white/10 shadow-[0_-4px_12px_rgba(0,0,0,0.15)]">
        <div className="grid grid-cols-3" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {tabs.map((t) => {
            const active = location.pathname === t.to || (t.to !== "/" && location.pathname.startsWith(t.to));
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                  active
                    ? "text-accent bg-white/5"
                    : "text-primary-foreground/70 active:bg-white/10"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-accent" : ""}`} />
                <span className="leading-none">{t.label}</span>
                {active && <span className="block h-0.5 w-8 bg-accent rounded-full" />}
              </Link>
            );
          })}
        </div>
      </nav>

      <footer className="hidden sm:block border-t border-border bg-card mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Residencial Cores de Outono</span>
          <span className="text-xs">Elaborado por <span className="font-semibold text-foreground">Charles</span></span>
        </div>
      </footer>
    </div>
  );
}

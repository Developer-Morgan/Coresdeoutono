import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LayoutDashboard, Settings, Building2, FileBarChart, LogOut, Users, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: () => (
    <SiteLayout>
      <AdminGate />
    </SiteLayout>
  ),
});

function AdminGate() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      checkAdmin(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      checkAdmin(data.session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function checkAdmin(s: any) {
    if (!s?.user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id).eq("role", "admin").maybeSingle();
    setIsAdmin(!!data);
    setLoading(false);
  }

  if (loading) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  if (!session) return <Login />;
  if (!isAdmin) return <NotAdmin email={session.user.email} />;
  return <AdminPanel />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
  }

  return (
    <Card className="max-w-md mx-auto p-8">
      <h2 className="text-2xl font-bold text-foreground">Acesso administrativo</h2>
      <p className="text-sm text-muted-foreground mt-1">Entre com suas credenciais para gerenciar o sistema.</p>
      <form onSubmit={signIn} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pwd">Senha</Label>
          <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full">{loading ? "Entrando..." : "Entrar"}</Button>
      </form>
    </Card>
  );
}

function NotAdmin({ email }: { email: string }) {
  return (
    <Card className="max-w-md mx-auto p-8 text-center">
      <h2 className="text-xl font-bold text-foreground">Acesso negado</h2>
      <p className="text-sm text-muted-foreground mt-2">A conta <strong>{email}</strong> não tem permissão de administrador.</p>
      <Button variant="outline" className="mt-4" onClick={() => supabase.auth.signOut()}>Sair</Button>
    </Card>
  );
}

const AdminDashboard = lazy(() => import("@/components/admin/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const AdminSettings = lazy(() => import("@/components/admin/AdminSettings").then((m) => ({ default: m.AdminSettings })));
const AdminTowers = lazy(() => import("@/components/admin/AdminTowers").then((m) => ({ default: m.AdminTowers })));
const AdminReport = lazy(() => import("@/components/admin/AdminReport").then((m) => ({ default: m.AdminReport })));
const AdminUsers = lazy(() => import("@/components/admin/AdminUsers").then((m) => ({ default: m.AdminUsers })));

function PanelFallback() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando módulo...
    </div>
  );
}

function AdminPanel() {
  const [tab, setTab] = useState<"dashboard" | "settings" | "towers" | "report" | "users">("dashboard");
  const tabs = [
    { id: "dashboard" as const, label: "Painel", icon: LayoutDashboard },
    { id: "towers" as const, label: "Mapa das Torres", icon: Building2 },
    { id: "settings" as const, label: "Configurações", icon: Settings },
    { id: "report" as const, label: "Relatório", icon: FileBarChart },
    { id: "users" as const, label: "Administradores", icon: Users },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Painel administrativo</h2>
        <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex gap-2 sm:gap-1 sm:border-b sm:border-border overflow-x-auto scrollbar-none snap-x snap-mandatory">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`snap-start flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-sm font-semibold sm:font-medium rounded-full sm:rounded-none sm:border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? "bg-accent text-accent-foreground sm:bg-transparent sm:text-accent sm:border-accent shadow-sm sm:shadow-none"
                  : "bg-secondary text-secondary-foreground sm:bg-transparent sm:text-muted-foreground sm:border-transparent sm:hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>
      <Suspense fallback={<PanelFallback />}>
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "settings" && <AdminSettings />}
        {tab === "towers" && <AdminTowers />}
        {tab === "report" && <AdminReport />}
        {tab === "users" && <AdminUsers />}
      </Suspense>
    </div>
  );
}


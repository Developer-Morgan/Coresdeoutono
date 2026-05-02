import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wind, Calendar, Building2, ClipboardList, ArrowRight, CheckCircle2, AlertTriangle, Clock, Radio } from "lucide-react";
import condoHero from "@/assets/cores-de-outono.jpg";

export const Route = createFileRoute("/")({
  component: () => (
    <SiteLayout>
      <Index />
    </SiteLayout>
  ),
});

function Index() {
  const [settings, setSettings] = useState<{ visit_date: string | null; contact_phone: string | null; notes: string | null } | null>(null);
  const [stats, setStats] = useState({ total: 0, working: 0, not_working: 0 });
  const [live, setLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const refreshStats = async () => {
    const { data } = await supabase.from("inspections").select("status");
    if (!data) return;
    setStats({
      total: data.length,
      working: data.filter((d) => d.status === "working").length,
      not_working: data.filter((d) => d.status === "not_working").length,
    });
    setLastUpdate(new Date());
  };

  const refreshSettings = async () => {
    const { data } = await supabase.from("settings").select("visit_date, contact_phone, notes").eq("id", 1).single();
    setSettings(data);
  };

  useEffect(() => {
    refreshSettings();
    refreshStats();

    const channel = supabase
      .channel("home-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "inspections" }, () => {
        refreshStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => {
        refreshSettings();
      })
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const visitDate = settings?.visit_date
    ? new Date(settings.visit_date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden border-0 shadow-[var(--shadow-card)] relative">
        <div className="relative h-[280px] md:h-[380px]">
          <img
            src={condoHero}
            alt="Fachada do Residencial Cores de Outono ao entardecer"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/30" />
          <div className="relative h-full flex items-center p-8 md:p-10">
            <div className="max-w-xl text-primary-foreground">
              <span className="inline-block px-3 py-1 rounded-full bg-accent/90 text-accent-foreground text-xs font-semibold uppercase tracking-wider">
                Atenção, morador
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight drop-shadow-sm">
                Vistoria geral dos exaustores
              </h2>
              <p className="mt-2 text-primary-foreground/90">
                Estamos realizando o levantamento do funcionamento dos exaustores de todas as 10 torres. Sua participação é essencial para identificarmos onde está a falha na linha em série.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                  <Link to="/agendar">
                    Agendar minha vistoria <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard icon={Calendar} label="Data da visita técnica" value={visitDate ?? "A definir"} />
        <InfoCard icon={Building2} label="Torres no condomínio" value="10 torres × 64 apartamentos" />
        <InfoCard icon={ClipboardList} label="Respostas recebidas" value={`${stats.total} de 640`} />
      </div>

      {/* How it works */}
      <Card className="p-6 md:p-8">
        <h3 className="text-lg font-semibold text-foreground">Como funciona</h3>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Step n={1} title="Identifique sua unidade" desc="Selecione sua torre e o número do apartamento no formulário." />
          <Step n={2} title="Informe o status" desc="Diga se o exaustor da sua unidade está funcionando ou não." />
          <Step n={3} title="Escolha o horário" desc="Reserve um horário disponível para o técnico visitar sua unidade." />
        </div>
      </Card>

      {/* Status summary */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-foreground">Status em tempo real</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            {live && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${live ? "bg-success" : "bg-muted-foreground"}`} />
          </span>
          <Radio className="h-3.5 w-3.5" />
          {live ? "Ao vivo" : "Conectando..."}
          {lastUpdate && <span className="hidden sm:inline">· atualizado {lastUpdate.toLocaleTimeString("pt-BR")}</span>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={CheckCircle2} label="Funcionando" value={stats.working} tone="success" />
        <StatCard icon={AlertTriangle} label="Não funcionando" value={stats.not_working} tone="destructive" />
        <StatCard icon={Clock} label="Aguardando resposta" value={Math.max(0, 640 - stats.total)} tone="muted" />
      </div>

      {settings?.notes && (
        <Card className="p-6 border-l-4 border-l-accent">
          <h4 className="font-semibold text-foreground mb-2">Aviso da administração</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{settings.notes}</p>
          {settings.contact_phone && (
            <p className="text-sm mt-3 text-foreground">Contato: <strong>{settings.contact_phone}</strong></p>
          )}
        </Card>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="p-5 flex items-center gap-4 hover:shadow-[var(--shadow-card)] transition-shadow">
      <div className="h-11 w-11 rounded-md bg-secondary flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-semibold text-foreground capitalize truncate">{value}</p>
      </div>
    </Card>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold shrink-0">{n}</div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: "success" | "destructive" | "muted" }) {
  const colors = {
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-md flex items-center justify-center ${colors}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Clock, Building2 } from "lucide-react";

export function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, working: 0, not_working: 0, towers: new Set<number>() });

  useEffect(() => {
    supabase.from("inspections").select("status, tower").then(({ data }) => {
      if (!data) return;
      setStats({
        total: data.length,
        working: data.filter((d) => d.status === "working").length,
        not_working: data.filter((d) => d.status === "not_working").length,
        towers: new Set(data.map((d) => d.tower)),
      });
    });
  }, []);

  const pct = stats.total ? Math.round((stats.total / 640) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Respostas" value={`${stats.total}/640`} sub={`${pct}% concluído`} icon={Clock} tone="muted" />
        <StatBox label="Funcionando" value={stats.working} icon={CheckCircle2} tone="success" />
        <StatBox label="Com falha" value={stats.not_working} icon={AlertTriangle} tone="destructive" />
        <StatBox label="Torres com retorno" value={`${stats.towers.size}/10`} icon={Building2} tone="accent" />
      </div>
      <Card className="p-6">
        <h3 className="font-semibold text-foreground">Progresso geral</h3>
        <div className="mt-3 h-3 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-[var(--gradient-autumn)] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{stats.total} de 640 unidades responderam.</p>
      </Card>
    </div>
  );
}

function StatBox({ label, value, sub, icon: Icon, tone }: { label: string; value: any; sub?: string; icon: any; tone: "success" | "destructive" | "muted" | "accent" }) {
  const c = {
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
    accent: "bg-accent/10 text-accent",
  }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`h-10 w-10 rounded-md flex items-center justify-center ${c}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

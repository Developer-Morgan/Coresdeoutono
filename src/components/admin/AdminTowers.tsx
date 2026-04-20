import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { TOWERS, FLOORS, COLUMNS, aptNumber, STATUS_LABEL } from "@/lib/condo";
import { AlertTriangle, CheckCircle2, HelpCircle, Zap } from "lucide-react";

type Insp = { tower: number; apartment: number; status: "working" | "not_working" | "untested"; resident_name: string; phone: string; time_slot: string };

export function AdminTowers() {
  const [data, setData] = useState<Insp[]>([]);
  const [tower, setTower] = useState(1);

  useEffect(() => {
    supabase.from("inspections").select("tower, apartment, status, resident_name, phone, time_slot").then(({ data }) => setData((data as Insp[]) ?? []));
  }, []);

  const towerData = useMemo(() => data.filter((d) => d.tower === tower), [data, tower]);
  const byApt = useMemo(() => Object.fromEntries(towerData.map((d) => [d.apartment, d])), [towerData]);

  // Series analysis: per column, find HIGHEST floor with not_working — that's the likely break point.
  // Apts BELOW it (lower floors) in same column also fail in series.
  const breakpoints = useMemo(() => {
    const bp: Record<number, number | null> = {}; // column -> floor
    for (const col of COLUMNS) {
      let highest: number | null = null;
      for (const floor of [...FLOORS].reverse()) { // 8 -> 1
        const apt = aptNumber(floor, col);
        const rec = byApt[apt];
        if (rec?.status === "not_working") {
          highest = floor;
          break;
        }
      }
      bp[col] = highest;
    }
    return bp;
  }, [byApt]);

  return (
    <div className="space-y-4">
      {/* Tower selector */}
      <div className="flex flex-wrap gap-2">
        {TOWERS.map((t) => {
          const active = tower === t;
          const tCount = data.filter((d) => d.tower === t).length;
          return (
            <button
              key={t}
              onClick={() => setTower(t)}
              className={`px-4 py-2 rounded-md border-2 text-sm font-semibold transition-all ${active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:border-accent/50"}`}
            >
              Torre {t}
              <span className="ml-2 text-xs opacity-70">({tCount})</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <Card className="p-4 flex flex-wrap items-center gap-4 text-xs">
        <Legend color="bg-success" label="Funcionando" />
        <Legend color="bg-destructive" label="Não funcionando" />
        <Legend color="bg-muted" label="Sem resposta" />
        <span className="inline-flex items-center gap-1 ml-auto"><Zap className="h-4 w-4 text-warning" /> = origem provável da falha em série (coluna)</span>
      </Card>

      {/* Tower grid */}
      <Card className="p-6 overflow-x-auto">
        <h3 className="font-bold text-foreground mb-4">Torre {tower} — visualização vertical</h3>
        <div className="inline-block min-w-full">
          {/* Column headers */}
          <div className="flex items-center gap-2 mb-2">
            <span className="w-12" />
            {COLUMNS.map((c) => (
              <div key={c} className="w-16 text-center text-xs uppercase tracking-wider text-muted-foreground font-semibold">Col {c}</div>
            ))}
          </div>
          {[...FLOORS].reverse().map((floor) => (
            <div key={floor} className="flex items-center gap-2 mb-2">
              <span className="w-12 text-xs uppercase tracking-wider text-muted-foreground font-semibold">{floor}º</span>
              {COLUMNS.map((col) => {
                const apt = aptNumber(floor, col);
                const rec = byApt[apt];
                const isBreakpoint = breakpoints[col] === floor;
                const tone =
                  rec?.status === "working" ? "bg-success/15 border-success text-success" :
                  rec?.status === "not_working" ? "bg-destructive/15 border-destructive text-destructive" :
                  "bg-muted border-border text-muted-foreground";
                return (
                  <div key={apt} className={`relative w-16 h-14 rounded-md border-2 flex flex-col items-center justify-center ${tone}`} title={rec ? `${rec.resident_name} • ${STATUS_LABEL[rec.status]} • ${rec.time_slot}` : "Sem resposta"}>
                    <span className="text-sm font-bold">{apt}</span>
                    {isBreakpoint && (
                      <Zap className="absolute -top-2 -right-2 h-5 w-5 text-warning fill-warning" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* Breakpoint summary */}
      <Card className="p-6">
        <h3 className="font-bold text-foreground flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /> Análise da ligação em série</h3>
        <p className="text-sm text-muted-foreground mt-1">A linha desce de cima (8º) para baixo (1º). O apartamento mais alto com falha indica onde a corrente provavelmente foi interrompida.</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COLUMNS.map((col) => {
            const bp = breakpoints[col];
            return (
              <div key={col} className={`p-3 rounded-md border ${bp ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/30"}`}>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Coluna {col}</p>
                {bp ? (
                  <p className="text-sm font-bold text-destructive mt-1">Falha a partir do apto {aptNumber(bp, col)}</p>
                ) : (
                  <p className="text-sm font-bold text-success mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Sem falhas</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Responses list */}
      <Card className="p-6">
        <h3 className="font-bold text-foreground mb-3">Respostas da Torre {tower}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">Apto</th>
                <th className="py-2 pr-3">Morador</th>
                <th className="py-2 pr-3">Telefone</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Horário</th>
              </tr>
            </thead>
            <tbody>
              {towerData.sort((a,b) => b.apartment - a.apartment).map((r) => (
                <tr key={r.apartment} className="border-b border-border/50">
                  <td className="py-2 pr-3 font-bold">{r.apartment}</td>
                  <td className="py-2 pr-3">{r.resident_name}</td>
                  <td className="py-2 pr-3">{r.phone}</td>
                  <td className="py-2 pr-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === "working" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.time_slot}</td>
                </tr>
              ))}
              {!towerData.length && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground"><HelpCircle className="h-5 w-5 inline mr-1" /> Nenhuma resposta ainda nesta torre.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`h-3 w-3 rounded-sm ${color}`} /> {label}</span>;
}

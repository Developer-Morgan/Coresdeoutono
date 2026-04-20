import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TOWERS, FLOORS, COLUMNS, aptNumber, STATUS_LABEL } from "@/lib/condo";
import { Download } from "lucide-react";

type Insp = { tower: number; apartment: number; status: string; resident_name: string; phone: string; time_slot: string; notes: string | null };

export function AdminReport() {
  const [data, setData] = useState<Insp[]>([]);

  useEffect(() => {
    supabase.from("inspections").select("*").order("tower").order("apartment", { ascending: false }).then(({ data }) => setData((data as Insp[]) ?? []));
  }, []);

  function downloadCsv() {
    const headers = ["Torre", "Apartamento", "Andar", "Coluna", "Morador", "Telefone", "Status", "Horário", "Observações", "Diagnóstico série"];
    const rows = data.map((r) => {
      const floor = Math.floor(r.apartment / 100);
      const col = r.apartment % 100;
      const diag = computeDiagnosis(data, r.tower, col, floor, r.status);
      return [r.tower, r.apartment, floor, col, r.resident_name, r.phone, STATUS_LABEL[r.status] ?? r.status, r.time_slot, r.notes ?? "", diag];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `relatorio-cores-de-outono-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  // Compute breakpoint per (tower, column)
  const breakpoints: Record<string, number | null> = {};
  for (const t of TOWERS) {
    for (const c of COLUMNS) {
      let bp: number | null = null;
      for (let f = 8; f >= 1; f--) {
        const apt = aptNumber(f, c);
        const rec = data.find((d) => d.tower === t && d.apartment === apt);
        if (rec?.status === "not_working") { bp = f; break; }
      }
      breakpoints[`${t}-${c}`] = bp;
    }
  }

  const failureColumns = Object.entries(breakpoints).filter(([, v]) => v !== null);

  return (
    <div className="space-y-6">
      <Card className="p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground">Relatório consolidado</h3>
          <p className="text-sm text-muted-foreground">{data.length} respostas coletadas. {failureColumns.length} colunas com falha identificada.</p>
        </div>
        <Button onClick={downloadCsv} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Download className="h-4 w-4 mr-2" /> Baixar CSV
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold text-foreground mb-3">Pontos de origem das falhas (análise em série)</h3>
        <p className="text-sm text-muted-foreground mb-4">Cada coluna vertical é uma linha em série, descendo do 8º andar. O apartamento listado é o mais alto com falha — o problema provavelmente está nesse ponto ou acima dele.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">Torre</th>
                <th className="py-2 pr-3">Coluna</th>
                <th className="py-2 pr-3">Apto origem</th>
                <th className="py-2 pr-3">Recomendação</th>
              </tr>
            </thead>
            <tbody>
              {failureColumns.map(([key, floor]) => {
                const [t, c] = key.split("-").map(Number);
                return (
                  <tr key={key} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-semibold">Torre {t}</td>
                    <td className="py-2 pr-3">Coluna {c}</td>
                    <td className="py-2 pr-3 font-bold text-destructive">{aptNumber(floor!, c)}</td>
                    <td className="py-2 pr-3 text-muted-foreground">Verificar a partir do apto {aptNumber(floor!, c)} subindo</td>
                  </tr>
                );
              })}
              {!failureColumns.length && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Nenhuma falha em série identificada até o momento.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function computeDiagnosis(all: any[], tower: number, col: number, floor: number, status: string): string {
  if (status !== "not_working") return "—";
  // find highest broken in same column/tower
  let highest = floor;
  for (let f = 8; f >= floor; f--) {
    const apt = aptNumber(f, col);
    const rec = all.find((d) => d.tower === tower && d.apartment === apt);
    if (rec?.status === "not_working") { highest = f; break; }
  }
  if (highest === floor) return "Provável origem da falha nesta coluna";
  return `Consequência da falha no apto ${aptNumber(highest, col)}`;
}

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TOWERS, FLOORS, COLUMNS, aptNumber, STATUS_LABEL } from "@/lib/condo";
import { Download, FileText, AlertTriangle, Zap } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Insp = {
  tower: number;
  apartment: number;
  status: string;
  resident_name: string;
  phone: string;
  time_slot: string;
  notes: string | null;
  created_at: string;
};

type ColumnAnalysis = {
  tower: number;
  column: number;
  originApt: number | null;       // apto mais alto com falha confirmada
  originFloor: number | null;
  affectedApts: number[];          // aptos abaixo da origem (em série)
  testedFloors: number[];
  brokenFloors: number[];
  workingFloors: number[];
  untestedFloors: number[];
  coverage: number;                // % respondido na coluna
};

export function AdminReport() {
  const [data, setData] = useState<Insp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("inspections")
      .select("*")
      .order("tower")
      .order("apartment", { ascending: false })
      .then(({ data }) => {
        setData((data as Insp[]) ?? []);
        setLoading(false);
      });
  }, []);

  const analysis = useMemo(() => analyseColumns(data), [data]);
  const failures = analysis.filter((a) => a.originApt !== null);
  const totalRespostas = data.length;
  const totalNaoFunc = data.filter((d) => d.status === "not_working").length;

  function downloadCsv() {
    const headers = [
      "Torre", "Apartamento", "Andar", "Coluna", "Morador", "Telefone",
      "Status", "Horário", "Observações", "Diagnóstico série",
    ];
    const rows = data.map((r) => {
      const floor = Math.floor(r.apartment / 100);
      const col = r.apartment % 100;
      const a = analysis.find((x) => x.tower === r.tower && x.column === col);
      let diag = "—";
      if (r.status === "not_working" && a?.originApt) {
        diag = a.originApt === r.apartment
          ? "ORIGEM da falha em série"
          : `Consequência — origem no apto ${a.originApt}`;
      }
      return [r.tower, r.apartment, floor, col, r.resident_name, r.phone,
        STATUS_LABEL[r.status] ?? r.status, r.time_slot, r.notes ?? "", diag];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-cores-de-outono-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString("pt-BR");

    // Cabeçalho
    doc.setFillColor(43, 38, 35);
    doc.rect(0, 0, pageW, 70, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Residencial Cores de Outono", 40, 32);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Relatório de Manutenção de Exaustores", 40, 50);
    doc.text(`Emitido em ${today}`, pageW - 40, 50, { align: "right" });

    // Resumo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo executivo", 40, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const resumo = [
      `Respostas coletadas: ${totalRespostas}`,
      `Apartamentos com falha reportada: ${totalNaoFunc}`,
      `Colunas verticais com falha em série: ${failures.length}`,
      `Pontos prováveis de origem identificados: ${failures.length}`,
    ];
    resumo.forEach((t, i) => doc.text(t, 40, 120 + i * 14));

    // Apontamentos de origem
    let y = 195;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Apontamentos — pontos de origem das falhas em série", 40, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(90, 90, 90);
    doc.text(
      "Em ligações em série, o exaustor mais alto que falha é a origem provável; os de baixo deixam de funcionar em consequência.",
      40, y + 12, { maxWidth: pageW - 80 }
    );
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      startY: y + 32,
      head: [["Torre", "Coluna", "Apto Origem", "Andar", "Aptos Afetados", "Cobertura"]],
      body: failures.map((f) => [
        `Torre ${f.tower}`,
        `Col ${f.column}`,
        String(f.originApt),
        `${f.originFloor}º`,
        f.affectedApts.length
          ? f.affectedApts.join(", ")
          : "Nenhum apto abaixo confirmado",
        `${f.coverage}%`,
      ]),
      headStyles: { fillColor: [193, 84, 42], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 5 },
      alternateRowStyles: { fillColor: [248, 244, 240] },
    });

    // Detalhamento por torre
    let cursor = (doc as any).lastAutoTable.finalY + 30;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    if (cursor > 720) { doc.addPage(); cursor = 60; }
    doc.text("Recomendação técnica por coluna", 40, cursor);
    cursor += 10;

    autoTable(doc, {
      startY: cursor + 6,
      head: [["Local", "Recomendação"]],
      body: failures.map((f) => [
        `Torre ${f.tower} • Coluna ${f.column}`,
        `Iniciar verificação pelo apto ${f.originApt} (${f.originFloor}º andar). ` +
        (f.affectedApts.length
          ? `Reparar ali deve restabelecer também: ${f.affectedApts.join(", ")}.`
          : `Não há aptos abaixo com falha confirmada — verificar isoladamente.`),
      ]),
      headStyles: { fillColor: [43, 38, 35], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 6, valign: "top" },
      columnStyles: { 0: { cellWidth: 140, fontStyle: "bold" }, 1: { cellWidth: "auto" } },
    });

    // Lista completa de respostas
    doc.addPage();
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Respostas dos moradores", 40, 50);
    autoTable(doc, {
      startY: 60,
      head: [["Torre", "Apto", "Morador", "Telefone", "Horário", "Status"]],
      body: data.map((r) => [
        r.tower, r.apartment, r.resident_name, r.phone, r.time_slot,
        STATUS_LABEL[r.status] ?? r.status,
      ]),
      headStyles: { fillColor: [43, 38, 35], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 4 },
      didParseCell: (h) => {
        if (h.section === "body" && h.column.index === 5) {
          const v = String(h.cell.raw);
          if (v.includes("Não funcionando")) h.cell.styles.textColor = [193, 50, 42];
          if (v.includes("Funcionando")) h.cell.styles.textColor = [40, 120, 60];
        }
      },
    });

    // Rodapé em todas as páginas
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Cores de Outono • Relatório gerado em ${today} • Página ${i}/${pages} • Elaborado por Charles`,
        pageW / 2, doc.internal.pageSize.getHeight() - 20, { align: "center" }
      );
    }

    doc.save(`relatorio-cores-de-outono-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (loading) return <div className="text-center py-12 text-muted-foreground">Carregando relatório...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground text-lg">Relatório consolidado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {totalRespostas} respostas • {totalNaoFunc} falhas reportadas • {failures.length} colunas em série com origem identificada
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadCsv} variant="outline">
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button onClick={downloadPdf} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <FileText className="h-4 w-4 mr-2" /> Baixar PDF
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-accent" />
          <h3 className="font-bold text-foreground">Apontamentos — pontos de origem das falhas</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Cada coluna vertical do prédio é uma linha em série. O apartamento mais alto com falha é a <strong>origem provável</strong> — reparar ali deve restabelecer os aptos abaixo afetados em consequência.
        </p>

        {failures.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-md">
            Nenhuma falha em série identificada até o momento.
          </div>
        ) : (
          <div className="space-y-3">
            {failures.map((f) => (
              <div
                key={`${f.tower}-${f.column}`}
                className="border border-border rounded-md p-4 bg-card hover:border-accent/50 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-destructive/10 text-destructive rounded-md w-12 h-12 flex items-center justify-center font-bold">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">
                        Torre {f.tower} • Coluna {f.column}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cobertura de respostas nesta coluna: {f.coverage}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Apto origem</div>
                    <div className="text-2xl font-bold text-destructive">{f.originApt}</div>
                    <div className="text-xs text-muted-foreground">{f.originFloor}º andar</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 text-sm">
                  <p className="text-foreground">
                    <strong>Recomendação:</strong> verificar o exaustor a partir do apto <strong>{f.originApt}</strong>.
                  </p>
                  {f.affectedApts.length > 0 ? (
                    <p className="text-muted-foreground mt-1">
                      Aptos afetados em consequência abaixo: <strong>{f.affectedApts.join(", ")}</strong>
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-1">
                      Nenhum apto abaixo respondeu com falha confirmada — pode ser ponto isolado.
                    </p>
                  )}
                  {f.untestedFloors.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Andares ainda sem resposta nesta coluna: {f.untestedFloors.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function analyseColumns(data: Insp[]): ColumnAnalysis[] {
  const result: ColumnAnalysis[] = [];
  for (const t of TOWERS) {
    for (const c of COLUMNS) {
      const broken: number[] = [];
      const working: number[] = [];
      const untested: number[] = [];
      const tested: number[] = [];
      for (const f of FLOORS) {
        const apt = aptNumber(f, c);
        const rec = data.find((d) => d.tower === t && d.apartment === apt);
        if (!rec) { untested.push(f); continue; }
        tested.push(f);
        if (rec.status === "not_working") broken.push(f);
        else if (rec.status === "working") working.push(f);
        else untested.push(f);
      }
      let originFloor: number | null = null;
      if (broken.length > 0) originFloor = Math.max(...broken);
      const originApt = originFloor ? aptNumber(originFloor, c) : null;
      const affected = originFloor
        ? broken.filter((f) => f < originFloor!).sort((a, b) => b - a).map((f) => aptNumber(f, c))
        : [];
      const coverage = Math.round((tested.length / FLOORS.length) * 100);
      result.push({
        tower: t, column: c, originApt, originFloor,
        affectedApts: affected, testedFloors: tested,
        brokenFloors: broken, workingFloors: working, untestedFloors: untested,
        coverage,
      });
    }
  }
  return result.sort((a, b) => a.tower - b.tower || a.column - b.column);
}

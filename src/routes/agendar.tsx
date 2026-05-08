import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TOWERS, FLOORS, COLUMNS, aptNumber } from "@/lib/condo";
import { toast } from "sonner";
import { z } from "zod";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/agendar")({
  component: () => (
    <SiteLayout>
      <Agendar />
    </SiteLayout>
  ),
});

const schema = z.object({
  resident_name: z.string().trim().min(3, "Informe seu nome completo").max(120),
  phone: z.string().trim().min(8, "Telefone inválido").max(20),
  status: z.enum(["working", "not_working"]),
  time_slot: z.string(),
  notes: z.string().max(500).optional(),
}).refine((d) => d.status === "working" || d.time_slot.length > 0, {
  message: "Escolha um horário para a visita",
  path: ["time_slot"],
});

function Agendar() {
  const [tower, setTower] = useState<number | null>(null);
  const [apt, setApt] = useState<number | null>(null);
  const [settings, setSettings] = useState<{ visit_date: string | null; time_slots: string[] } | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ resident_name: "", phone: "", status: "" as "working" | "not_working" | "", time_slot: "", notes: "" });

  useEffect(() => {
    supabase.from("settings").select("visit_date, time_slots").eq("id", 1).single().then(({ data }) => setSettings(data));
  }, []);

  const visitDate = settings?.visit_date
    ? new Date(settings.visit_date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })
    : null;

  async function submit() {
    if (!tower || !apt) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("inspections").upsert(
      { tower, apartment: apt, ...parsed.data, notes: parsed.data.notes || null },
      { onConflict: "tower,apartment" }
    );
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao enviar: " + error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <Card className="p-10 text-center max-w-xl mx-auto">
        <div className="h-16 w-16 rounded-full bg-success/10 text-success mx-auto flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h2 className="text-2xl font-bold mt-4 text-foreground">{form.status === "working" ? "Resposta registrada!" : "Agendamento confirmado!"}</h2>
        <p className="text-muted-foreground mt-2">
          Recebemos sua resposta para a <strong className="text-foreground">Torre {tower} – Apto {apt}</strong>.
          {form.status === "working" ? (
            <> Como o exaustor está <strong className="text-success">funcionando</strong>, não é necessária visita técnica.</>
          ) : (
            visitDate && <> O técnico passará na <strong className="text-foreground capitalize">{visitDate}</strong> no horário <strong className="text-foreground">{form.time_slot}</strong>.</>
          )}
        </p>
        <Button className="mt-6" onClick={() => { setDone(false); setTower(null); setApt(null); setForm({ resident_name: "", phone: "", status: "", time_slot: "", notes: "" }); }}>
          Cadastrar outra unidade
        </Button>
      </Card>
    );
  }

  // Step 1: choose tower
  if (!tower) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Selecione sua torre</h2>
          <p className="text-muted-foreground mt-1">O condomínio possui 10 torres.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {TOWERS.map((t) => (
            <button
              key={t}
              onClick={() => setTower(t)}
              className="aspect-square rounded-lg border-2 border-border bg-card hover:border-accent hover:bg-accent/5 transition-all flex flex-col items-center justify-center group"
            >
              <span className="text-xs uppercase tracking-wider text-muted-foreground group-hover:text-accent">Torre</span>
              <span className="text-3xl font-bold text-foreground mt-1">{t}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: choose apartment
  if (!apt) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setTower(null)} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Trocar torre
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Torre {tower} — selecione seu apartamento</h2>
          <p className="text-muted-foreground mt-1">Andares de 1 a 8, unidades de 1 a 8.</p>
        </div>
        <Card className="p-3 sm:p-6 overflow-x-auto">
          <div className="inline-block min-w-full">
            {[...FLOORS].reverse().map((floor) => (
              <div key={floor} className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span className="w-10 sm:w-12 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold shrink-0">{floor}º and.</span>
                {COLUMNS.map((col) => {
                  const n = aptNumber(floor, col);
                  return (
                    <button
                      key={n}
                      onClick={() => setApt(n)}
                      className="h-12 w-12 sm:h-12 sm:w-14 rounded-md border border-border bg-card hover:border-accent hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground transition-all text-sm font-semibold text-foreground shrink-0"
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Step 3: form
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => setApt(null)} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Trocar apartamento
      </Button>
      <div>
        <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider">Torre {tower} · Apto {apt}</span>
        <h2 className="text-2xl font-bold text-foreground mt-2">Preencha seus dados</h2>
        {visitDate && <p className="text-muted-foreground mt-1">Visita técnica: <strong className="text-foreground capitalize">{visitDate}</strong></p>}
      </div>
      <Card className="p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" value={form.resident_name} onChange={(e) => setForm({ ...form, resident_name: e.target.value })} maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone para contato</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} placeholder="(00) 00000-0000" />
        </div>

        <div className="space-y-2">
          <Label>Status do exaustor</Label>
          <RadioGroup value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "working" | "not_working" })} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={`flex items-center gap-3 p-4 rounded-md border-2 cursor-pointer transition-all ${form.status === "working" ? "border-success bg-success/5" : "border-border hover:border-success/50"}`}>
              <RadioGroupItem value="working" />
              <div>
                <p className="font-semibold text-foreground">Funcionando</p>
                <p className="text-xs text-muted-foreground">Está operando normalmente</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-4 rounded-md border-2 cursor-pointer transition-all ${form.status === "not_working" ? "border-destructive bg-destructive/5" : "border-border hover:border-destructive/50"}`}>
              <RadioGroupItem value="not_working" />
              <div>
                <p className="font-semibold text-foreground">Não funciona</p>
                <p className="text-xs text-muted-foreground">Sem ar / parado</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Horário disponível para o técnico</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(settings?.time_slots ?? []).map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setForm({ ...form, time_slot: slot })}
                className={`px-3 py-2 rounded-md border-2 text-sm font-medium transition-all ${form.time_slot === slot ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:border-accent/50"}`}
              >
                {slot}
              </button>
            ))}
            {!settings?.time_slots?.length && <p className="text-sm text-muted-foreground col-span-full">Aguardando administração definir horários.</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} placeholder="Ex.: tem cachorro, interfone não funciona..." />
        </div>

        <Button onClick={submit} disabled={submitting} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
          {submitting ? "Enviando..." : "Confirmar agendamento"}
        </Button>
      </Card>
    </div>
  );
}

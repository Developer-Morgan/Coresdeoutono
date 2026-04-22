import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AdminSettings() {
  const [date, setDate] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function resetAll() {
    setResetting(true);
    const { error, count } = await supabase
      .from("inspections")
      .delete({ count: "exact" })
      .gte("tower", 0);
    setResetting(false);
    setConfirmText("");
    if (error) toast.error(error.message);
    else toast.success(`${count ?? 0} respostas removidas. Sistema zerado.`);
  }

  useEffect(() => {
    supabase.from("settings").select("*").eq("id", 1).single().then(({ data }) => {
      if (!data) return;
      setDate(data.visit_date ?? "");
      setPhone(data.contact_phone ?? "");
      setNotes(data.notes ?? "");
      setSlots(data.time_slots ?? []);
    });
  }, []);

  async function save() {
    setLoading(true);
    const { error } = await supabase.from("settings").update({
      visit_date: date || null,
      contact_phone: phone || null,
      notes: notes || null,
      time_slots: slots,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Configurações salvas!");
  }

  return (
    <Card className="p-6 space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data da visita técnica</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Telefone de contato</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Horários disponíveis</Label>
        <div className="flex flex-wrap gap-2">
          {slots.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
              {s}
              <button onClick={() => setSlots(slots.filter((_, j) => j !== i))} className="h-5 w-5 rounded-full hover:bg-accent/20 flex items-center justify-center">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input value={newSlot} onChange={(e) => setNewSlot(e.target.value)} placeholder="ex.: 08:00-09:00" className="max-w-[200px]" />
          <Button type="button" variant="outline" onClick={() => { if (newSlot.trim()) { setSlots([...slots, newSlot.trim()]); setNewSlot(""); } }}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Aviso para os moradores (opcional)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} placeholder="Mensagem que aparece na home..." />
      </div>

      <Button onClick={save} disabled={loading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
        {loading ? "Salvando..." : "Salvar configurações"}
      </Button>
    </Card>
  );
}

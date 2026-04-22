import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAdmins, createAdmin, removeAdmin, resetAdminPassword } from "@/server/admins.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Trash2, KeyRound, ShieldCheck } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Admin = { userId: string; email: string; createdAt: string };

export function AdminUsers() {
  const list = useServerFn(listAdmins);
  const create = useServerFn(createAdmin);
  const remove = useServerFn(removeAdmin);
  const reset = useServerFn(resetAdminPassword);

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await list();
      setAdmins(r.admins);
      setMe(r.currentUserId);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar administradores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const r = await create({ data: { email: email.trim(), password } });
      toast.success(r.reused
        ? "Usuário existente promovido a administrador."
        : "Administrador criado com sucesso.");
      setEmail(""); setPassword("");
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar administrador");
    } finally {
      setCreating(false);
    }
  }

  async function handleRemove(userId: string) {
    try {
      await remove({ data: { userId } });
      toast.success("Administrador removido.");
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao remover");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="h-5 w-5 text-accent" />
          <h3 className="font-bold text-foreground">Cadastrar novo administrador</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          O novo administrador poderá acessar o painel com o e-mail e senha definidos abaixo.
        </p>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-email">E-mail</Label>
            <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pwd">Senha (mínimo 8 caracteres)</Label>
            <Input id="new-pwd" type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={creating} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {creating ? "Cadastrando..." : "Cadastrar administrador"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h3 className="font-bold text-foreground">Administradores ativos ({admins.length})</h3>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : admins.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum administrador encontrado.</p>
        ) : (
          <div className="divide-y divide-border">
            {admins.map((a) => (
              <div key={a.userId} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-foreground">
                    {a.email}
                    {a.userId === me && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">você</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Desde {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <ResetPasswordDialog userId={a.userId} email={a.email} resetFn={reset} />
                  {a.userId !== me && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4 mr-1" /> Remover
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover administrador?</AlertDialogTitle>
                          <AlertDialogDescription>
                            <strong>{a.email}</strong> perderá acesso ao painel administrativo. A conta de login não é apagada — apenas a permissão de admin.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemove(a.userId)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            Remover acesso
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

function ResetPasswordDialog({ userId, email, resetFn }: { userId: string; email: string; resetFn: any }) {
  const [pwd, setPwd] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await resetFn({ data: { userId, password: pwd } });
      toast.success(`Senha de ${email} atualizada.`);
      setOpen(false); setPwd("");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao redefinir senha");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPwd(""); }}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <KeyRound className="h-4 w-4 mr-1" /> Trocar senha
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nova senha para {email}</AlertDialogTitle>
          <AlertDialogDescription>
            Defina uma nova senha (mínimo 8 caracteres). O usuário precisará usá-la no próximo login.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input type="text" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Nova senha" minLength={8} maxLength={72} autoFocus />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={submit}
            disabled={pwd.length < 8 || busy}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {busy ? "Salvando..." : "Salvar nova senha"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

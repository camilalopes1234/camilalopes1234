import { auth } from "@/auth";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { roleLabels } from "@/lib/constants";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Configurações do usuário</h1>
        <p className="text-sm text-slate-500">Perfil logado e base pronta para evoluir preferências, notificações e integrações futuras.</p>
      </div>
      <Card className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Nome</p>
          <p className="text-lg font-semibold text-slate-950">{session?.user.name}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Email</p>
          <p className="text-lg font-semibold text-slate-950">{session?.user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="info">{roleLabels[session!.user.role]}</Badge>
          <span className="text-sm text-slate-500">{session?.user.title || "Cargo não informado"}</span>
        </div>
      </Card>
    </div>
  );
}

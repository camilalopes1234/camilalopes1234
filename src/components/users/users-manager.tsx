import { UserRole } from "@prisma/client";

import { UserForm } from "@/components/forms/user-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { roleLabels } from "@/lib/constants";
import type { UserListItem } from "@/server/queries/users";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export function UsersManager({
  users,
  currentUserId
}: {
  users: UserListItem[];
  currentUserId: string;
}) {
  const totalActive = users.filter((user) => user.isActive).length;
  const totalAdmins = users.filter((user) => user.role === UserRole.ADMIN).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.05fr_1.55fr]">
        <UserForm
          submitLabel="Criar usuario"
          title="Novo acesso"
          description="Cadastre usuarios reais do time comercial com perfil, cargo e senha inicial."
        />

        <Card className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4">
            <p className="text-sm text-emerald-700">Usuarios ativos</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">{totalActive}</p>
          </div>
          <div className="rounded-[24px] border border-sky-100 bg-sky-50/80 p-4">
            <p className="text-sm text-sky-700">Administradores</p>
            <p className="mt-2 text-3xl font-semibold text-sky-950">{totalAdmins}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm text-slate-600">Time comercial</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{users.length - totalAdmins}</p>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Usuarios cadastrados</h2>
            <p className="text-sm text-slate-500">Edite cargo, perfil, status e senha sem sair do CRM.</p>
          </div>
          <Badge tone="info">{users.length} usuarios</Badge>
        </div>

        <div className="grid gap-4">
          {users.map((user) => (
            <div key={user.id} className="grid gap-4 xl:grid-cols-[320px_1fr]">
              <Card className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-slate-950">{user.name}</p>
                    <p className="truncate text-sm text-slate-500">{user.email}</p>
                  </div>
                  <Badge tone={user.isActive ? "success" : "default"}>{user.isActive ? "Ativo" : "Inativo"}</Badge>
                </div>

                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <span>Perfil</span>
                    <span className="font-medium text-slate-950">{roleLabels[user.role]}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Cargo</span>
                    <span className="font-medium text-slate-950">{user.title || "Nao informado"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Leads</span>
                    <span className="font-medium text-slate-950">{user._count.leads}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Tarefas</span>
                    <span className="font-medium text-slate-950">{user._count.tasks}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Propostas</span>
                    <span className="font-medium text-slate-950">{user._count.opportunities}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Criado em</span>
                    <span className="font-medium text-slate-950">{formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </Card>

              <UserForm
                initialValues={{
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  title: user.title,
                  role: user.role,
                  isActive: user.isActive
                }}
                submitLabel="Salvar alteracoes"
                title={user.id === currentUserId ? "Seu acesso" : "Editar usuario"}
                description={
                  user.id === currentUserId
                    ? "Voce pode atualizar seus dados e senha. O proprio perfil e status ficam protegidos."
                    : "Atualize dados, troque senha quando precisar e controle o status do acesso."
                }
                disableRole={user.id === currentUserId}
                disableStatus={user.id === currentUserId}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

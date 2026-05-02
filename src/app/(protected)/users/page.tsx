import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UsersManager } from "@/components/users/users-manager";
import { isAdmin } from "@/server/permissions/access";
import { getManageableUsers } from "@/server/queries/users";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdmin(session.user)) {
    redirect("/dashboard");
  }

  const users = await getManageableUsers();

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_46%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eef2ff_100%)] p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">Administracao</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Usuarios do CRM</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Crie acessos reais, ajuste perfis e mantenha o time comercial organizado sem depender de seed ou alteracoes manuais no banco.
        </p>
      </div>

      <UsersManager users={users} currentUserId={session.user.id} />
    </div>
  );
}

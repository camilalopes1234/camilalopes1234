import { auth } from "@/auth";
import { LeadForm } from "@/components/forms/lead-form";
import { getAssignableUsers } from "@/server/demo/users";

export default async function NewLeadPage() {
  const session = await auth();
  const users = await getAssignableUsers({ id: session!.user.id, role: session!.user.role });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Novo lead</h1>
        <p className="text-sm text-slate-500">Cadastre um novo contato e já alinhe o próximo passo comercial.</p>
      </div>
      <LeadForm users={users} initialValues={{ ownerId: users[0]?.id }} />
    </div>
  );
}

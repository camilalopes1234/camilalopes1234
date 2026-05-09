import { auth } from "@/auth";
import { ProspectingManager } from "@/components/prospecting/prospecting-manager";
import { getAssignableUsers } from "@/server/demo/users";
import { isGooglePlacesConfigured } from "@/server/services/prospecting-service";

export default async function ProspectingPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const owners = await getAssignableUsers({ id: session.user.id, role: session.user.role });

  return (
    <div className="space-y-5">
      <div className="rounded-[30px] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_42%),linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#eef2ff_100%)] p-5 shadow-[var(--shadow)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">Prospeccao</p>
        <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-slate-950">Busca externa de leads</h1>
        <p className="mt-2.5 max-w-3xl text-[13px] leading-5 text-slate-600">
          Encontre empresas por nicho, cidade e regiao, revise a qualidade dos contatos e transforme os melhores resultados em leads prontos para pipeline e campanhas.
        </p>
      </div>

      <ProspectingManager
        owners={owners}
        currentUserRole={session.user.role}
        googlePlacesConfigured={isGooglePlacesConfigured()}
      />
    </div>
  );
}

import { auth } from "@/auth";
import { CampaignImporter } from "@/components/campaigns/campaign-importer";
import { CampaignsManager } from "@/components/campaigns/campaigns-manager";
import { getAssignableUsers } from "@/server/demo/users";
import { getWhatsappCampaigns, getWhatsappTemplates } from "@/server/queries/campaigns";
import { getLeadImportTemplate } from "@/server/services/import-service";
import { isWhatsappConfigured } from "@/server/services/whatsapp-service";

export default async function CampaignsPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const [campaigns, templates, owners] = await Promise.all([
    getWhatsappCampaigns({ id: session.user.id, role: session.user.role }),
    getWhatsappTemplates({ id: session.user.id, role: session.user.role }),
    getAssignableUsers({ id: session.user.id, role: session.user.role })
  ]);
  const importTemplate = getLeadImportTemplate();

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_42%),linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#ecfeff_100%)] p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">WhatsApp</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Campanhas em massa</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Planeje reativacoes, follow-ups e comunicacoes segmentadas com filtros comerciais, templates e historico de envio por destinatario.
        </p>
      </div>

      <CampaignsManager
        templates={templates}
        campaigns={campaigns}
        owners={owners}
        currentUserRole={session.user.role}
        whatsappConfigured={isWhatsappConfigured()}
      />

      <CampaignImporter
        owners={owners}
        importFields={importTemplate.expectedFields}
        currentUserRole={session.user.role}
      />
    </div>
  );
}

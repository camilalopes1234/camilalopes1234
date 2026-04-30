import type { Lead, Opportunity, User } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { opportunityStatusLabels } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

type OpportunityRow = Opportunity & { lead: Pick<Lead, "fullName">; owner: Pick<User, "name"> };

export function OpportunitiesTable({ opportunities }: { opportunities: OpportunityRow[] }) {
  if (opportunities.length === 0) {
    return <EmptyState title="Nenhuma proposta registrada" description="Cadastre a primeira oportunidade para começar a acompanhar as negociações." />;
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-4 font-medium">Título</th>
              <th className="px-5 py-4 font-medium">Lead</th>
              <th className="px-5 py-4 font-medium">Valor</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Envio</th>
              <th className="px-5 py-4 font-medium">Responsável</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opportunity) => (
              <tr key={opportunity.id} className="border-t border-slate-100 bg-white/70">
                <td className="px-5 py-4 font-medium text-slate-900">{opportunity.title}</td>
                <td className="px-5 py-4">{opportunity.lead.fullName}</td>
                <td className="px-5 py-4">{formatCurrency(opportunity.estimatedValue?.toString())}</td>
                <td className="px-5 py-4">
                  <Badge tone="info">{opportunityStatusLabels[opportunity.status]}</Badge>
                </td>
                <td className="px-5 py-4">{formatDate(opportunity.sentAt)}</td>
                <td className="px-5 py-4">{opportunity.owner.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

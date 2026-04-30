import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { LeadDetail } from "@/components/leads/lead-detail";
import { getAssignableUsers } from "@/server/demo/users";
import { getLeadForUser } from "@/server/queries/leads";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const [lead, users] = await Promise.all([
    getLeadForUser({ id: session!.user.id, role: session!.user.role }, id),
    getAssignableUsers({ id: session!.user.id, role: session!.user.role })
  ]);

  if (!lead) notFound();

  return <LeadDetail lead={lead} users={users} />;
}

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <WorkspaceShell userName={session.user.name ?? "Usuaria"} userRole={session.user.role} title={session.user.title}>
      {children}
    </WorkspaceShell>
  );
}

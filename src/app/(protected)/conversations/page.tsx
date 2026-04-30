import { auth } from "@/auth";
import { ConversationInbox } from "@/components/conversations/conversation-inbox";
import { getConversations } from "@/server/queries/conversations";

export default async function ConversationsPage() {
  const session = await auth();
  const conversations = await getConversations({ id: session!.user.id, role: session!.user.role });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Chatbot e WhatsApp</h1>
        <p className="text-sm text-slate-500">Inbox premium para conversas do bot, atendimento humano e historico multimidia por lead.</p>
      </div>
      <ConversationInbox conversations={conversations} />
    </div>
  );
}

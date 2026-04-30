import { prisma } from "@/server/db/prisma";
import { demoConversations, demoLeads, demoMessages, demoUsers } from "@/server/demo/data";
import { isDemoMode } from "@/server/demo/mode";

export async function getConversations(user: { id: string; role: "ADMIN" | "SELLER" }) {
  if (isDemoMode) {
    const conversations = user.role === "ADMIN" ? demoConversations : demoConversations.filter((item) => item.ownerId === user.id);
    return conversations.map((conversation) => ({
      ...conversation,
      lead: demoLeads.find((lead) => lead.id === conversation.leadId)!,
      owner: conversation.ownerId ? { name: demoUsers.find((userItem) => userItem.id === conversation.ownerId)?.name ?? "Sem nome" } : null,
      messages: demoMessages.filter((message) => message.conversationId === conversation.id)
    }));
  }

  return prisma.conversation.findMany({
    where: user.role === "ADMIN" ? {} : { ownerId: user.id },
    include: {
      lead: true,
      owner: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }]
  });
}

export async function getConversation(user: { id: string; role: "ADMIN" | "SELLER" }, id: string) {
  if (isDemoMode) {
    const conversation = demoConversations.find((item) => item.id === id);
    if (!conversation) return null;
    if (user.role !== "ADMIN" && conversation.ownerId !== user.id) return null;

    return {
      ...conversation,
      lead: demoLeads.find((lead) => lead.id === conversation.leadId)!,
      owner: conversation.ownerId ? { name: demoUsers.find((userItem) => userItem.id === conversation.ownerId)?.name ?? "Sem nome" } : null,
      messages: demoMessages
        .filter((message) => message.conversationId === conversation.id)
        .map((message) => ({
          ...message,
          user: message.userId ? { name: demoUsers.find((userItem) => userItem.id === message.userId)?.name ?? "Sem nome" } : null
        }))
    };
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      lead: true,
      owner: { select: { name: true } },
      messages: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!conversation) return null;
  if (user.role !== "ADMIN" && conversation.ownerId !== user.id) return null;

  return conversation;
}

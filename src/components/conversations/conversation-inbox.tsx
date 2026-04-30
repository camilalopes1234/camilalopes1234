"use client";

import { MessageDirection, MessageStatus, MessageType, SenderType, type Conversation, type Lead, type Message } from "@prisma/client";
import { ArrowLeft, AudioLines, FileImage, FileText, Link2, Mic, Paperclip, SendHorizonal, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type ComponentType } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { conversationStatusLabels, messageStatusLabels, messageTypeLabels } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";

type ConversationRow = Conversation & {
  lead: Lead;
  owner: { name: string } | null;
  messages: Message[];
};

const composerModes: Array<{ type: MessageType; label: string; icon: ComponentType<{ className?: string }> }> = [
  { type: MessageType.TEXT, label: "Texto", icon: SendHorizonal },
  { type: MessageType.AUDIO, label: "Audio", icon: Mic },
  { type: MessageType.IMAGE, label: "Imagem", icon: FileImage },
  { type: MessageType.VIDEO, label: "Video", icon: Video },
  { type: MessageType.DOCUMENT, label: "Documento", icon: Paperclip }
];

function getAcceptByType(type: MessageType) {
  if (type === MessageType.AUDIO) return "audio/*";
  if (type === MessageType.IMAGE) return "image/*";
  if (type === MessageType.VIDEO) return "video/*";
  if (type === MessageType.DOCUMENT) return ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt";
  return "";
}

function getMessagePreview(message?: Message) {
  if (!message) return "Sem mensagens ainda.";
  if (message.body) return message.body;
  if (message.caption) return message.caption;
  if (message.type === MessageType.AUDIO) return "Audio compartilhado";
  if (message.type === MessageType.IMAGE) return "Imagem compartilhada";
  if (message.type === MessageType.VIDEO) return "Video compartilhado";
  if (message.type === MessageType.DOCUMENT) return "Documento enviado";
  return "Mensagem registrada";
}

function createTempMessage(input: {
  conversationId: string;
  type: MessageType;
  body: string;
  mediaUrl?: string | null;
  caption?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
}) {
  return {
    id: `temp-${Date.now()}`,
    body: input.body,
    type: input.type,
    mediaUrl: input.mediaUrl ?? null,
    mimeType: input.mimeType ?? null,
    fileName: input.fileName ?? null,
    caption: input.caption ?? null,
    durationSeconds: null,
    senderType: SenderType.USER,
    direction: MessageDirection.OUTBOUND,
    status: MessageStatus.SENT,
    externalMessageId: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    conversationId: input.conversationId,
    userId: null
  } satisfies Message;
}

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === MessageDirection.OUTBOUND;
  const bubbleClass = isOutbound
    ? "ml-auto bg-[linear-gradient(135deg,#0f766e_0%,#0b5f59_100%)] text-white"
    : "bg-white text-slate-700 ring-1 ring-slate-200/70";
  const metaClass = isOutbound ? "text-emerald-100" : "text-slate-400";

  return (
    <div className={cn("max-w-[86%] rounded-[24px] px-4 py-3 text-sm shadow-sm", bubbleClass)}>
      {message.type === MessageType.TEXT ? <p className="whitespace-pre-wrap leading-6">{message.body}</p> : null}

      {message.type === MessageType.IMAGE && message.mediaUrl ? (
        <div className="space-y-2">
          <Image
            src={message.mediaUrl}
            alt={message.caption || "Imagem recebida"}
            width={720}
            height={480}
            unoptimized
            className="max-h-80 w-full rounded-2xl object-cover"
          />
          {message.caption ? <p className="whitespace-pre-wrap leading-6">{message.caption}</p> : null}
        </div>
      ) : null}

      {message.type === MessageType.VIDEO && message.mediaUrl ? (
        <div className="space-y-2">
          <video controls className="max-h-80 w-full rounded-2xl bg-black/90">
            <source src={message.mediaUrl} />
          </video>
          {message.caption ? <p className="whitespace-pre-wrap leading-6">{message.caption}</p> : null}
        </div>
      ) : null}

      {message.type === MessageType.AUDIO && message.mediaUrl ? (
        <div className="space-y-2">
          <div className={cn("rounded-2xl px-3 py-3", isOutbound ? "bg-white/10" : "bg-slate-50")}>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium">
              <AudioLines className="h-4 w-4" />
              <span>{message.fileName || "Mensagem de audio"}</span>
            </div>
            <audio controls className="w-full">
              <source src={message.mediaUrl} />
            </audio>
          </div>
          {message.caption ? <p className="whitespace-pre-wrap leading-6">{message.caption}</p> : null}
        </div>
      ) : null}

      {message.type === MessageType.DOCUMENT ? (
        <div className="space-y-2">
          <div className={cn("flex items-center gap-3 rounded-2xl px-3 py-3", isOutbound ? "bg-white/10" : "bg-slate-50")}>
            <FileText className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-medium">{message.fileName || "Documento"}</p>
              <p className={cn("text-xs", metaClass)}>{message.mimeType || "Arquivo anexado"}</p>
            </div>
          </div>
          {message.mediaUrl ? (
            <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex text-xs font-medium underline underline-offset-4">
              Abrir arquivo
            </a>
          ) : null}
          {message.caption ? <p className="whitespace-pre-wrap leading-6">{message.caption}</p> : null}
        </div>
      ) : null}

      <div className={cn("mt-3 flex items-center justify-between gap-3 text-[11px]", metaClass)}>
        <span>{formatDateTime(message.createdAt)}</span>
        <span>{messageStatusLabels[message.status]}</span>
      </div>
    </div>
  );
}

export function ConversationInbox({ conversations }: { conversations: ConversationRow[] }) {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("conversationId") || conversations[0]?.id || "";
  const [conversationItems, setConversationItems] = useState(conversations);
  const [selectedId, setSelectedId] = useState(initialId);
  const [draft, setDraft] = useState("");
  const [messageType, setMessageType] = useState<MessageType>(MessageType.TEXT);
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setConversationItems(conversations);
  }, [conversations]);

  useEffect(() => {
    if (!selectedId && conversationItems[0]?.id) {
      setSelectedId(conversationItems[0].id);
    }
  }, [conversationItems, selectedId]);

  const selectedConversation = useMemo(
    () => conversationItems.find((conversation) => conversation.id === selectedId) ?? conversationItems[0],
    [conversationItems, selectedId]
  );

  useEffect(() => {
    if (selectedConversation?.id) {
      setMobileView("detail");
    }
  }, [selectedConversation?.id]);

  function resetComposer(nextType = messageType) {
    setDraft("");
    setCaption("");
    setMediaUrl("");
    setMimeType(null);
    setFileName(null);
    if (nextType !== messageType) {
      setMessageType(nextType);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFileSelection(file?: File) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setMediaUrl(typeof reader.result === "string" ? reader.result : "");
      setMimeType(file.type || null);
      setFileName(file.name);
      toast.success("Arquivo pronto para envio na conversa.");
    };
    reader.onerror = () => {
      toast.error("Nao foi possivel carregar o arquivo.");
    };
    reader.readAsDataURL(file);
  }

  if (conversationItems.length === 0) {
    return <EmptyState title="Nenhuma conversa ainda" description="Quando o modulo de WhatsApp receber mensagens, a inbox aparecera aqui." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card className={cn("h-[76vh] overflow-hidden border-white/80 p-0", mobileView === "detail" ? "hidden xl:block" : "block")}>
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Inbox WhatsApp</h2>
              <p className="text-sm text-slate-500">Bot, atendimento humano e multimidia no mesmo painel.</p>
            </div>
            <Badge tone="info">{conversationItems.length}</Badge>
          </div>
        </div>
        <div className="overflow-y-auto p-3">
          {conversationItems.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => {
                setSelectedId(conversation.id);
                setMobileView("detail");
              }}
              className={cn(
                "mb-3 w-full rounded-[24px] border p-4 text-left transition-all",
                selectedConversation?.id === conversation.id
                  ? "border-emerald-300 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(255,255,255,0.96))] shadow-sm"
                  : "border-slate-100 bg-white hover:-translate-y-0.5 hover:bg-slate-50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{conversation.lead.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{conversation.contactPhone || conversation.lead.whatsapp || conversation.lead.phone}</p>
                </div>
                <Badge tone="info">{conversationStatusLabels[conversation.status]}</Badge>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-500">{getMessagePreview(conversation.messages.at(-1))}</p>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                <span>{conversation.owner?.name || "Sem responsavel"}</span>
                <span>{formatDateTime(conversation.lastMessageAt || conversation.updatedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {selectedConversation ? (
        <Card className={cn("flex h-[76vh] flex-col overflow-hidden border-white/80 p-0", mobileView === "list" ? "hidden xl:flex" : "flex")}>
          <div className="border-b border-slate-100 bg-white/80 p-5 backdrop-blur-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 xl:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para conversas
                </button>
                <h3 className="truncate text-xl font-semibold text-slate-950">{selectedConversation.lead.fullName}</h3>
                <p className="truncate text-sm text-slate-500">{selectedConversation.subject || "Conversa WhatsApp"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info">{conversationStatusLabels[selectedConversation.status]}</Badge>
                <Link href={`/leads/${selectedConversation.lead.id}`} className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800">
                  Abrir lead
                </Link>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {composerModes.map((mode) => {
                const Icon = mode.icon;
                const active = messageType === mode.type;

                return (
                  <button
                    key={mode.type}
                    type="button"
                    onClick={() => resetComposer(mode.type)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition",
                      active ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.4),rgba(241,245,249,0.9))] p-5">
            {selectedConversation.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>

          <form
            className="border-t border-slate-100 bg-white/90 p-4 backdrop-blur-sm"
            onSubmit={(event) => {
              event.preventDefault();
              if (messageType === MessageType.TEXT && !draft.trim()) return;
              if (messageType !== MessageType.TEXT && !mediaUrl.trim()) return;

              startTransition(async () => {
                const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: messageType,
                    body: draft,
                    mediaUrl: mediaUrl || null,
                    mimeType,
                    caption: caption || null,
                    fileName
                  })
                });
                const data = await response.json();

                if (!response.ok) {
                  toast.error(data.error ?? "Nao foi possivel enviar a mensagem.");
                  return;
                }

                const optimisticMessage = createTempMessage({
                  conversationId: selectedConversation.id,
                  type: messageType,
                  body: draft,
                  mediaUrl: mediaUrl || null,
                  caption: caption || null,
                  mimeType,
                  fileName
                });

                setConversationItems((current) =>
                  current.map((conversation) =>
                    conversation.id === selectedConversation.id
                      ? {
                          ...conversation,
                          lastMessageAt: optimisticMessage.createdAt,
                          updatedAt: optimisticMessage.createdAt,
                          messages: [...conversation.messages, optimisticMessage]
                        }
                      : conversation
                  )
                );

                toast.success("Mensagem registrada na conversa.");
                resetComposer(MessageType.TEXT);
              });
            }}
          >
            <div className="grid gap-3">
              {messageType === MessageType.TEXT ? (
                <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Digite a resposta comercial com contexto e proximo passo..." />
              ) : (
                <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Arquivo ou URL publica</p>
                        <p className="text-xs text-slate-500">Use URL publica para envio real via WhatsApp. Upload local funciona como preview no CRM.</p>
                      </div>
                      <Select value={messageType} onChange={(event) => resetComposer(event.target.value as MessageType)} className="max-w-full sm:max-w-40">
                        {Object.entries(messageTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <Input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="Cole a URL publica da midia..." />

                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={getAcceptByType(messageType)}
                        className="hidden"
                        onChange={(event) => void handleFileSelection(event.target.files?.[0])}
                      />
                      <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="mr-2 h-4 w-4" />
                        Escolher arquivo
                      </Button>
                      <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                        <Link2 className="h-3.5 w-3.5" />
                        <span>{fileName || "Nenhum arquivo selecionado"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-sm font-medium text-slate-900">Preview</p>
                    {mediaUrl ? (
                      messageType === MessageType.IMAGE ? (
                        <Image src={mediaUrl} alt="Preview da imagem" width={480} height={320} unoptimized className="max-h-56 w-full rounded-2xl object-cover" />
                      ) : messageType === MessageType.VIDEO ? (
                        <video controls className="max-h-56 w-full rounded-2xl bg-black">
                          <source src={mediaUrl} />
                        </video>
                      ) : messageType === MessageType.AUDIO ? (
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <audio controls className="w-full">
                            <source src={mediaUrl} />
                          </audio>
                        </div>
                      ) : (
                        <div className="flex h-32 items-center gap-3 rounded-2xl bg-slate-50 p-4">
                          <FileText className="h-6 w-6 text-slate-500" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{fileName || "Documento"}</p>
                            <p className="truncate text-xs text-slate-500">{mimeType || "Arquivo anexado"}</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                        A pre-visualizacao da midia aparecera aqui.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <Input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Legenda, contexto ou instrucoes opcionais..." />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Enviando..." : "Enviar mensagem"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}

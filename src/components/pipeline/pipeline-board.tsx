"use client";

import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { type Conversation, type Interaction, LeadStage, LeadTemperature, type Lead, type Message, type User } from "@prisma/client";
import { BarChart3, Check, ChevronRight, GripVertical, LayoutGrid, Pencil, Rows3, Search, Siren } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { stageLabels, temperatureLabels } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

type PipelineLead = Lead & {
  owner: Pick<User, "name" | "id">;
  interactions?: Pick<Interaction, "content">[];
  conversations?: Array<Conversation & { messages: Pick<Message, "body" | "caption" | "fileName">[] }>;
};

const stages: LeadStage[] = [
  LeadStage.NEW,
  LeadStage.CONTACTED,
  LeadStage.QUALIFIED,
  LeadStage.SCHEDULED,
  LeadStage.EVALUATION_COMPLETED,
  LeadStage.PROPOSAL_SENT,
  LeadStage.NEGOTIATION,
  LeadStage.CLOSED,
  LeadStage.LOST
];

const PIPELINE_LABELS_KEY = "crm.pipeline.stage-labels";
const STALE_INTERACTION_HOURS = 72;

const stageTheme: Record<LeadStage, { border: string; bg: string; accent: string; soft: string }> = {
  NEW: { border: "border-sky-200", bg: "bg-sky-50/80", accent: "text-sky-700", soft: "bg-sky-100 text-sky-700" },
  CONTACTED: { border: "border-cyan-200", bg: "bg-cyan-50/80", accent: "text-cyan-700", soft: "bg-cyan-100 text-cyan-700" },
  QUALIFIED: { border: "border-violet-200", bg: "bg-violet-50/80", accent: "text-violet-700", soft: "bg-violet-100 text-violet-700" },
  SCHEDULED: { border: "border-amber-200", bg: "bg-amber-50/80", accent: "text-amber-700", soft: "bg-amber-100 text-amber-700" },
  EVALUATION_COMPLETED: { border: "border-orange-200", bg: "bg-orange-50/80", accent: "text-orange-700", soft: "bg-orange-100 text-orange-700" },
  PROPOSAL_SENT: { border: "border-indigo-200", bg: "bg-indigo-50/80", accent: "text-indigo-700", soft: "bg-indigo-100 text-indigo-700" },
  NEGOTIATION: { border: "border-fuchsia-200", bg: "bg-fuchsia-50/80", accent: "text-fuchsia-700", soft: "bg-fuchsia-100 text-fuchsia-700" },
  CLOSED: { border: "border-emerald-200", bg: "bg-emerald-50/80", accent: "text-emerald-700", soft: "bg-emerald-100 text-emerald-700" },
  LOST: { border: "border-rose-200", bg: "bg-rose-50/80", accent: "text-rose-700", soft: "bg-rose-100 text-rose-700" }
};

function requestStageMeta(stage: LeadStage) {
  if (stage === LeadStage.CLOSED) {
    const closedValue = window.prompt("Informe o valor fechado para concluir este lead.", "");
    if (closedValue === null) return null;
    return { closedValue };
  }

  if (stage === LeadStage.LOST) {
    const lossReason = window.prompt("Informe o motivo de perda para mover o lead.", "");
    if (lossReason === null) return null;
    if (!lossReason.trim()) {
      toast.error("Motivo de perda obrigatorio.");
      return null;
    }
    return { lossReason };
  }

  return {};
}

function getLeadConversationPreview(lead: PipelineLead) {
  const firstConversationMessage = lead.conversations?.[0]?.messages?.[0];
  if (firstConversationMessage?.body?.trim()) return firstConversationMessage.body.trim();
  if (firstConversationMessage?.caption?.trim()) return firstConversationMessage.caption.trim();
  if (firstConversationMessage?.fileName?.trim()) return firstConversationMessage.fileName.trim();

  const firstInteraction = lead.interactions?.[0]?.content?.trim();
  if (firstInteraction) return firstInteraction;

  if (lead.notes?.trim()) return lead.notes.trim();
  if (lead.whatsappTemplate?.trim()) return lead.whatsappTemplate.trim();

  return "Sem conversa registrada ainda.";
}

function needsAttention(lead: PipelineLead) {
  const now = Date.now();
  if (lead.nextActionAt && new Date(lead.nextActionAt).getTime() < now) return true;

  const referenceDate = lead.lastInteractionAt ?? lead.createdAt;
  if (!referenceDate) return false;

  return now - new Date(referenceDate).getTime() > STALE_INTERACTION_HOURS * 60 * 60 * 1000;
}

function PipelineLeadCard({
  lead,
  dragging = false,
  density
}: {
  lead: PipelineLead;
  dragging?: boolean;
  density: "compact" | "comfortable";
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { type: "lead", leadId: lead.id, stage: lead.stage }
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const temperatureTone = lead.temperature === LeadTemperature.HOT ? "success" : lead.temperature === LeadTemperature.WARM ? "warning" : "default";
  const contactLabel = lead.fullName?.trim() || lead.whatsapp || lead.phone;
  const secondaryContact = lead.whatsapp || lead.phone || lead.email || "-";
  const preview = getLeadConversationPreview(lead);
  const attention = needsAttention(lead);
  const isCompact = density === "compact";

  return (
    <div
      ref={setNodeRef}
      style={dragging ? undefined : style}
      onClick={() => {
        if (!dragging) {
          router.push(`/leads/${lead.id}`);
        }
      }}
      className={cn(
        "group cursor-pointer rounded-[20px] border border-slate-200/80 bg-white shadow-sm transition-all duration-200",
        isCompact ? "p-3" : "p-3.5",
        "hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md",
        attention && "border-amber-300 bg-[linear-gradient(180deg,rgba(255,251,235,0.95),rgba(255,255,255,1))] shadow-amber-100",
        (isDragging || dragging) && "rotate-1 border-emerald-300 shadow-xl shadow-emerald-950/10"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <button
              type="button"
              aria-label={`Arrastar ${lead.fullName}`}
              className="mt-0.5 rounded-lg p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              {...listeners}
              {...attributes}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate font-semibold text-slate-900", isCompact ? "text-sm" : "text-[15px]")} title={contactLabel}>
                {contactLabel}
              </p>
              <p className={cn("truncate text-slate-500", isCompact ? "text-[11px]" : "text-xs")} title={secondaryContact}>
                {secondaryContact}
              </p>
            </div>
          </div>
        </div>
        <Badge tone={temperatureTone} className="px-2 py-0.5 text-[10px]">
          {lead.temperature.slice(0, 1)}
        </Badge>
      </div>

      {attention ? (
        <div className="mt-2">
          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Atencao</span>
        </div>
      ) : null}

      <div className={cn("relative text-slate-500", isCompact ? "mt-2 text-[11px]" : "mt-2.5 text-xs")}>
        <p className={cn("line-clamp-2", isCompact ? "leading-4" : "leading-4.5")}>
          {preview}
        </p>
        {!dragging ? (
          <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-56 rounded-2xl bg-slate-950 px-3 py-2 text-[11px] leading-4 text-white shadow-xl group-hover:block">
            {preview}
          </div>
        ) : null}
      </div>

      <div className={cn("flex items-center justify-between", isCompact ? "mt-2.5" : "mt-3")}>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#d9f3ef_0%,#c7ecff_100%)] text-[10px] font-semibold text-emerald-900">
            {contactLabel
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("") || "LD"}
          </div>
          <span className="text-[11px] font-medium text-emerald-700 transition group-hover:text-emerald-800">Abrir lead</span>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
      </div>
    </div>
  );
}

function PipelineColumn({
  stage,
  leads,
  activeStage,
  label,
  editing,
  onStartEdit,
  onSaveLabel,
  density
}: {
  stage: LeadStage;
  leads: PipelineLead[];
  activeStage?: LeadStage | null;
  label: string;
  editing: boolean;
  onStartEdit: (stage: LeadStage) => void;
  onSaveLabel: (stage: LeadStage, nextLabel: string) => void;
  density: "compact" | "comfortable";
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage,
    data: { type: "stage", stage }
  });
  const [draftLabel, setDraftLabel] = useState(label);
  const theme = stageTheme[stage];
  const columnValue = leads.reduce((sum, lead) => sum + Number(lead.closedValue ?? lead.potentialValue ?? 0), 0);

  useEffect(() => {
    setDraftLabel(label);
  }, [label]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-[24px] border p-2.5 transition-all duration-200",
        density === "compact" ? "w-[168px]" : "w-[220px]",
        isOver || activeStage === stage ? `${theme.border} ${theme.bg} shadow-lg shadow-emerald-950/5` : "border-slate-200/70 bg-white/55"
      )}
    >
      <div className={cn("mb-2.5 rounded-[18px] bg-white px-3 py-3 shadow-sm ring-1 ring-inset ring-white/70", isOver || activeStage === stage ? theme.border : "")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={draftLabel}
                  onChange={(event) => setDraftLabel(event.target.value)}
                  className="h-8 rounded-xl px-3 py-1 text-xs"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onSaveLabel(stage, draftLabel);
                    }
                  }}
                  autoFocus
                />
                <Button type="button" variant="ghost" className="h-8 w-8 rounded-xl p-0" onClick={() => onSaveLabel(stage, draftLabel)}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button type="button" onClick={() => onStartEdit(stage)} className="group w-full text-left">
                <h3 className="line-clamp-2 text-xs font-semibold text-slate-900">{label}</h3>
                <span className={cn("mt-1 inline-flex items-center gap-1 text-[10px] transition group-hover:opacity-100", theme.accent, "opacity-70")}>
                  Renomear <Pencil className="h-3 w-3" />
                </span>
              </button>
            )}
          </div>
          <Badge className={cn("px-2 py-0.5 text-[10px]", theme.soft)}>
            {leads.length}
          </Badge>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
          <span className="text-slate-400">Valor da etapa</span>
          <span className={cn("font-semibold", theme.accent)}>{formatCurrency(columnValue)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {leads.length > 0 ? (
          leads.map((lead) => <PipelineLeadCard key={lead.id} lead={lead} density={density} />)
        ) : (
          <div className="rounded-[18px] border border-dashed border-slate-200 bg-white/70 px-3 py-5 text-center text-[11px] text-slate-400">
            Solte aqui
          </div>
        )}
      </div>
    </div>
  );
}

export function PipelineBoard({
  leads,
  users
}: {
  leads: PipelineLead[];
  users: Pick<User, "id" | "name">[];
}) {
  const [items, setItems] = useState(leads);
  const [ownerId, setOwnerId] = useState("");
  const [source, setSource] = useState("");
  const [temperature, setTemperature] = useState("");
  const [query, setQuery] = useState("");
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<LeadStage | null>(null);
  const [density, setDensity] = useState<"compact" | "comfortable">("compact");
  const [customStageLabels, setCustomStageLabels] = useState<Record<LeadStage, string>>(() => {
    if (typeof window === "undefined") return stageLabels;

    const saved = window.localStorage.getItem(PIPELINE_LABELS_KEY);
    if (!saved) return stageLabels;

    try {
      const parsed = JSON.parse(saved) as Partial<Record<LeadStage, string>>;
      return { ...stageLabels, ...parsed };
    } catch {
      window.localStorage.removeItem(PIPELINE_LABELS_KEY);
      return stageLabels;
    }
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filteredItems = useMemo(() => {
    return items.filter((lead) => {
      const matchesOwner = !ownerId || lead.ownerId === ownerId;
      const matchesSource = !source || lead.source.toLowerCase().includes(source.toLowerCase());
      const matchesTemperature = !temperature || lead.temperature === temperature;
      const matchesQuery =
        !query ||
        [lead.fullName, lead.phone, lead.whatsapp, lead.source, lead.company, lead.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());

      return matchesOwner && matchesSource && matchesTemperature && matchesQuery;
    });
  }, [items, ownerId, source, temperature, query]);

  const groupedItems = useMemo(
    () =>
      stages.reduce(
        (accumulator, stage) => {
          accumulator[stage] = filteredItems.filter((lead) => lead.stage === stage);
          return accumulator;
        },
        {} as Record<LeadStage, PipelineLead[]>
      ),
    [filteredItems]
  );

  const activeLead = useMemo(() => items.find((lead) => lead.id === activeLeadId) ?? null, [activeLeadId, items]);
  const attentionCount = useMemo(() => filteredItems.filter(needsAttention).length, [filteredItems]);
  const totalPipelineValue = useMemo(
    () => filteredItems.reduce((sum, lead) => sum + Number(lead.closedValue ?? lead.potentialValue ?? 0), 0),
    [filteredItems]
  );
  const hotLeads = useMemo(() => filteredItems.filter((lead) => lead.temperature === LeadTemperature.HOT).length, [filteredItems]);
  const activeStagesCount = useMemo(() => stages.filter((stage) => groupedItems[stage].length > 0).length, [groupedItems]);

  async function moveLead(leadId: string, stage: LeadStage) {
    const previousItems = items;
    const meta = requestStageMeta(stage);
    if (meta === null) return;

    const nextItems = items.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead));
    setItems(nextItems);

    const response = await fetch(`/api/leads/${leadId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, ...meta })
    });
    const data = await response.json();

    if (!response.ok) {
      setItems(previousItems);
      toast.error(data.error ?? "Nao foi possivel mover o lead.");
      return;
    }

    toast.success("Etapa atualizada.");
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveLeadId(null);

    const leadId = String(event.active.id);
    const targetStage = event.over?.id ? String(event.over.id) : null;
    if (!targetStage) return;

    const lead = items.find((item) => item.id === leadId);
    if (!lead) return;

    if (lead.stage === targetStage) return;
    if (!stages.includes(targetStage as LeadStage)) return;

    await moveLead(leadId, targetStage as LeadStage);
  }

  function saveStageLabel(stage: LeadStage, nextLabel: string) {
    const normalized = nextLabel.trim() || stageLabels[stage];
    const nextState = { ...customStageLabels, [stage]: normalized };
    setCustomStageLabels(nextState);
    setEditingStage(null);
    window.localStorage.setItem(PIPELINE_LABELS_KEY, JSON.stringify(nextState));
    toast.success("Nome da coluna atualizado.");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/80 bg-white/85">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Leads visiveis</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{filteredItems.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <LayoutGrid className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="border-white/80 bg-white/85">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Valor no pipeline</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{formatCurrency(totalPipelineValue)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="border-white/80 bg-white/85">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Leads quentes</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{hotLeads}</p>
            </div>
            <Badge tone="success" className="px-3 py-1.5">HOT</Badge>
          </div>
        </Card>
        <Card className="border-white/80 bg-white/85">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Pedem atencao</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{attentionCount}</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <Siren className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border-white/80 bg-white/80">
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[260px_190px_180px_160px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar lead"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 rounded-xl pl-9 pr-3 text-xs"
              />
            </div>
            <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              <option value="">Todos os responsaveis</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
            <Input placeholder="Origem" value={source} onChange={(e) => setSource(e.target.value)} className="h-10 rounded-xl px-3 text-xs" />
            <Select value={temperature} onChange={(e) => setTemperature(e.target.value)} className="h-10 rounded-xl px-3 text-xs">
              <option value="">Todas as temperaturas</option>
              {Object.entries(temperatureLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <div className="flex items-center gap-1.5">
              <Button type="button" variant={density === "compact" ? "secondary" : "ghost"} className="h-10 px-3 text-xs" onClick={() => setDensity("compact")}>
                <Rows3 className="mr-2 h-4 w-4" />
                Compacto
              </Button>
              <Button type="button" variant={density === "comfortable" ? "secondary" : "ghost"} className="h-10 px-3 text-xs" onClick={() => setDensity("comfortable")}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Conforto
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTemperature("HOT")}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                temperature === "HOT" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Leads quentes: {hotLeads}
            </button>
            <button
              type="button"
              onClick={() => {
                setOwnerId("");
                setSource("");
                setTemperature("");
                setQuery("");
              }}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-200"
            >
              Limpar filtros
            </button>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
              Atencao: {attentionCount}
            </span>
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium text-sky-700">
              Etapas ativas: {activeStagesCount}
            </span>
          </div>
        </div>
      </Card>

      <DndContext
        sensors={sensors}
        onDragStart={(event) => setActiveLeadId(String(event.active.id))}
        onDragCancel={() => setActiveLeadId(null)}
        onDragEnd={(event) => void handleDragEnd(event)}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-4">
            {stages.map((stage) => (
              <PipelineColumn
                key={stage}
                stage={stage}
                leads={groupedItems[stage]}
                activeStage={activeLead?.stage}
                label={customStageLabels[stage]}
                editing={editingStage === stage}
                onStartEdit={setEditingStage}
                onSaveLabel={saveStageLabel}
                density={density}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeLead ? <PipelineLeadCard lead={activeLead} dragging density={density} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

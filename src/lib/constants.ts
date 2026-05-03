import {
  ConversationStatus,
  EvaluationStatus,
  InvestmentRange,
  InteractionType,
  MessageDirection,
  MessageStatus,
  MessageType,
  WhatsAppCampaignRecipientStatus,
  WhatsAppCampaignSendMode,
  WhatsAppCampaignStatus,
  WhatsAppTemplateCategory,
  LeadSourcePrimary,
  LeadStage,
  LeadStatus,
  LeadTemperature,
  LeadUrgency,
  OpportunityStatus,
  TaskPriority,
  TaskStatus,
  TaskType,
  UserRole
} from "@prisma/client";

export const stageLabels: Record<LeadStage, string> = {
  NEW: "Novo Lead",
  CONTACTED: "Contato Feito",
  QUALIFIED: "Qualificado",
  SCHEDULED: "Agendado",
  EVALUATION_COMPLETED: "Avaliação Realizada",
  PROPOSAL_SENT: "Proposta Enviada",
  NEGOTIATION: "Negociação",
  CLOSED: "Fechado",
  LOST: "Perdido"
};

export const statusLabels: Record<LeadStatus, string> = {
  ACTIVE: "Ativo",
  WON: "Ganho",
  LOST: "Perdido",
  INACTIVE: "Inativo"
};

export const temperatureLabels: Record<LeadTemperature, string> = {
  COLD: "Frio",
  WARM: "Morno",
  HOT: "Quente"
};

export const interactionTypeLabels: Record<InteractionType, string> = {
  CALL: "Ligação",
  WHATSAPP: "WhatsApp",
  INSTAGRAM_DM: "Direct Instagram",
  CONSULTATION: "Consulta",
  EVALUATION: "Avaliação",
  MEETING: "Reunião",
  PROPOSAL: "Proposta Enviada",
  FOLLOW_UP: "Follow-up",
  NOTE: "Observação"
};

export const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  DRAFT: "Em elaboração",
  SENT: "Enviada",
  NEGOTIATING: "Em negociação",
  ACCEPTED: "Aceita",
  DECLINED: "Recusada"
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  PENDING: "Pendente",
  COMPLETED: "Concluída",
  OVERDUE: "Atrasada"
};

export const taskTypeLabels: Record<TaskType, string> = {
  CALL: "Ligar",
  WHATSAPP: "Enviar WhatsApp",
  SEND_PROPOSAL: "Enviar proposta",
  CONFIRM_EVALUATION: "Confirmar avaliação",
  FOLLOW_UP: "Follow-up",
  RETURN: "Retorno",
  OTHER: "Outro"
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta"
};

export const sourcePrimaryLabels: Record<LeadSourcePrimary, string> = {
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  INDICATION: "Indicação",
  PAID_TRAFFIC: "Tráfego pago",
  WEBSITE: "Site",
  EVENT: "Evento",
  OTHER: "Outro"
};

export const urgencyLabels: Record<LeadUrgency, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta"
};

export const investmentRangeLabels: Record<InvestmentRange, string> = {
  UP_TO_3K: "Até R$ 3 mil",
  BETWEEN_3K_10K: "R$ 3 mil a R$ 10 mil",
  BETWEEN_10K_25K: "R$ 10 mil a R$ 25 mil",
  ABOVE_25K: "Acima de R$ 25 mil",
  UNDEFINED: "Não informado"
};

export const evaluationStatusLabels: Record<EvaluationStatus, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Realizada",
  NO_SHOW: "Faltou",
  RESCHEDULED: "Remarcada",
  CANCELED: "Cancelada"
};

export const conversationStatusLabels: Record<ConversationStatus, string> = {
  OPEN: "Aberta",
  BOT_ACTIVE: "Bot ativo",
  WAITING_HUMAN: "Aguardando humano",
  CLOSED: "Encerrada"
};

export const messageStatusLabels: Record<MessageStatus, string> = {
  PENDING: "Pendente",
  SENT: "Enviada",
  DELIVERED: "Entregue",
  READ: "Lida",
  FAILED: "Falhou"
};

export const messageDirectionLabels: Record<MessageDirection, string> = {
  INBOUND: "Entrada",
  OUTBOUND: "Saida"
};

export const messageTypeLabels: Record<MessageType, string> = {
  TEXT: "Texto",
  AUDIO: "Audio",
  IMAGE: "Imagem",
  VIDEO: "Video",
  DOCUMENT: "Documento"
};

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  SELLER: "Vendedor"
};

export const whatsappTemplateCategoryLabels: Record<WhatsAppTemplateCategory, string> = {
  MARKETING: "Marketing",
  UTILITY: "Utilidade",
  AUTHENTICATION: "Autenticacao",
  SERVICE: "Servico"
};

export const whatsappCampaignStatusLabels: Record<WhatsAppCampaignStatus, string> = {
  DRAFT: "Rascunho",
  READY: "Pronta",
  PROCESSING: "Enviando",
  COMPLETED: "Concluida",
  PAUSED: "Pausada",
  FAILED: "Falhou"
};

export const whatsappCampaignSendModeLabels: Record<WhatsAppCampaignSendMode, string> = {
  TEXT: "Texto livre",
  TEMPLATE: "Template oficial"
};

export const whatsappCampaignRecipientStatusLabels: Record<WhatsAppCampaignRecipientStatus, string> = {
  QUEUED: "Na fila",
  SENT: "Enviada",
  DELIVERED: "Entregue",
  READ: "Lida",
  FAILED: "Falhou",
  SKIPPED: "Ignorada"
};

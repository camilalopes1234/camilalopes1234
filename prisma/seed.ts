import {
  EvaluationStatus,
  InteractionType,
  InvestmentRange,
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

import { prisma } from "../src/server/db/prisma";
import { hashPassword } from "../src/server/auth/password";

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.task.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword("12345678");

  const admin = await prisma.user.create({
    data: {
      name: "Camila Gestora",
      email: "admin@premiumsalescrm.com",
      passwordHash,
      role: UserRole.ADMIN,
      title: "Diretora Comercial"
    }
  });

  const seller = await prisma.user.create({
    data: {
      name: "Bruno Comercial",
      email: "comercial@premiumsalescrm.com",
      passwordHash,
      role: UserRole.SELLER,
      title: "Executivo Comercial"
    }
  });

  const [leadOne, leadTwo, leadThree, leadFour] = await Promise.all([
    prisma.lead.create({
      data: {
        fullName: "Mariana Souza",
        phone: "(11) 99888-1122",
        whatsapp: "5511998881122",
        email: "mariana@clinicaglow.com",
        instagram: "@marianaglow",
        company: "Clinica Glow",
        city: "Sao Paulo",
        state: "SP",
        sourcePrimary: LeadSourcePrimary.INSTAGRAM,
        sourceDetail: "Campanha harmonizacao premium",
        source: "Instagram organico",
        mainInterest: "Consultoria comercial para clinica",
        investmentRange: InvestmentRange.BETWEEN_10K_25K,
        urgency: LeadUrgency.HIGH,
        notes: "Lead decisora, quer acelerar captacao e fechamento.",
        stage: LeadStage.NEGOTIATION,
        status: LeadStatus.ACTIVE,
        temperature: LeadTemperature.HOT,
        potentialValue: 18000,
        nextActionAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        lastInteractionAt: new Date(),
        ownerId: admin.id
      }
    }),
    prisma.lead.create({
      data: {
        fullName: "Ricardo Lima",
        phone: "(21) 97777-3344",
        whatsapp: "5521977773344",
        email: "ricardo@institutovita.com",
        company: "Instituto Vita",
        city: "Rio de Janeiro",
        state: "RJ",
        sourcePrimary: LeadSourcePrimary.INDICATION,
        sourceDetail: "Indicacao de parceiro medico",
        source: "Indicacao",
        mainInterest: "Treinamento da equipe comercial",
        investmentRange: InvestmentRange.ABOVE_25K,
        urgency: LeadUrgency.MEDIUM,
        notes: "Tomador de decisao direto. Avaliando proposta com a socia.",
        stage: LeadStage.PROPOSAL_SENT,
        status: LeadStatus.ACTIVE,
        temperature: LeadTemperature.WARM,
        potentialValue: 24000,
        nextActionAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
        lastInteractionAt: new Date(),
        ownerId: seller.id
      }
    }),
    prisma.lead.create({
      data: {
        fullName: "Patricia Menezes",
        phone: "(31) 96666-7788",
        whatsapp: "5531966667788",
        city: "Belo Horizonte",
        state: "MG",
        sourcePrimary: LeadSourcePrimary.PAID_TRAFFIC,
        sourceDetail: "Meta Ads fundo de funil",
        source: "Trafego pago",
        mainInterest: "Mentoria de conversao",
        investmentRange: InvestmentRange.BETWEEN_3K_10K,
        urgency: LeadUrgency.HIGH,
        status: LeadStatus.WON,
        stage: LeadStage.CLOSED,
        temperature: LeadTemperature.HOT,
        potentialValue: 12500,
        closedValue: 11800,
        attendedEvaluation: true,
        closedAtEvaluation: true,
        ownerId: admin.id,
        lastInteractionAt: new Date()
      }
    }),
    prisma.lead.create({
      data: {
        fullName: "Fernanda Alves",
        phone: "(41) 95555-2211",
        whatsapp: "5541955552211",
        city: "Curitiba",
        state: "PR",
        sourcePrimary: LeadSourcePrimary.WHATSAPP,
        sourceDetail: "Atendimento receptivo",
        source: "WhatsApp inbound",
        mainInterest: "Estruturacao de processo comercial",
        investmentRange: InvestmentRange.BETWEEN_10K_25K,
        urgency: LeadUrgency.LOW,
        status: LeadStatus.LOST,
        stage: LeadStage.LOST,
        temperature: LeadTemperature.COLD,
        potentialValue: 15000,
        lossReason: "Sem budget para este trimestre",
        ownerId: seller.id,
        lastInteractionAt: new Date()
      }
    })
  ]);

  await prisma.interaction.createMany({
    data: [
      {
        leadId: leadOne.id,
        userId: admin.id,
        type: InteractionType.WHATSAPP,
        content: "Apresentacao inicial enviada e briefing comercial recebido.",
        occurredAt: new Date(),
        nextActionAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      },
      {
        leadId: leadOne.id,
        userId: admin.id,
        type: InteractionType.MEETING,
        content: "Reuniao diagnostica realizada com a decisora.",
        occurredAt: new Date()
      },
      {
        leadId: leadTwo.id,
        userId: seller.id,
        type: InteractionType.PROPOSAL,
        content: "Proposta enviada com plano de 90 dias.",
        occurredAt: new Date()
      }
    ]
  });

  await prisma.opportunity.createMany({
    data: [
      {
        title: "Projeto Growth Clinica Glow",
        leadId: leadOne.id,
        ownerId: admin.id,
        estimatedValue: 18000,
        status: OpportunityStatus.NEGOTIATING,
        sentAt: new Date(),
        returnAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        notes: "Plano com implantacao e acompanhamento comercial."
      },
      {
        title: "Treinamento Instituto Vita",
        leadId: leadTwo.id,
        ownerId: seller.id,
        estimatedValue: 24000,
        status: OpportunityStatus.SENT,
        sentAt: new Date(),
        returnAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
      }
    ]
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Follow-up da proposta Glow",
        leadId: leadOne.id,
        ownerId: admin.id,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: TaskStatus.PENDING,
        type: TaskType.FOLLOW_UP,
        priority: TaskPriority.HIGH
      },
      {
        title: "Retornar Instituto Vita",
        leadId: leadTwo.id,
        ownerId: seller.id,
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 4),
        status: TaskStatus.OVERDUE,
        type: TaskType.RETURN,
        priority: TaskPriority.MEDIUM
      },
      {
        title: "Confirmar avaliacao de Patricia",
        leadId: leadThree.id,
        ownerId: admin.id,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 6),
        status: TaskStatus.PENDING,
        type: TaskType.CONFIRM_EVALUATION,
        priority: TaskPriority.MEDIUM
      }
    ]
  });

  await prisma.evaluation.createMany({
    data: [
      {
        leadId: leadOne.id,
        ownerId: admin.id,
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        status: EvaluationStatus.CONFIRMED,
        attended: null,
        preNotes: "Cliente quer entender previsibilidade comercial."
      },
      {
        leadId: leadThree.id,
        ownerId: admin.id,
        scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        status: EvaluationStatus.COMPLETED,
        attended: true,
        preNotes: "Lead veio aquecida por trafego.",
        postNotes: "Fechou no mesmo dia com entrada aprovada."
      },
      {
        leadId: leadFour.id,
        ownerId: seller.id,
        scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        status: EvaluationStatus.NO_SHOW,
        attended: false,
        preNotes: "Precisava confirmar agenda na vespera."
      }
    ]
  });

  console.log("Seed concluido.");
  console.log("Admin:", admin.email, "senha:", "12345678");
  console.log("Comercial:", seller.email, "senha:", "12345678");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

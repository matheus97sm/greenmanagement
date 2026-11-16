import { Language } from "@/i18n";

export const locales = {
  [Language.PtBr]: {
    team: "A equipe",
    headlineReceived:
      "Recebemos o seu chamado. Ainda não foi pego por ninguém da equipe.",
    headlineAssigned: "{{who}} vai atender o seu chamado.",
    headlineInProgress: "{{who}} está cuidando do seu chamado.",
    headlineWaitingYou: "{{who}} precisa de uma resposta sua para continuar.",
    headlineResolved:
      "A equipe marcou o chamado como resolvido. Se o problema continuar, você pode reabri-lo.",
    headlineClosed:
      "Este chamado foi encerrado. Se o problema voltar, você pode reabri-lo.",
    firstResponse: "Primeira resposta prevista até {{date}}",
    firstResponseOverdue:
      "Primeira resposta prevista até {{date}} (esse prazo já passou)",
    resolution: "Solução prevista até {{date}}",
    resolutionOverdue: "Solução prevista até {{date}} (esse prazo já passou)",
    eventOpened: "Chamado aberto",
    eventAssigned: "{{name}} assumiu o chamado",
    eventWaiting: "Aguardando a sua resposta",
    eventResolved: "{{name}} marcou o chamado como resolvido",
    eventClosed: "Chamado encerrado",
    eventReopenedByYou: "Você reabriu o chamado",
    eventReopened: "Chamado reaberto",
    eventResumed: "Atendimento retomado",
    eventStarted: "Atendimento iniciado",
    handlerLabel: "Quem está cuidando",
    handlerNone: "Ainda ninguém",
    expectationLabel: "Previsão",
    expectationNone: "Sem previsão no momento",
    updatedLabel: "Última atualização",
    happenedTitle: "O que já aconteceu",
  },
  [Language.EnUs]: {
    team: "The team",
    headlineReceived:
      "We received your ticket. No one on the team has picked it up yet.",
    headlineAssigned: "{{who}} will handle your ticket.",
    headlineInProgress: "{{who}} is taking care of your ticket.",
    headlineWaitingYou: "{{who}} needs an answer from you to continue.",
    headlineResolved:
      "The team marked the ticket as resolved. If the problem continues, you can reopen it.",
    headlineClosed:
      "This ticket was closed. If the problem comes back, you can reopen it.",
    firstResponse: "First reply expected by {{date}}",
    firstResponseOverdue:
      "First reply expected by {{date}} (that date has already passed)",
    resolution: "Solution expected by {{date}}",
    resolutionOverdue:
      "Solution expected by {{date}} (that date has already passed)",
    eventOpened: "Ticket opened",
    eventAssigned: "{{name}} took the ticket",
    eventWaiting: "Waiting for your answer",
    eventResolved: "{{name}} marked the ticket as resolved",
    eventClosed: "Ticket closed",
    eventReopenedByYou: "You reopened the ticket",
    eventReopened: "Ticket reopened",
    eventResumed: "Work resumed",
    eventStarted: "Work started",
    handlerLabel: "Who is taking care of it",
    handlerNone: "No one yet",
    expectationLabel: "Expected",
    expectationNone: "No estimate at the moment",
    updatedLabel: "Last update",
    happenedTitle: "What has happened so far",
  },
};

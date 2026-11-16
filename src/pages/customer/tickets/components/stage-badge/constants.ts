import { CustomerStage } from "@/domain/enums";

export const STAGE_LABEL: Record<CustomerStage, string> = {
  [CustomerStage.Received]: "Recebido",
  [CustomerStage.Assigned]: "Atribuído",
  [CustomerStage.InProgress]: "Em atendimento",
  [CustomerStage.WaitingYou]: "Aguardando você",
  [CustomerStage.Resolved]: "Resolvido",
  [CustomerStage.Closed]: "Encerrado",
};

export const STAGE_COLOR: Record<CustomerStage, string> = {
  [CustomerStage.Received]: "violet",
  [CustomerStage.Assigned]: "blue",
  [CustomerStage.InProgress]: "blue",
  [CustomerStage.WaitingYou]: "orange",
  [CustomerStage.Resolved]: "teal",
  [CustomerStage.Closed]: "gray",
};

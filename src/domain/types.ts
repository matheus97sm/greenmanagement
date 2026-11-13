import { Status, Priority, Profile, EventType, HistoryType } from "./enums";

export interface Person {
  id: string;
  nome: string;
  email: string;
  perfil: Profile;
  locale: string;
  zoneinfo: string;
  grupo_id?: string;
  grupos_ids?: string[];
  empresa?: string;
}

export interface Group {
  id: string;
  nome: string;
  gestor_id: string;
}

export interface Category {
  id: string;
  nome: string;
  grupo_id: string;
}

export interface SlaPolicy {
  prioridade: Priority;
  primeira_resposta_horas: number;
  resolucao_horas: number;
}

export interface Ticket {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  categoria_id: string;
  grupo_id: string;
  prioridade: Priority;
  status: Status;
  solicitante_id: string;
  responsavel_id: string | null;
  aberto_em: string;
  atualizado_em: string;
  primeira_resposta_em: string | null;
  prazo_primeira_resposta: string;
  prazo_resolucao: string;
  sla_pausado: boolean;
  resolvido_em: string | null;
  fechado_em: string | null;
}

export interface Message {
  id: string;
  chamado_id: string;
  criada_em: string;
  autor_id: string;
  texto: string;
  interna: boolean;
}

export interface HistoryEntry {
  id: string;
  chamado_id: string;
  tipo: HistoryType;
  de: Status | null;
  para: Status | null;
  usuario_id: string;
  motivo: string | null;
  ocorrido_em: string;
}

interface EventBase<T extends string, P> {
  id: string;
  tipo: T;
  ocorrido_em: string;
  payload: P;
}

export type DomainEvent =
  | EventBase<EventType.TicketOpened, Ticket>
  | EventBase<
      EventType.TicketAssigned,
      { chamado_id: string; consultor_id: string }
    >
  | EventBase<EventType.MessageAdded, Message>
  | EventBase<
      EventType.StatusChanged,
      {
        chamado_id: string;
        de: Status;
        para: Status;
        motivo: string;
        usuario_id: string;
      }
    >;

export interface RawData {
  meta: {
    tenant: string;
    gerado_em: string;
    agora: string;
    observacao: string;
    status_possiveis: Status[];
    prioridades: Priority[];
  };
  grupos: Group[];
  categorias: Category[];
  sla: SlaPolicy[];
  usuarios: Person[];
  chamados: Ticket[];
  mensagens: Message[];
  historico: HistoryEntry[];
}

export type Snapshot = Omit<RawData, "meta"> & { agora: string };

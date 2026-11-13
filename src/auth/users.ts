import { Role } from "./enums";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  description: string;
}

export const ROLE_LABEL: Record<Role, string> = {
  [Role.Consultant]: "Consultora",
  [Role.Manager]: "Gestor",
  [Role.Customer]: "Cliente",
};

export const DEMO_PASSWORD = "senha123";

export const USERS: User[] = [
  {
    id: "ae4d6fdf-bd5b-4fe0-879a-f86c41012b99",
    name: "Marina Almeida",
    email: "marina.almeida@suporte.example",
    role: Role.Consultant,
    description: "Atende chamados",
  },
  {
    id: "875d257a-0dff-4428-a233-5332d0e67b86",
    name: "Ricardo Monteiro",
    email: "ricardo.monteiro@suporte.example",
    role: Role.Manager,
    description: "Gere a equipe",
  },
  {
    id: "56d2d480-1bd4-4e12-93cd-61db0bdf21e6",
    name: "Helena Fernandes",
    email: "helena.fernandes@lusitania.example",
    role: Role.Customer,
    description: "Abre chamados (Lisboa)",
  },
];

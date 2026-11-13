export type Role = "consultant" | "manager" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  description: string;
}

export const ROLE_LABEL: Record<Role, string> = {
  consultant: "Consultora",
  manager: "Gestor",
  customer: "Cliente",
};

export const DEMO_PASSWORD = "senha123";

export const USERS: User[] = [
  {
    id: "ae4d6fdf-bd5b-4fe0-879a-f86c41012b99",
    name: "Marina Almeida",
    email: "marina.almeida@suporte.example",
    role: "consultant",
    description: "Atende chamados",
  },
  {
    id: "875d257a-0dff-4428-a233-5332d0e67b86",
    name: "Ricardo Monteiro",
    email: "ricardo.monteiro@suporte.example",
    role: "manager",
    description: "Gere a equipe",
  },
  {
    id: "56d2d480-1bd4-4e12-93cd-61db0bdf21e6",
    name: "Helena Fernandes",
    email: "helena.fernandes@lusitania.example",
    role: "customer",
    description: "Abre chamados (Lisboa)",
  },
];

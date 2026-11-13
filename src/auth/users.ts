export type Role = "consultor" | "gestor" | "cliente";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  description: string;
}

export const ROLE_LABEL: Record<Role, string> = {
  consultor: "Consultora",
  gestor: "Gestor",
  cliente: "Cliente",
};

export const DEMO_PASSWORD = "senha123";

export const USERS: User[] = [
  {
    id: "u-marina",
    name: "Marina",
    email: "marina@greenmanagement.test",
    role: "consultor",
    description: "Atende chamados",
  },
  {
    id: "u-ricardo",
    name: "Ricardo",
    email: "ricardo@greenmanagement.test",
    role: "gestor",
    description: "Gere a equipe",
  },
  {
    id: "u-helena",
    name: "Helena",
    email: "helena@cliente.test",
    role: "cliente",
    description: "Abre chamados (Lisboa)",
  },
];

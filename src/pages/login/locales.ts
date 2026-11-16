import { Language } from "@/i18n";

export const locales = {
  [Language.PtBr]: {
    subtitle: "Entre para acessar os chamados",
    invalidCredentials: "E-mail ou senha inválidos.",
    emailLabel: "E-mail",
    passwordLabel: "Senha",
    submit: "Entrar",
    demoUsers: "Usuários de demonstração",
    sharedPassword: "Senha de todos: {{password}}",
    consultantDescription: "Atende chamados",
    managerDescription: "Gere a equipe",
    customerDescription: "Abre chamados (Lisboa)",
  },
  [Language.EnUs]: {
    subtitle: "Sign in to access the tickets",
    invalidCredentials: "Invalid e-mail or password.",
    emailLabel: "E-mail",
    passwordLabel: "Password",
    submit: "Sign in",
    demoUsers: "Demo users",
    sharedPassword: "Everyone's password: {{password}}",
    consultantDescription: "Handles tickets",
    managerDescription: "Manages the team",
    customerDescription: "Opens tickets (Lisbon)",
  },
};

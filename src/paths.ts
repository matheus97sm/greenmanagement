import { Role } from "./auth/enums";

export const homePath = (role: Role) => `/${role}/tickets`;

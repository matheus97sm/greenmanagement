import type { Role } from "./auth/users";

export const homePath = (role: Role) => `/${role}/tickets`;

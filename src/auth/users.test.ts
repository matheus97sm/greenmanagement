import { describe, expect, it } from "vitest";
import { rawData } from "@/test-data";
import { USERS } from "./users";
import { Profile } from "@/domain/enums";
import { Role } from "./enums";

const PROFILE = {
  [Role.Consultant]: Profile.Consultant,
  [Role.Manager]: Profile.Manager,
  [Role.Customer]: Profile.Customer,
} as const;

describe("demo users", () => {
  it("are the people from the brief, exactly as they are in dados.json", () => {
    for (const demo of USERS) {
      const person = rawData.usuarios.find((u) => u.id === demo.id);
      expect(person, demo.name).toBeDefined();
      expect(person?.nome).toBe(demo.name);
      expect(person?.email).toBe(demo.email);
      expect(person?.perfil).toBe(PROFILE[demo.role]);
    }
  });

  it("cover the three profiles", () => {
    expect(USERS.map((u) => u.role).sort()).toEqual([
      Role.Consultant,
      Role.Customer,
      Role.Manager,
    ]);
  });
});

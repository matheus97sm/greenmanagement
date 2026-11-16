import { describe, expect, it } from "vitest";
import { Profile } from "@/domain/enums";
import { rawData } from "@/test-data";
import { Role } from "./enums";
import { DEMO_PASSWORD, USERS } from "./users";

const PROFILE_OF_ROLE: Record<Role, Profile> = {
  [Role.Consultant]: Profile.Consultant,
  [Role.Manager]: Profile.Manager,
  [Role.Customer]: Profile.Customer,
};

describe("the demo users", () => {
  it("are the three people of the brief, one per profile", () => {
    expect(USERS.map((user) => user.role).sort()).toEqual(
      Object.values(Role).sort(),
    );
  });

  it("exist in the data with the same id, name, e-mail and profile", () => {
    for (const user of USERS) {
      const person = rawData.usuarios.find(
        (currentPerson) => currentPerson.id === user.id,
      );
      expect(person, user.name).toBeDefined();
      expect(person?.nome).toBe(user.name);
      expect(person?.email).toBe(user.email);
      expect(person?.perfil).toBe(PROFILE_OF_ROLE[user.role]);
    }
  });

  it("sign in with lower-case e-mails, as the sign-in compares them", () => {
    for (const user of USERS) expect(user.email).toBe(user.email.toLowerCase());
  });

  it("share one demo password", () => {
    expect(DEMO_PASSWORD).toBeTruthy();
  });
});

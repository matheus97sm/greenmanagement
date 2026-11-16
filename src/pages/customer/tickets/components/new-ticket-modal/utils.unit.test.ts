import { describe, expect, it } from "vitest";
import { Priority } from "@/domain/enums";
import type { Category } from "@/domain/types";
import { rawData } from "@/test-data";
import { IMPACT_LABEL, IMPACT_PRIORITY } from "./constants";
import { Impact } from "./enums";
import { impactOptions, isComplete, priorityOf, topicOptions } from "./utils";

const categories: Record<string, Category> = Object.fromEntries(
  rawData.categorias.map((category) => [category.id, category]),
);

describe("topicOptions", () => {
  const options = topicOptions(categories);

  it("offers every topic by its plain name", () => {
    expect(options).toHaveLength(8);
    expect(options.map((topicOption) => topicOption.label)).toContain(
      "Rede e VPN",
    );
  });

  it("uses the id of the category as the value", () => {
    const vpn = rawData.categorias.find(
      (category) => category.nome === "Rede e VPN",
    )!;
    expect(
      options.find((topicOption) => topicOption.label === "Rede e VPN")?.value,
    ).toBe(vpn.id);
  });

  it("lists them alphabetically", () => {
    const labels = options.map((topicOption) => topicOption.label);
    expect(labels).toEqual(
      [...labels].sort((first, second) => first.localeCompare(second, "pt")),
    );
  });

  it("never mentions the group that each topic belongs to", () => {
    for (const option of options) {
      expect(option.label).not.toMatch(/Infraestrutura|Aplicações/);
    }
  });

  it("is empty when there are no categories", () => {
    expect(topicOptions({})).toEqual([]);
  });
});

describe("impact", () => {
  it("has a question in plain words for every level", () => {
    for (const impact of Object.values(Impact)) {
      expect(IMPACT_LABEL[impact]).toBeTruthy();
    }
  });

  it("turns each answer into an internal priority the customer never sees", () => {
    expect(priorityOf(Impact.Everyone)).toBe(Priority.Critical);
    expect(priorityOf(Impact.Blocked)).toBe(Priority.High);
    expect(priorityOf(Impact.Slows)).toBe(Priority.Medium);
    expect(priorityOf(Impact.CanWait)).toBe(Priority.Low);
  });

  it("never maps two answers to the same priority", () => {
    const priorities = Object.values(IMPACT_PRIORITY);
    expect(new Set(priorities).size).toBe(priorities.length);
  });

  it("offers the answers from the most to the least serious", () => {
    expect(impactOptions().map((impactOption) => impactOption.value)).toEqual([
      Impact.Everyone,
      Impact.Blocked,
      Impact.Slows,
      Impact.CanWait,
    ]);
  });

  it("does not use the internal words in the labels", () => {
    for (const option of impactOptions()) {
      expect(option.label).not.toMatch(
        /crítica|alta|média|baixa|prioridade|SLA/i,
      );
    }
  });
});

describe("isComplete", () => {
  const form = { title: "VPN", description: "Não liga", topic: "cat-1" };

  it("is true when everything is filled in", () => {
    expect(isComplete(form)).toBe(true);
  });

  it("needs the summary, the description and the topic", () => {
    expect(isComplete({ ...form, title: "" })).toBe(false);
    expect(isComplete({ ...form, description: "" })).toBe(false);
    expect(isComplete({ ...form, topic: null })).toBe(false);
  });

  it("does not count blank spaces as something written", () => {
    expect(isComplete({ ...form, title: "   " })).toBe(false);
    expect(isComplete({ ...form, description: "\n  " })).toBe(false);
  });
});

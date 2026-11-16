import type { Priority } from "@/domain/enums";
import type { Category } from "@/domain/types";
import { IMPACT_LABEL, IMPACT_PRIORITY } from "./constants";
import { Impact } from "./enums";
import type { FormState, ImpactOption, TopicOption } from "./types";

export function topicOptions(
  categories: Record<string, Category>,
): TopicOption[] {
  return Object.values(categories)
    .map((category) => ({ value: category.id, label: category.nome }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt"));
}

export function impactOptions(): ImpactOption[] {
  return Object.values(Impact).map((impact) => ({
    value: impact,
    label: IMPACT_LABEL[impact],
  }));
}

export function priorityOf(impact: Impact): Priority {
  return IMPACT_PRIORITY[impact];
}

export function isComplete({ title, description, topic }: FormState): boolean {
  return Boolean(title.trim() && description.trim() && topic);
}

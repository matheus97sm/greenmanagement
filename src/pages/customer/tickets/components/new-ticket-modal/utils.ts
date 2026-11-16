import type { Priority } from "@/domain/enums";
import type { Category } from "@/domain/types";
import { IMPACT_KEY, IMPACT_PRIORITY } from "./constants";
import { Impact } from "./enums";
import type {
  FormState,
  ImpactOption,
  ModalTranslate,
  TopicOption,
} from "./types";

export function topicOptions(
  categories: Record<string, Category>,
): TopicOption[] {
  return Object.values(categories)
    .map((category) => ({ value: category.id, label: category.nome }))
    .sort((first, second) => first.label.localeCompare(second.label, "pt"));
}

export function impactOptions(translate: ModalTranslate): ImpactOption[] {
  return Object.values(Impact).map((impact) => ({
    value: impact,
    label: translate(IMPACT_KEY[impact]),
  }));
}

export function priorityOf(impact: Impact): Priority {
  return IMPACT_PRIORITY[impact];
}

export function isComplete({ title, description, topic }: FormState): boolean {
  return Boolean(title.trim() && description.trim() && topic);
}

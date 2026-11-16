import type { ComponentType } from "react";
import { Language } from "@/i18n";
import type { FlagProps, LanguageFlagProps } from "./types";

function BrazilFlag({ size }: FlagProps) {
  return (
    <svg
      width={size}
      height={(size * 2) / 3}
      viewBox="0 0 30 20"
      aria-hidden="true"
    >
      <rect width="30" height="20" fill="#009c3b" />
      <polygon points="15,2 27,10 15,18 3,10" fill="#ffdf00" />
      <circle cx="15" cy="10" r="4.2" fill="#002776" />
    </svg>
  );
}

function UnitedStatesFlag({ size }: FlagProps) {
  const stripes = Array.from({ length: 7 }, (_, index) => index * 2);
  return (
    <svg
      width={size}
      height={(size * 2) / 3}
      viewBox="0 0 30 20"
      aria-hidden="true"
    >
      <rect width="30" height="20" fill="#ffffff" />
      {stripes.map((stripe) => (
        <rect
          key={stripe}
          y={(stripe * 20) / 13}
          width="30"
          height={20 / 13}
          fill="#b22234"
        />
      ))}
      <rect width="12" height={(20 * 7) / 13} fill="#3c3b6e" />
    </svg>
  );
}

const FLAG_BY_LANGUAGE: Record<Language, ComponentType<FlagProps>> = {
  [Language.PtBr]: BrazilFlag,
  [Language.EnUs]: UnitedStatesFlag,
};

export function Flag({ language, size }: LanguageFlagProps) {
  const Component = FLAG_BY_LANGUAGE[language];
  return <Component size={size} />;
}

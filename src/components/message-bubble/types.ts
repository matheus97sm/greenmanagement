import type { Profile } from "@/domain/enums";

export interface Props {
  author: string;
  role: Profile | undefined;
  isOwn: boolean;
  internal: boolean;
  text: string;
  at: string;
  highlight?: boolean;
}

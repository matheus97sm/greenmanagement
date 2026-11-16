import { ApiErrorCode } from "@/domain/enums";
import { translatorFor } from "../translator";
import { ERROR_KEY } from "./constants";
import { locales } from "./locales";

type CodedError = { code: ApiErrorCode; params?: Record<string, string> };

function isCodedError(error: unknown): error is CodedError {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }
  return Object.values(ApiErrorCode).some((code) => code === error.code);
}

export function translateError(error: unknown): string {
  const translate = translatorFor(locales);
  if (!isCodedError(error)) return translate("unexpected");
  return translate(ERROR_KEY[error.code], error.params);
}

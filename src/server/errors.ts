import type { ApiErrorCode } from "@/domain/enums";

export type ApiErrorParams = Record<string, string>;

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly params: ApiErrorParams;

  constructor(code: ApiErrorCode, params: ApiErrorParams = {}) {
    super(code);
    this.code = code;
    this.params = params;
  }
}

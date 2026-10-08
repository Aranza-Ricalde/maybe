import "server-only";
import type { z } from "zod";
import type { AuthenticatedUser } from "@/domain/auth/ports";
import type { AppRoute } from "@/domain/shared/routes";
import { GENERIC_FAILURE_MESSAGE, INVALID_FORM_MESSAGE, NOT_FOUND_MESSAGE, actionFailed, actionOk, sentenceCase, type ActionResult } from "@/lib/actionResult";
import { parseForm, parseValue } from "@/lib/forms";
import { logFailure } from "@/lib/log";
import { requireUser } from "./dal";
import type { OwnershipCheck } from "./ownership";
import { revalidateRoutes } from "./revalidation";

type ExpectedError = abstract new (...args: never[]) => Error;

async function ownsEverything<I>(checks: ReadonlyArray<OwnershipCheck<I>> | undefined, input: I, familyId: number): Promise<boolean> {
  if (!checks || checks.length === 0) return true;
  const results = await Promise.all(checks.map((check) => check(input, familyId)));
  return results.every(Boolean);
}

export interface FormActionSpec<S extends z.ZodType> {
  schema: S;
  owns?: ReadonlyArray<OwnershipCheck<z.output<S>>>;
  run: (input: z.output<S>, user: AuthenticatedUser) => Promise<unknown>;
  revalidate: readonly AppRoute[];
  success: string | ((input: z.output<S>, result: unknown) => string);
  tolerate?: readonly ExpectedError[];
}

export async function runFormAction<S extends z.ZodType>(formData: FormData, spec: FormActionSpec<S>): Promise<ActionResult> {
  const user = await requireUser();
  const input = parseForm(formData, spec.schema);
  if (input === null) return actionFailed(INVALID_FORM_MESSAGE);
  if (!(await ownsEverything(spec.owns, input, user.familyId))) return actionFailed(NOT_FOUND_MESSAGE);

  let result: unknown;
  try {
    result = await spec.run(input, user);
  } catch (error) {
    if (spec.tolerate?.some((expected) => error instanceof expected)) return actionFailed(sentenceCase((error as Error).message));
    logFailure("falló una acción del formulario", error);
    return actionFailed(GENERIC_FAILURE_MESSAGE);
  }
  revalidateRoutes(spec.revalidate);
  return actionOk(typeof spec.success === "function" ? spec.success(input, result) : spec.success);
}

export interface UserActionSpec<R> {
  run: (user: AuthenticatedUser) => Promise<R>;
  revalidate: readonly AppRoute[];
  success: string | ((result: R) => string);
}

export async function runUserAction<R>(spec: UserActionSpec<R>): Promise<ActionResult & { value?: R }> {
  const user = await requireUser();
  let value: R;
  try {
    value = await spec.run(user);
  } catch (error) {
    logFailure("falló una acción del usuario", error);
    return actionFailed(GENERIC_FAILURE_MESSAGE);
  }
  revalidateRoutes(spec.revalidate);
  return { ...actionOk(typeof spec.success === "function" ? spec.success(value) : spec.success), value };
}

export interface QuerySpec<S extends z.ZodType, R> {
  schema: S;
  owns?: ReadonlyArray<OwnershipCheck<z.output<S>>>;
  run: (input: z.output<S>, user: AuthenticatedUser) => Promise<R>;
  whenInvalid: R;
}

export async function runQuery<S extends z.ZodType, R>(args: unknown, spec: QuerySpec<S, R>): Promise<R> {
  const user = await requireUser();
  const input = parseValue(args, spec.schema);
  if (input === null || !(await ownsEverything(spec.owns, input, user.familyId))) return spec.whenInvalid;
  return spec.run(input, user);
}

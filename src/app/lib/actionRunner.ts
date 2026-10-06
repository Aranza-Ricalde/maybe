import "server-only";
import type { z } from "zod";
import type { AuthenticatedUser } from "@/domain/auth/ports";
import type { AppRoute } from "@/domain/shared/routes";
import { parseForm, parseValue } from "@/lib/forms";
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
  tolerate?: readonly ExpectedError[];
}

export async function runFormAction<S extends z.ZodType>(formData: FormData, spec: FormActionSpec<S>): Promise<void> {
  const user = await requireUser();
  const input = parseForm(formData, spec.schema);
  if (input === null || !(await ownsEverything(spec.owns, input, user.familyId))) return;

  try {
    await spec.run(input, user);
  } catch (error) {
    if (spec.tolerate?.some((expected) => error instanceof expected)) return;
    throw error;
  }
  revalidateRoutes(spec.revalidate);
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

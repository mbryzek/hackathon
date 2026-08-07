/**
 * Reading one field out of a submitted form or a query string.
 *
 * Both `FormData.get` and `URLSearchParams.get` answer `string | null` (`FormData` can also
 * answer a `File`, which none of these fields ever is), so these take the value rather than
 * the container and work for a form action and a `load`'s search params alike.
 */

/** The trimmed value, or `''` when the field was absent. */
export function trimmed(value: FormDataEntryValue | string | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** The trimmed value, or `undefined` when it was absent or blank — what an optional API field wants. */
export function optionalText(value: FormDataEntryValue | string | null): string | undefined {
  return trimmed(value) || undefined;
}

/** A checkbox is present only when it is checked. */
export function checked(value: FormDataEntryValue | string | null): boolean {
  return value !== null;
}

/** The integer the field holds, or `fallback` when it holds anything else. */
export function integer(value: FormDataEntryValue | string | null, fallback: number): number {
  const parsed = Number.parseInt(trimmed(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * The value, but only when it is one of `allowed` — so a hand-edited URL or form cannot put an
 * unknown enum member into an API call. Anything else reads as "not set".
 */
export function oneOf<T extends string>(value: FormDataEntryValue | string | null, allowed: readonly T[]): T | undefined {
  const text = trimmed(value);
  return allowed.find((candidate) => candidate === text);
}

/** Tri-state `true` / `false` / not set, for a filter whose third option is "All". */
export function optionalBoolean(value: FormDataEntryValue | string | null): boolean | undefined {
  const text = trimmed(value);
  if (text === 'true') return true;
  if (text === 'false') return false;
  return undefined;
}

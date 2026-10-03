/**
 * The "this form's action is in flight" flag every form here disables itself with.
 *
 * `enhance` is the `use:enhance` callback: it raises the flag on submit, lets SvelteKit apply
 * the result with `update(updateOptions)` — so field reset and invalidation behave exactly as
 * an un-enhanced `update()` would unless the caller says otherwise — and lowers the flag in a
 * `finally`, so an action that throws cannot leave the form disabled for good.
 *
 * `run` is the same flag for a submit that is not a form action (a client-side API call).
 */

import type { SubmitFunction } from '@sveltejs/kit';

/** What `update()` takes: whether to reset the form, and whether to invalidate all loads. */
export type UpdateOptions = { reset?: boolean; invalidateAll?: boolean };

export interface Submitting {
  /** True from submit until the result has been applied, or the attempt failed. */
  readonly active: boolean;
  enhance: SubmitFunction;
  run: <T>(work: () => Promise<T>) => Promise<T>;
}

export function createSubmitting(updateOptions?: UpdateOptions): Submitting {
  let active = $state(false);

  return {
    get active() {
      return active;
    },
    enhance: () => {
      active = true;
      return async ({ update }) => {
        try {
          await update(updateOptions);
        } finally {
          active = false;
        }
      };
    },
    run: async (work) => {
      active = true;
      try {
        return await work();
      } finally {
        active = false;
      }
    }
  };
}

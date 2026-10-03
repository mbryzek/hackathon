/**
 * Driving a form's `use:enhance` callback by hand, the way SvelteKit would around a submission.
 *
 * A test mocks `$app/forms` with an `enhance` that hands the callback to `captureEnhance`, then
 * calls `submit` to raise the submission and `settle` on what it returns to apply a result — or
 * to fail applying one, which is how a test shows a form re-enables itself after an action that
 * threw.
 */

import type { SubmitFunction } from '@sveltejs/kit';

let captured: SubmitFunction | undefined;

/** The `$app/forms` `enhance` mock: records the callback the form was enhanced with. */
export function captureEnhance(_form: HTMLFormElement, submit?: SubmitFunction): { destroy: () => void } {
  captured = submit;
  return { destroy: () => {} };
}

export interface Submission {
  /** Applies the result through `update`, which resolves or — with `fail` — rejects. */
  settle: (fail?: Error) => Promise<{ reset?: boolean; invalidateAll?: boolean } | undefined>;
}

/** Starts a submission of the form last enhanced. */
export async function submit(): Promise<Submission> {
  if (!captured) throw new Error('no form was enhanced: mock $app/forms with captureEnhance');
  const formElement = document.createElement('form');
  const action = new URL('http://localhost/');
  const formData = new FormData();
  const after = await captured({
    action,
    formData,
    formElement,
    controller: new AbortController(),
    submitter: null,
    cancel: () => {}
  });

  return {
    settle: async (fail) => {
      let options: { reset?: boolean; invalidateAll?: boolean } | undefined;
      const update = (opts?: { reset?: boolean; invalidateAll?: boolean }) => {
        options = opts;
        return fail ? Promise.reject(fail) : Promise.resolve();
      };
      if (after) await after({ action, formData, formElement, result: { type: 'success', status: 200 }, update });
      return options;
    }
  };
}

import { describe, it, expect } from 'vitest';
import { createSubmitting } from './submitting.svelte';

function enhanceInput() {
  return {
    action: new URL('http://localhost/'),
    formData: new FormData(),
    formElement: {} as HTMLFormElement,
    controller: new AbortController(),
    submitter: null,
    cancel: () => {}
  };
}

function afterInput(update: (opts?: { reset?: boolean; invalidateAll?: boolean }) => Promise<void>) {
  return { ...enhanceInput(), result: { type: 'success' as const, status: 200 }, update };
}

describe('createSubmitting', () => {
  it('is active from submit until the result is applied', async () => {
    const submitting = createSubmitting();
    expect(submitting.active).toBe(false);

    const after = await submitting.enhance(enhanceInput());
    expect(submitting.active).toBe(true);

    await after!(afterInput(() => Promise.resolve()));
    expect(submitting.active).toBe(false);
  });

  it('is not left active when applying the result throws', async () => {
    const submitting = createSubmitting();
    const after = await submitting.enhance(enhanceInput());

    await expect(after!(afterInput(() => Promise.reject(new Error('boom'))))).rejects.toThrow('boom');
    expect(submitting.active).toBe(false);
  });

  it('passes its update options through, and none when given none', async () => {
    const seen: Array<{ reset?: boolean; invalidateAll?: boolean } | undefined> = [];
    const record = (opts?: { reset?: boolean; invalidateAll?: boolean }) => {
      seen.push(opts);
      return Promise.resolve();
    };

    await (await createSubmitting().enhance(enhanceInput()))!(afterInput(record));
    await (await createSubmitting({ reset: false }).enhance(enhanceInput()))!(afterInput(record));

    expect(seen).toEqual([undefined, { reset: false }]);
  });

  it('run is active for the work, returns its value, and resets when it throws', async () => {
    const submitting = createSubmitting();
    let release: (value: string) => void = () => {};
    const pending = submitting.run(() => new Promise<string>((resolve) => (release = resolve)));

    expect(submitting.active).toBe(true);
    release('done');
    expect(await pending).toBe('done');
    expect(submitting.active).toBe(false);

    await expect(submitting.run(() => Promise.reject(new Error('down')))).rejects.toThrow('down');
    expect(submitting.active).toBe(false);
  });
});

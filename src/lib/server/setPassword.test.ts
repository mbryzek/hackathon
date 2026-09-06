import { describe, it, expect } from 'vitest';
import { reasonToRefuse } from './setPassword';

/**
 * The two refusals that happen before the API is called at all. Everything else about a
 * password — length, characters, reuse — is the platform's to judge, and a second copy of that
 * judgment here would reject passwords the API would have taken.
 */
describe('reasonToRefuse', () => {
  it('sends a filled-in, matching pair to the API', () => {
    expect(reasonToRefuse('anything at all', 'anything at all')).toBeNull();
  });

  it('refuses an empty password', () => {
    expect(reasonToRefuse('', '')).toBe('Choose a password.');
  });

  it('refuses a pair that does not match', () => {
    expect(reasonToRefuse('one', 'other')).toBe('The two passwords do not match.');
  });

  it('imposes no length, character or complexity rule of its own', () => {
    expect(reasonToRefuse('a', 'a')).toBeNull();
    expect(reasonToRefuse('    ', '    ')).toBeNull();
  });
});

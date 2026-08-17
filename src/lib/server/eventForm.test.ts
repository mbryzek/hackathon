import { describe, it, expect } from 'vitest';
import { EventStatus } from '$lib/api/client';
import { parseEventForm } from './eventForm';

function formData(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.append(name, value);
  return form;
}

describe('parseEventForm', () => {
  it('trims the text fields and keeps a known status', () => {
    const { value, error } = parseEventForm(formData({ name: '  Hack Night  ', key: ' hack-night ', status: EventStatus.Open }));

    expect(error).toBeNull();
    expect(value).toEqual({ name: 'Hack Night', key: 'hack-night', status: EventStatus.Open });
  });

  it('falls back to Draft for a missing or hand-edited status', () => {
    expect(parseEventForm(formData({ name: 'A', key: 'a' })).value.status).toBe(EventStatus.Draft);
    expect(parseEventForm(formData({ name: 'A', key: 'a', status: 'archived' })).value.status).toBe(EventStatus.Draft);
  });

  it('reports the missing field by name, and hands back what was submitted', () => {
    const blankName = parseEventForm(formData({ name: '   ', key: 'a' }));
    expect(blankName.error).toBe('Please enter an event name');
    expect(blankName.value.key).toBe('a');

    expect(parseEventForm(formData({ name: 'A', key: '' })).error).toBe('Please enter an event key');
  });
});

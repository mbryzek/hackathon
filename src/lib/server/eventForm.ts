/**
 * Reading and validating the one event form — "an event's name, key and status" — which both
 * the create and the edit action submit.
 *
 * This sits a level above `fields.ts`, which reads a single field: the whole point here is that
 * there is ONE list of allowed statuses and ONE validation vocabulary, so the same mistake gets
 * the same message whichever page the admin is on.
 */
import { EventStatus } from '$lib/api/client';
import { oneOf, trimmed } from '$lib/server/fields';

const EVENT_STATUSES = Object.values(EventStatus);

export interface EventFormValues {
  name: string;
  key: string;
  status: EventStatus;
}

export interface ParsedEventForm {
  /** What was submitted, always — a rejected submit hands these back so the form keeps what was typed. */
  value: EventFormValues;
  /** The first validation failure, or `null` when the form is good to send. */
  error: string | null;
}

export function parseEventForm(form: FormData): ParsedEventForm {
  const value: EventFormValues = {
    name: trimmed(form.get('name')),
    key: trimmed(form.get('key')),
    status: oneOf(form.get('status'), EVENT_STATUSES) ?? EventStatus.Draft
  };

  if (!value.name) {
    return { value, error: 'Please enter an event name' };
  }
  if (!value.key) {
    return { value, error: 'Please enter an event key' };
  }

  return { value, error: null };
}

import { EventStatus, VoterType } from '$lib/api/client';

/**
 * Display metadata for the generated `EventStatus` / `VoterType` enums.
 *
 * Everything here is keyed by `Record<Enum, …>` on purpose: adding a member to either
 * enum in the API Builder spec breaks the build here instead of silently falling through
 * to whatever the old `default:` arm happened to return. Several call sites previously
 * rendered an unknown status as "Draft" yellow and an unknown voter type as "Parent".
 */

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  [EventStatus.Draft]: 'Draft',
  [EventStatus.Open]: 'Open',
  [EventStatus.Closed]: 'Closed'
};

const EVENT_STATUS_BADGE_CLASSES: Record<EventStatus, string> = {
  [EventStatus.Draft]: 'bg-yellow-100 text-yellow-800',
  [EventStatus.Open]: 'bg-green-100 text-green-800',
  [EventStatus.Closed]: 'bg-gray-100 text-gray-800'
};

const VOTER_TYPE_LABELS: Record<VoterType, string> = {
  [VoterType.Student]: 'Student',
  [VoterType.Parent]: 'Parent'
};

const VOTER_TYPE_BADGE_CLASSES: Record<VoterType, string> = {
  [VoterType.Student]: 'bg-blue-100 text-blue-800',
  [VoterType.Parent]: 'bg-purple-100 text-purple-800'
};

export const EVENT_STATUS_OPTIONS: { value: EventStatus; label: string }[] = Object.values(EventStatus).map((value) => ({
  value,
  label: EVENT_STATUS_LABELS[value]
}));

export const VOTER_TYPE_OPTIONS: { value: VoterType; label: string }[] = Object.values(VoterType).map((value) => ({
  value,
  label: VOTER_TYPE_LABELS[value]
}));

export function eventStatusLabel(status: EventStatus): string {
  return EVENT_STATUS_LABELS[status];
}

export function eventStatusBadgeClass(status: EventStatus): string {
  return EVENT_STATUS_BADGE_CLASSES[status];
}

export function voterTypeLabel(voterType: VoterType): string {
  return VOTER_TYPE_LABELS[voterType];
}

export function voterTypeBadgeClass(voterType: VoterType): string {
  return VOTER_TYPE_BADGE_CLASSES[voterType];
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

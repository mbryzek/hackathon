/**
 * Domain fixtures for the tests, built against the generated client's types.
 *
 * The point of these is the absence of `as`: a fixture written inline and cast past its type
 * keeps compiling when the apibuilder spec adds a required field, so the mocks quietly stop
 * resembling the API while every test still passes. Built here, a spec change breaks `npm run
 * check` and names the fixture.
 *
 * Every one takes `overrides`, so a test states only the field it is about.
 *
 * The types and enums come straight from `$generated`, not through `$lib/api/client`: a test
 * that mocks the client module (the vote pages do — they fake `voteApi`) would otherwise take
 * the enums away from the fixtures with it.
 */

import { EventStatus, VoterType, type Event as VoteEvent, type Project, type ProjectVote, type Vote } from '$generated/com-bryzek-vote-api';
import type { Code, CodeSummary, EventResults, ProjectTally, Tally } from '$generated/com-bryzek-vote-admin';
import { FileType, type File } from '$generated/com-bryzek-platform-storage';

/** Nothing asserts on a timestamp; one constant keeps them out of the way. */
const TIMESTAMP = '2026-01-01T00:00:00Z';

export function anEvent(overrides: Partial<VoteEvent> = {}): VoteEvent {
  return {
    id: 'evt-1',
    key: 'hack',
    name: 'Hack Night',
    status: EventStatus.Draft,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
    ...overrides
  };
}

export function aProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'prj-1',
    event: { id: 'evt-1' },
    name: 'Alpha',
    position: 0,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
    ...overrides
  };
}

export function aCode(overrides: Partial<Code> = {}): Code {
  return {
    id: 'code-1',
    event: { id: 'evt-1' },
    code: 'AAAA',
    voter_type: VoterType.Student,
    has_voted: false,
    created_at: TIMESTAMP,
    ...overrides
  };
}

/** The counts are self-consistent — 2 student + 1 parent code is the `total` of 3. */
export function aCodeSummary(overrides: Partial<CodeSummary> = {}): CodeSummary {
  return {
    total: 3,
    student: { codes: 2, votes: 1 },
    parent: { codes: 1, votes: 0 },
    ...overrides
  };
}

/** One tally per vote count, in the order given; the project ids carry the count so bars differ. */
export function aTally(voteCounts: number[] = []): Tally {
  const projects: ProjectTally[] = voteCounts.map((vote_count, index) => ({
    project: aProject({ id: `p-${index}-${vote_count}`, name: `Project ${index}`, position: index }),
    vote_count
  }));

  return { total_votes: voteCounts.reduce((sum, count) => sum + count, 0), projects };
}

export function anEventResults(student: number[] = [], parent: number[] = []): EventResults {
  return { event: anEvent(), student: aTally(student), parent: aTally(parent) };
}

export function aProjectVote(overrides: Partial<ProjectVote> = {}): ProjectVote {
  return { project: aProject(), selected: false, ...overrides };
}

export function aVote(overrides: Partial<Vote> = {}): Vote {
  return {
    voter_type: VoterType.Student,
    max_votes: 1,
    event: anEvent(),
    projects: [
      aProjectVote({ project: aProject({ id: 'p1', name: 'Team 1', position: 0 }) }),
      aProjectVote({ project: aProject({ id: 'p2', name: 'Team 2', position: 1 }) })
    ],
    ...overrides
  };
}

export function aFile(overrides: Partial<File> = {}): File {
  return { id: 'file-1', name: 'codes.csv', type: FileType.Csv, url: 'https://example.test/codes.csv', ...overrides };
}

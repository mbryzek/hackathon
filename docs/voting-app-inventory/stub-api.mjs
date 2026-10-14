/* global process, console, Buffer, URL */
// An in-memory stand-in for every platform endpoint the voting app, the admin console and the
// emailed-link pages call. It exists for two reasons:
//
//   1. It is how the screenshots in ./screenshots were taken: `capture.mjs` points the SvelteKit
//      dev server at this process instead of api.idempotent.io.
//   2. It is a runnable statement of the contract in ../voting-app-inventory.md — the paths, the
//      status codes, the response shapes and the validation messages the platform returns — so a
//      rebuild can be developed against it with no access to the platform.
//
// Rules it implements are the platform's (vote/app/vote/** in mbryzek/platform), simplified only
// where the simplification is invisible to the frontend: no persistence, no audit columns, one
// hard-coded admin.
//
//   node docs/voting-app-inventory/stub-api.mjs 9417
//
// `POST /_stub/scenario` with `{"name": "..."}` swaps the fixture set; see SCENARIOS below.

import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password';
const STUDENT_MAX_VOTES = 1;
const PARENT_MAX_VOTES = 3;
const RESERVED_KEYS = ['admin'];
const BAD_PREFIXES = ['SH', 'SO', 'SX', 'PU', 'PP', 'PO'];
// The platform's non-ambiguous alphabets: no 0/O, 1/I/L.
const DIGITS = '23456789';
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}-${randomBytes(8).toString('hex')}`;
const pick = (alphabet) => alphabet[randomBytes(1)[0] % alphabet.length];

/** Everything the server holds. Replaced wholesale by a scenario. */
let db;

const ADMIN_USER = {
  id: 'usr-admin',
  tenant: { id: 'hackathon' },
  person: {
    id: 'prs-admin',
    tenant: { id: 'hackathon' },
    email: { id: 'eml-admin', address: ADMIN_EMAIL, verified_at: '2026-01-07T03:33:13Z' },
    name: 'Event Admin',
    time_zone: 'america_new_york'
  },
  status: 'active',
  role: 'admin'
};

function seed({ openEvents = 1 } = {}) {
  const created = '2026-03-01T14:00:00Z';
  const events = [
    {
      id: 'evt-y26',
      key: 'hackathon-2026',
      name: 'BT Hackathon 2026',
      status: openEvents > 0 ? 'open' : 'closed',
      created_at: created,
      updated_at: created
    },
    {
      id: 'evt-y26b',
      key: 'demo-day-2026',
      name: 'BT Demo Day 2026',
      status: openEvents > 1 ? 'open' : 'draft',
      created_at: created,
      updated_at: created
    },
    {
      id: 'evt-y25',
      key: 'hackathon-2025',
      name: 'BT Hackathon 2025',
      status: 'closed',
      created_at: '2025-03-01T14:00:00Z',
      updated_at: '2025-03-02T20:00:00Z'
    }
  ];
  const projectNames = [
    ['Study Buddy', 'Pairs students who are reviewing the same unit'],
    ['Lunch Line', 'Predicts how long the cafeteria line will be'],
    ['Bus Tracker', 'Shows where the school buses are right now'],
    ['Club Finder', 'A quiz that suggests clubs to join'],
    ['Recycle Right', 'Tells you which bin an item belongs in'],
    ['Quiet Spaces', 'Finds an empty room to study in'],
    ['Homework Planner', undefined]
  ];
  const projects = projectNames.map(([name, description], i) => ({
    id: `prj-${i + 1}`,
    event: { id: 'evt-y26' },
    name,
    ...(description ? { description } : {}),
    position: i + 1,
    created_at: created,
    updated_at: created
  }));
  const codes = [
    ['SA2345', 'student'],
    ['SB3456', 'student'],
    ['SC4567', 'student'],
    ['SD5678', 'student'],
    ['SE6789', 'student'],
    ['SF2468', 'student'],
    ['SG3579', 'student'],
    ['SJ4682', 'student'],
    ['PA2345', 'parent'],
    ['PB3456', 'parent'],
    ['PC4567', 'parent'],
    ['PD5678', 'parent']
  ].map(([code, voter_type], i) => ({ id: `vcd-${i + 1}`, event_id: 'evt-y26', code, voter_type, created_at: created }));
  const votes = [
    ['vcd-1', 'prj-1'],
    ['vcd-2', 'prj-1'],
    ['vcd-3', 'prj-3'],
    ['vcd-4', 'prj-2'],
    ['vcd-5', 'prj-1'],
    ['vcd-9', 'prj-2'],
    ['vcd-9', 'prj-3'],
    ['vcd-9', 'prj-5'],
    ['vcd-10', 'prj-2'],
    ['vcd-10', 'prj-1']
  ].map(([code_id, project_id]) => ({ id: id('vot'), code_id, project_id }));
  return {
    events,
    projects,
    codes,
    votes,
    sessions: new Set(),
    files: new Map(),
    activations: new Set(['welcome-token']),
    resets: new Set(['reset-token']),
    verifications: new Set(['verify-token'])
  };
}

const SCENARIOS = {
  default: () => seed({ openEvents: 1 }),
  'two-open': () => seed({ openEvents: 2 }),
  'none-open': () => seed({ openEvents: 0 })
};

db = SCENARIOS.default();

// ---------------------------------------------------------------- helpers

const liveEvents = () => db.events.filter((e) => !e.deleted_at);
const eventById = (eventId) => liveEvents().find((e) => e.id === eventId);
const eventByKey = (key) => liveEvents().find((e) => e.key === key);
const projectsOf = (eventId) => db.projects.filter((p) => p.event.id === eventId).sort((a, b) => a.position - b.position);
const votesOf = (codeId) => db.votes.filter((v) => v.code_id === codeId);
const maxVotes = (code) => (code.voter_type === 'parent' ? PARENT_MAX_VOTES : STUDENT_MAX_VOTES);
const publicEvent = ({ id: eventId, key, name, status, created_at, updated_at }) => ({
  id: eventId,
  key,
  name,
  status,
  created_at,
  updated_at
});
const invalid = (...messages) => [422, messages.map((message) => ({ discriminator: 'validation', message }))];
const unauthorized = (message) => [401, { discriminator: 'unauthorized', message }];
const NOT_FOUND = [404, null];
const NO_CONTENT = [204, null];

function voteModel(event, code) {
  const selected = new Set(votesOf(code.id).map((v) => v.project_id));
  return {
    voter_type: code.voter_type,
    max_votes: maxVotes(code),
    event: publicEvent(event),
    projects: projectsOf(event.id).map((project) => ({ project, selected: selected.has(project.id) }))
  };
}

/** `wrapOption` in VotesServiceImpl: unknown event key is a 404, unknown code a 422. Codes match case-insensitively. */
function withCode(key, rawCode, f) {
  const event = eventByKey(key);
  if (!event) return NOT_FOUND;
  const code = db.codes.find(
    (c) =>
      c.event_id === event.id &&
      c.code ===
        String(rawCode ?? '')
          .trim()
          .toUpperCase()
  );
  if (!code) return invalid('Invalid code');
  return f(event, code);
}

function adminSession(sessionId) {
  return { session: { id: sessionId }, user: ADMIN_USER };
}

function validateEventForm(form, existing) {
  const errors = [];
  const key = String(form.key ?? '').trim();
  const name = String(form.name ?? '').trim();
  if (!key) errors.push('key cannot be blank');
  else if (RESERVED_KEYS.includes(key.toLowerCase())) errors.push(`Key ${key} is a reserved word and cannot be used for events`);
  else if (/[^A-Za-z0-9\-_+.]/.test(key))
    errors.push(
      `'${key}' contains 1 or more characters that are not URL safe: ${[...new Set(key.replace(/[A-Za-z0-9\-_+.]/g, ''))].sort().join(', ')}`
    );
  else if (key.length < 4) errors.push('Key must be at least 4 characters long');
  else if (liveEvents().some((e) => e.key === key && e.id !== existing?.id)) errors.push(`Event with key '${key}' already exists`);
  if (!name) errors.push('name cannot be blank');
  return { errors, value: { key, name, status: form.status ?? 'draft' } };
}

function generateCode(event, voterType, taken) {
  for (let attempt = 0; attempt < 100; attempt++) {
    let prefix;
    do prefix = (voterType === 'parent' ? 'P' : 'S') + pick(LETTERS);
    while (BAD_PREFIXES.includes(prefix));
    const candidate = prefix + Array.from({ length: 4 }, () => pick(DIGITS)).join('');
    if (!taken.has(candidate) && !db.codes.some((c) => c.event_id === event.id && c.code === candidate)) return candidate;
  }
  throw new Error('Failed to generate unique code after 100 attempts');
}

function filterCodes(eventId, { voterType, hasVoted, q }) {
  const voted = new Set(db.votes.map((v) => v.code_id));
  return db.codes.filter(
    (c) =>
      c.event_id === eventId &&
      (!voterType || c.voter_type === voterType) &&
      (hasVoted === undefined || voted.has(c.id) === hasVoted) &&
      (!q || c.code.toLowerCase().includes(q.toLowerCase()))
  );
}

function codeModel(code) {
  return {
    id: code.id,
    event: { id: code.event_id },
    code: code.code,
    voter_type: code.voter_type,
    has_voted: votesOf(code.id).length > 0,
    created_at: code.created_at
  };
}

function tally(eventId, voterType) {
  const counts = new Map();
  for (const v of db.votes) {
    const code = db.codes.find((c) => c.id === v.code_id);
    const project = db.projects.find((p) => p.id === v.project_id);
    if (code?.voter_type === voterType && project?.event.id === eventId) counts.set(project.id, (counts.get(project.id) ?? 0) + 1);
  }
  const projects = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([projectId, vote_count]) => ({ project: db.projects.find((p) => p.id === projectId), vote_count }));
  return { total_votes: projects.reduce((sum, p) => sum + p.vote_count, 0), projects };
}

const optionalBoolean = (value) => (value === 'true' ? true : value === 'false' ? false : undefined);

// ---------------------------------------------------------------- routes

/** Each route: method, a path pattern, and a handler returning [status, body]. */
const routes = [
  // ---- vote-api: public, no credential
  [
    'GET',
    '/vote/events/all/open',
    () => [
      200,
      liveEvents()
        .filter((e) => e.status === 'open')
        .map(publicEvent)
    ]
  ],
  ['POST', '/vote/events/:key/code/verifications', ({ params, body }) => withCode(params.key, body.code, (e, c) => [200, voteModel(e, c)])],
  [
    'POST',
    '/vote/events/:key',
    ({ params, body }) =>
      withCode(params.key, body.code, (event, code) => {
        const ids = [...new Set(body.project_ids ?? [])];
        const missing = ids.filter((pid) => !projectsOf(event.id).some((p) => p.id === pid));
        if (missing.length > 0) return invalid(...missing.map((pid) => `Cannot find project with id '${pid}'`));
        if (ids.length > maxVotes(code)) {
          return invalid(
            maxVotes(code) === 1 ? 'You can only vote for 1 project' : `You can only vote for up to ${maxVotes(code)} projects`
          );
        }
        db.votes = db.votes
          .filter((v) => v.code_id !== code.id)
          .concat(ids.map((project_id) => ({ id: id('vot'), code_id: code.id, project_id })));
        return [200, voteModel(event, code)];
      })
  ],

  // ---- vote-admin: session
  [
    'POST',
    '/vote/admin/sessions/logins',
    ({ body }) => {
      if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) return invalid('Invalid email or password');
      const sessionId = id('ses');
      db.sessions.add(sessionId);
      return [201, adminSession(sessionId)];
    }
  ],
  ['GET', '/vote/admin/session', ({ sessionId }) => [200, adminSession(sessionId)], { auth: true }],
  ['DELETE', '/vote/admin/session', ({ sessionId }) => (db.sessions.delete(sessionId), NO_CONTENT), { auth: true }],

  // ---- vote-admin: events
  [
    'GET',
    '/vote/admin/events',
    ({ query }) => {
      const statuses = query.getAll('status');
      const limit = Number(query.get('limit') ?? 100);
      const offset = Number(query.get('offset') ?? 0);
      const rows = liveEvents().filter((e) => statuses.length === 0 || statuses.includes(e.status));
      return [200, rows.slice(offset, offset + limit).map(publicEvent)];
    },
    { auth: true }
  ],
  [
    'GET',
    '/vote/admin/events/:id',
    ({ params }) => (eventById(params.id) ? [200, publicEvent(eventById(params.id))] : NOT_FOUND),
    { auth: true }
  ],
  [
    'POST',
    '/vote/admin/events',
    ({ body }) => {
      const { errors, value } = validateEventForm(body);
      if (errors.length > 0) return invalid(...errors);
      const event = { id: id('evt'), ...value, created_at: now(), updated_at: now() };
      db.events.push(event);
      return [201, publicEvent(event)];
    },
    { auth: true }
  ],
  [
    'PUT',
    '/vote/admin/events/:id',
    ({ params, body }) => {
      const event = eventById(params.id);
      if (!event) return NOT_FOUND;
      const { errors, value } = validateEventForm(body, event);
      if (errors.length > 0) return invalid(...errors);
      Object.assign(event, value, { updated_at: now() });
      return [200, publicEvent(event)];
    },
    { auth: true }
  ],
  [
    'DELETE',
    '/vote/admin/events/:id',
    ({ params }) => {
      const event = eventById(params.id);
      if (!event) return NOT_FOUND;
      // Soft delete, and the key is rewritten to `<id>:<key>` so a new event can reuse it.
      Object.assign(event, { key: `${event.id}:${event.key}`, deleted_at: now() });
      return NO_CONTENT;
    },
    { auth: true }
  ],

  // ---- vote-admin: projects
  [
    'GET',
    '/vote/admin/events/:eventId/projects',
    ({ params, query }) => {
      const limit = Number(query.get('limit') ?? 100);
      const offset = Number(query.get('offset') ?? 0);
      return [200, projectsOf(params.eventId).slice(offset, offset + limit)];
    },
    { auth: true }
  ],
  [
    'POST',
    '/vote/admin/events/:eventId/projects',
    ({ params, body }) => {
      if (!eventById(params.eventId)) return NOT_FOUND;
      const name = String(body.name ?? '').trim();
      if (!name) return invalid('name cannot be blank');
      const position = Math.max(0, ...projectsOf(params.eventId).map((p) => p.position)) + 1;
      const description = String(body.description ?? '').trim();
      const project = {
        id: id('prj'),
        event: { id: params.eventId },
        name,
        ...(description ? { description } : {}),
        position,
        created_at: now(),
        updated_at: now()
      };
      db.projects.push(project);
      return [201, project];
    },
    { auth: true }
  ],
  [
    'POST',
    '/vote/admin/events/:eventId/projects/csv',
    ({ params, body }) => {
      if (!eventById(params.eventId)) return NOT_FOUND;
      // One project per non-blank line, split on the FIRST comma only; a row whose name is
      // `team_name` (any case) is the header and is dropped.
      const rows = String(body.data ?? '')
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '')
        .map((line) => {
          const comma = line.indexOf(',');
          return comma < 0 ? { name: line.trim() } : { name: line.slice(0, comma).trim(), description: line.slice(comma + 1).trim() };
        });
      if (rows.some((r) => !r.name)) return invalid('name cannot be blank');
      const imported = rows.filter((r) => r.name.toLowerCase() !== 'team_name');
      if (body.delete_all_projects) {
        const doomed = new Set(projectsOf(params.eventId).map((p) => p.id));
        db.votes = db.votes.filter((v) => !doomed.has(v.project_id));
        db.projects = db.projects.filter((p) => !doomed.has(p.id));
      }
      const start = body.delete_all_projects ? 1 : Math.max(0, ...projectsOf(params.eventId).map((p) => p.position)) + 1;
      imported.forEach((r, i) =>
        db.projects.push({
          id: id('prj'),
          event: { id: params.eventId },
          name: r.name,
          ...(r.description ? { description: r.description } : {}),
          position: start + i,
          created_at: now(),
          updated_at: now()
        })
      );
      return NO_CONTENT;
    },
    { auth: true }
  ],
  [
    'POST',
    '/vote/admin/events/:eventId/projects/reorder',
    ({ params, body }) => {
      if (!eventById(params.eventId)) return NOT_FOUND;
      const ids = [...new Set(body.project_ids ?? [])];
      if (ids.length === 0) return invalid('Must have at least one project id');
      const all = projectsOf(params.eventId);
      const missing = ids.filter((pid) => !all.some((p) => p.id === pid));
      if (missing.length > 0) return invalid(...missing.map((pid) => `Cannot find project with id '${pid}'`));
      // Named projects first in their CURRENT relative order, then the rest; positions restart at 0.
      const ordered = [...all.filter((p) => ids.includes(p.id)), ...all.filter((p) => !ids.includes(p.id))];
      ordered.forEach((p, position) => Object.assign(p, { position }));
      return NO_CONTENT;
    },
    { auth: true }
  ],
  [
    'GET',
    '/vote/admin/events/:eventId/projects/:id',
    ({ params }) => {
      const project = db.projects.find((p) => p.id === params.id);
      return project ? [200, project] : NOT_FOUND;
    },
    { auth: true }
  ],
  [
    'PUT',
    '/vote/admin/events/:eventId/projects/:id',
    ({ params, body }) => {
      const project = db.projects.find((p) => p.id === params.id);
      if (!project) return NOT_FOUND;
      const name = String(body.name ?? '').trim();
      if (!name) return invalid('name cannot be blank');
      const description = String(body.description ?? '').trim();
      Object.assign(project, { name, updated_at: now() });
      if (description) project.description = description;
      else delete project.description;
      return [200, project];
    },
    { auth: true }
  ],
  [
    'DELETE',
    '/vote/admin/events/:eventId/projects/:id',
    ({ params }) => {
      if (!db.projects.some((p) => p.id === params.id)) return NOT_FOUND;
      db.votes = db.votes.filter((v) => v.project_id !== params.id);
      db.projects = db.projects.filter((p) => p.id !== params.id);
      return NO_CONTENT;
    },
    { auth: true }
  ],

  // ---- vote-admin: codes
  [
    'GET',
    '/vote/admin/events/:eventId/codes',
    ({ params, query }) => {
      const limit = Number(query.get('limit') ?? 100);
      const offset = Number(query.get('offset') ?? 0);
      const rows = filterCodes(params.eventId, {
        voterType: query.get('voter_type'),
        hasVoted: optionalBoolean(query.get('has_voted')),
        q: query.get('q')
      });
      return [200, rows.slice(offset, offset + limit).map(codeModel)];
    },
    { auth: true }
  ],
  [
    'GET',
    '/vote/admin/events/:eventId/codes/summary',
    ({ params }) => {
      if (!eventById(params.eventId)) return NOT_FOUND;
      const of = (voterType) => {
        const codes = db.codes.filter((c) => c.event_id === params.eventId && c.voter_type === voterType);
        return { codes: codes.length, votes: codes.reduce((sum, c) => sum + votesOf(c.id).length, 0) };
      };
      const student = of('student');
      const parent = of('parent');
      return [200, { total: student.codes + parent.codes, student, parent }];
    },
    { auth: true }
  ],
  [
    'POST',
    '/vote/admin/events/:eventId/codes/generate',
    ({ params, body }) => {
      const event = eventById(params.eventId);
      const errors = [];
      if (!event) errors.push(`Cannot find event with id '${params.eventId}'`);
      else if (event.status === 'closed') errors.push(`Event status is ${event.status}: no codes can be generated`);
      if (!['student', 'parent'].includes(body.voter_type)) errors.push(`Invalid voter type: ${body.voter_type}`);
      if (!(body.count >= 1)) errors.push('Count must be >= 1');
      else if (body.count > 1000) errors.push('Count must be <= 1000');
      if (errors.length > 0) return invalid(...errors);
      const taken = new Set();
      for (let i = 0; i < body.count; i++) {
        const code = generateCode(event, body.voter_type, taken);
        taken.add(code);
        db.codes.push({ id: id('vcd'), event_id: event.id, code, voter_type: body.voter_type, created_at: now() });
      }
      return NO_CONTENT;
    },
    { auth: true }
  ],
  [
    'POST',
    '/vote/admin/events/:eventId/codes/exports',
    ({ params, body, origin }) => {
      const event = eventById(params.eventId);
      if (!event) return NOT_FOUND;
      if (body.format !== 'csv' && body.format !== 'pdf')
        return invalid(`Cannot export voting codes as '${body.format}': supported formats are Csv, Pdf`);
      const rows = filterCodes(event.id, { voterType: body.voter_type, hasVoted: body.has_voted, q: body.q });
      const fileId = id('fil');
      const name = `${event.key}-codes.${body.format}`;
      // The real PDF is printable business cards; the stub serves a text placeholder for it.
      const contents =
        body.format === 'csv'
          ? [
              'type,code,votes',
              ...rows
                .sort((a, b) => a.voter_type.localeCompare(b.voter_type) || a.code.localeCompare(b.code))
                .map((c) => `${c.voter_type},${c.code},${votesOf(c.id).length}`)
            ].join('\n')
          : `PDF placeholder: ${rows.length} cards for ${event.name}`;
      db.files.set(fileId, { name, contents, type: body.format });
      return [201, { id: fileId, name, type: body.format, url: `${origin}/_stub/files/${fileId}` }];
    },
    { auth: true }
  ],
  [
    'DELETE',
    '/vote/admin/events/:eventId/codes/:id',
    ({ params }) => {
      if (!db.codes.some((c) => c.id === params.id && c.event_id === params.eventId)) return NOT_FOUND;
      db.votes = db.votes.filter((v) => v.code_id !== params.id);
      db.codes = db.codes.filter((c) => c.id !== params.id);
      return NO_CONTENT;
    },
    { auth: true }
  ],

  // ---- vote-admin: results
  [
    'GET',
    '/vote/admin/events/:eventId/results',
    ({ params }) => {
      const event = eventById(params.eventId);
      if (!event) return NOT_FOUND;
      return [200, { event: publicEvent(event), student: tally(event.id, 'student'), parent: tally(event.id, 'parent') }];
    },
    { auth: true }
  ],

  // ---- platform: the emailed links. Tokens that are not in the fixture set resolve to nothing.
  ['PUT', '/email/verifications/:token', ({ params }) => (db.verifications.has(params.token) ? NO_CONTENT : NOT_FOUND)],
  [
    'GET',
    '/activations/:token',
    ({ params }) =>
      db.activations.has(params.token)
        ? [200, { user: { id: ADMIN_USER.id }, name: 'Event Admin', email: ADMIN_USER.person.email, expires_at: '2026-12-01T00:00:00Z' }]
        : NOT_FOUND
  ],
  [
    'POST',
    '/activations/:token/password',
    ({ params }) => {
      if (!db.activations.delete(params.token)) return NOT_FOUND;
      return [201, tenantSession()];
    }
  ],
  [
    'POST',
    '/tenant/:tenant/session/password/resets',
    ({ body }) => (String(body.email ?? '').trim() ? NO_CONTENT : invalid('email cannot be blank'))
  ],
  [
    'POST',
    '/tenant/:tenant/session/password/changes',
    ({ body }) =>
      db.resets.delete(body.id)
        ? [201, tenantSession()]
        : invalid('Reset password link has expired - please request a new link to change your password')
  ],

  // ---- the stub's own controls
  [
    'POST',
    '/_stub/scenario',
    ({ body }) => (SCENARIOS[body.name] ? ((db = SCENARIOS[body.name]()), NO_CONTENT) : invalid(`Unknown scenario ${body.name}`))
  ],
  ['GET', '/_stub/files/:id', ({ params }) => (db.files.has(params.id) ? [200, db.files.get(params.id).contents, 'text/plain'] : NOT_FOUND)]
];

function tenantSession() {
  const sessionId = id('ses');
  db.sessions.add(sessionId);
  return {
    discriminator: 'tenant_session',
    session: { id: sessionId },
    user: ADMIN_USER,
    tenant: { id: 'hackathon', name: 'Hackathon' },
    enabled_features: [],
    password_change_required: false
  };
}

function match(pattern, path) {
  const want = pattern.split('/');
  const got = path.split('/');
  if (want.length !== got.length) return null;
  const params = {};
  for (let i = 0; i < want.length; i++) {
    if (want[i].startsWith(':')) params[want[i].slice(1)] = decodeURIComponent(got[i]);
    else if (want[i] !== got[i]) return null;
  }
  return params;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, session_id, X-Bypass-Rate-Limit'
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS).end();
    return;
  }
  for (const [method, pattern, handler, options] of routes) {
    const params = method === req.method ? match(pattern, url.pathname) : null;
    if (!params) continue;
    const sessionId = req.headers['session_id'];
    let result;
    if (options?.auth && !db.sessions.has(sessionId)) {
      result = unauthorized('Session not found');
    } else {
      result = handler({ params, query: url.searchParams, body: await readBody(req), sessionId, origin: url.origin });
    }
    const [status, body, contentType = 'application/json'] = result;
    res.writeHead(status, { ...CORS, 'Content-Type': contentType });
    res.end(body === null ? undefined : contentType === 'application/json' ? JSON.stringify(body) : body);
    console.log(`${req.method} ${url.pathname} -> ${status}`);
    return;
  }
  res.writeHead(404, CORS).end();
  console.log(`${req.method} ${url.pathname} -> 404 (no route)`);
});

const port = Number(process.argv[2] ?? 9417);
server.listen(port, '127.0.0.1', () => console.log(`stub api listening on http://localhost:${port}`));

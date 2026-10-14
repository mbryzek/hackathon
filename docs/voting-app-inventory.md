# Voting app, admin console and account pages: rebuild inventory

Everything a person needs to rebuild the bthackathon.com judging/voting app, its admin console and
the account pages (sign-in, password reset, invitation, email verification) with **no access to the
platform** at api.idempotent.io. It describes the app as it stands at the commit this file lands in.

What lives where:

| Path                                     | What it is                                                                                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/voting-app-inventory.md`           | This document.                                                                                                                                                                                                     |
| `docs/voting-app-inventory/screenshots/` | One PNG per screen and state, 38 in all. Voter screens are at phone width (390px), everything else at 1280px.                                                                                                      |
| `docs/voting-app-inventory/specs/`       | The API Builder specs that define the contract, copied verbatim from `mbryzek/platform`: `vote-api.json`, `vote-admin.json`, `db-vote.json` (the database tables), `playwright-vote.json` (test-only seeding API). |
| `docs/voting-app-inventory/stub-api.mjs` | An in-memory Node server implementing every endpoint the app calls, with the platform's rules and messages. Develop a rebuild against it.                                                                          |
| `docs/voting-app-inventory/capture.mjs`  | Re-takes every screenshot against the stub.                                                                                                                                                                        |

To run the current app with no platform:

    node docs/voting-app-inventory/stub-api.mjs 9417
    VITE_API_BASE_URL=http://127.0.0.1:9417 npm run dev -- --port 5281
    # sign in at /vote/admin/login as admin@example.com / password
    # vote at /vote/hackathon-2026 with code SJ4682 (student) or PC4567 (parent)
    node docs/voting-app-inventory/capture.mjs http://localhost:5281 http://127.0.0.1:9417

## 1. What the app is

Projects are presented at the hackathon. Everyone in the room votes from a phone:

- **Students** get a card with a code starting `S`. A student code casts **one** vote.
- **Parents and guests** get a card with a code starting `P`. A parent code casts **up to three** votes.

Each card carries a QR code that opens `/vote/<event key>?code=<code>`, so voting is: scan, tap your
favourite project(s), Submit. A voter can come back with the same code and change their vote for as
long as the event is open. Organizers run everything from `/vote/admin`: create the event, load the
projects, print the code cards, open voting, and put the live results on the projector.

| Noun    | Definition                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Event   | One voting session, e.g. "BT Hackathon 2026". Has a URL key (`hackathon-2026`) and a status: `draft`, `open`, `closed`.         |
| Project | A team's entry in one event. Name, optional description, display position.                                                      |
| Code    | A 6-character voting credential for one event, typed `student` or `parent`. There are no voter accounts: the code is the voter. |
| Vote    | One (code, project) pair. A student code holds at most 1, a parent code at most 3.                                              |
| Admin   | A platform user of tenant `hackathon` whose role is `admin`. The only kind of account the site has.                             |

There are no judges or scored rubrics in the software. "Judging" on the day is the two popular
votes above, reported separately (student and parent); the published rubric pages (`/Y25/rubric`,
`/Y26/rubric`) are static content scored on paper and are not part of this app.

## 2. Routes and pages

All routes live in `src/routes`. The public marketing pages are prerendered; every route below opts
out (`prerender = false`) because it needs a server or a token.

### Voter routes (no sign-in)

| Route                                  | Rendering                              | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Screenshot                                                                                                                               |
| -------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/vote`                                | SSR shell, data fetched in the browser | Lists **open** events (`GET /vote/events/all/open`). Exactly one open event: redirects straight to `/vote/<key>`. Several: "Select an Event" list. None: "No Active Events". Fetch failure: error card with Try Again.                                                                                                                                                                                                                                                           | `vote-01-select-event`, `vote-02-no-active-events`                                                                                       |
| `/vote/<event_key>`                    | client-only (`ssr = false`)            | The layout re-fetches the open-events list and finds the key. Not in the list: "Voting Not Available". Fetch failed: "Couldn't load this event" with Try Again (distinct on purpose: the event may be open). Otherwise the code form "Enter your code" (placeholder `AB1234`). `?code=` in the URL is verified automatically on load (the QR path).                                                                                                                              | `vote-03-voting-not-available`, `vote-04-enter-code`, `vote-05-invalid-code`                                                             |
| `/vote/<event_key>` after a good code  | same page, swapped in place            | The ballot. Header: event name, "Voting as: Student" or "Voting as: Parent/Guest", and a badge "Select 1 project" / "Select up to 3 projects" with "N of M selected". One card per project in position order (name, description). Student: radio buttons. Parent: checkboxes; once 3 are picked the rest disable. Projects the code already voted for are pre-selected. Submit Vote is disabled until at least one is picked. Focus moves to the ballot heading when it appears. | `vote-06-ballot-student`, `vote-07-ballot-student-selected`, `vote-09-ballot-parent-prior-votes`, `vote-10-ballot-parent-three-selected` |
| `/vote/<event_key>/thanks?code=<code>` | client                                 | "Thank You! Your vote has been recorded successfully." Re-verifies the code to list "You voted for:". "Change My Vote" links back with the code; "Return to Hackathon Site" goes to `/`. **Parent codes only** also see "We need your help for next year" with "Learn more" (organizer interest form `https://forms.gle/zh6AKeEaa415QdTp8`) and "Donate to support the hackathon" (`https://donorbox.org/2026-bt-hackathon`).                                                    | `vote-08-thanks-student`, `vote-11-thanks-parent`                                                                                        |

### Admin console (`/vote/admin`, signed in)

Every page is server-rendered; the browser never holds the session id (see section 5). The header
has the BTCSP logo (to `/`), "Vote Admin", an Events link and an account menu (initials, name;
Your Profile, Log out). On a phone the header collapses to a slide-out menu.

| Route                                   | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | API calls                                                                                                                                  | Screenshot                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `/vote/admin/login`                     | Email + password, "Forgot your password?" link. Signed-in visitors are redirected to `/vote/admin`. Errors show the API's message (e.g. "Invalid email or password", "User is not an admin").                                                                                                                                                                                                                                                                                      | `POST /vote/admin/sessions/logins`                                                                                                         | `auth-01-admin-login`, `auth-02-admin-login-error`                     |
| `/vote/admin`                           | "Events" table: Event (link), Key, Status badge (Draft yellow, Open green, Closed grey), Created. "New Event" button. Empty state "No events yet".                                                                                                                                                                                                                                                                                                                                 | `GET /vote/admin/events?limit=100&offset=0`                                                                                                | `admin-01-events`, `admin-02-account-menu`                             |
| `/vote/admin/profile`                   | Name and email of the signed-in admin, read from the session.                                                                                                                                                                                                                                                                                                                                                                                                                      | none (layout)                                                                                                                              | `admin-03-profile`                                                     |
| `/vote/admin/events/new`                | Form: Event Name, Event Key (auto-slugged from the name until edited by hand: lowercase, non-word characters removed, spaces/underscores to `-`), Status (default Draft). Creates and goes to the event page.                                                                                                                                                                                                                                                                      | `POST /vote/admin/events`                                                                                                                  | `admin-04-event-new`                                                   |
| `/vote/admin/events/<id>`               | Tabs: Event, Projects, Codes, Results. "Event Details": Status, Event Key, Voting URL (`<origin>/vote/<key>`, opens in a new tab), Created, Last Updated. Edit button. "Danger Zone": Delete Event, with a confirmation modal.                                                                                                                                                                                                                                                     | `GET /vote/admin/events/<id>`; delete `DELETE /vote/admin/events/<id>`                                                                     | `admin-05-event-detail`, `admin-06-event-delete-confirm`               |
| `/vote/admin/events/<id>/edit`          | Same form as create, without the auto-slug (changing a live key breaks printed QR codes). Opening and closing voting is done here, by changing Status.                                                                                                                                                                                                                                                                                                                             | `GET` + `PUT /vote/admin/events/<id>`                                                                                                      | `admin-07-event-edit`                                                  |
| `/vote/admin/events/<id>/projects`      | Numbered list of projects in position order with edit (inline name/description form) and delete. "Add Project" (inline form), "Bulk Add".                                                                                                                                                                                                                                                                                                                                          | `GET .../projects`, `POST .../projects`, `PUT .../projects/<pid>`, `DELETE .../projects/<pid>`                                             | `admin-08-projects`, `admin-09-project-add`, `admin-10-project-edit`   |
| `/vote/admin/events/<id>/projects/bulk` | Paste CSV (example shown: header `team_name,description`), checkbox "Delete all existing projects before importing", Add Projects. Returns to the projects tab.                                                                                                                                                                                                                                                                                                                    | `POST .../projects/csv`                                                                                                                    | `admin-11-projects-bulk`                                               |
| `/vote/admin/events/<id>/codes`         | Five tiles: Total Codes, Student Codes, Student Votes, Parent Codes, Parent Votes. "Generate Codes" (inline form: Voter Type, Number of Codes 1-1000, default 10). "Export CSV" and "Print Cards" (PDF) honour the current filters. Filters: search box (debounced 250ms), Voter Type, Status (Used/Unused); they live in the URL (`?q=&voter_type=&has_voted=&offset=`). Table: Code, Type, Status (Voted/Unused), delete (disabled for a used code). 50 per page, Previous/Next. | `GET .../codes/summary`, `GET .../codes?limit=51&offset=..`, `POST .../codes/generate`, `POST .../codes/exports`, `DELETE .../codes/<cid>` | `admin-12-codes`, `admin-13-codes-generate`, `admin-14-codes-filtered` |
| `/vote/admin/events/<id>/results`       | Two tiles (Student Votes, Parent Votes totals), then a ranked list per voter type: rank badge (gold, silver, bronze, then grey; ties share a rank, the next rank skips), project name, vote count, a bar scaled to the largest count across both lists. "Auto-refresh" checkbox re-fetches every 5s while the tab is visible. "Present" goes full-screen on a dark background for the projector.                                                                                   | `GET .../results`                                                                                                                          | `admin-15-results`, `admin-16-results-presentation`                    |
| `/vote/admin/logout`                    | POST only (a GET redirects to `/vote/admin`, so hovering the link cannot sign anyone out). Deletes the session on the platform, clears the cookie, goes to the login page.                                                                                                                                                                                                                                                                                                         | `DELETE /vote/admin/session`                                                                                                               | —                                                                      |
| mobile header                           | Slide-out menu with Events and the account menu.                                                                                                                                                                                                                                                                                                                                                                                                                                   | —                                                                                                                                          | `admin-17-mobile-menu`                                                 |

### Account pages reached from email (no sign-in)

The platform mails these links and decides their paths (`core.email.EmailedLink` on the platform);
the host is the tenant's `domain`, `bthackathon.com`. A rebuild that keeps accounts must serve these
exact paths. `src/routes/emailedLinkRoutes.test.ts` pins them.

| Route                          | Mailed by                    | What it does                                                                                                                                                                                                                                                                                               | Screenshot                                                 |
| ------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `/login/password/reset`        | — (linked from login)        | "Forgot your password?" form. Always answers "If <email> has a hackathon account, a link to reset the password is on its way." whether or not the account exists (no account oracle).                                                                                                                      | `auth-03-forgot-password`, `auth-04-forgot-password-sent`  |
| `/login/password/reset/<id>`   | `PasswordResetProcessor`     | "Reset your password": New password + Confirm. Only checks: not empty, the two match (there are no password rules). The token is checked only on submit; an expired one shows the platform's message. Success signs the person in (admin) and goes to `/vote/admin`, or to the login page for a non-admin. | `auth-05-reset-password`, `auth-06-reset-password-expired` |
| `/welcome/<token>`             | `UserActivationProcessor`    | "Welcome to the Bergen Tech Hackathon", naming the invitee, then the same set-password form. GET only reads the invitation; the form post spends it. Spent/expired: "This invitation is no longer valid". Platform error: "We could not open your invitation" (try again later).                           | `auth-07-welcome`, `auth-08-welcome-expired`               |
| `/email/verifications/<token>` | `EmailVerificationProcessor` | Spends the token on GET (scanners are harmless: the token stays usable). "Email verified" / "This link is no longer valid" (404) / "We could not verify your email" with Try again (any other failure).                                                                                                    | `auth-09-email-verified`, `auth-10-email-link-invalid`     |

## 3. Data model

Postgres schema `vote` on the platform database; `specs/db-vote.json` is the source. Every table
also carries `created_at`, `updated_at`, `updated_by_user_id` and `hash_code` (platform audit
columns), and ids are random strings with the prefix shown.

| Table                    | Columns                                                                                                      | Rules                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vote.events` (`evt-`)   | `id`, `key`, `name`, `status` (`draft`/`open`/`closed`, default `draft`), `deleted_at`, `deleted_by_user_id` | `key` unique among live events; at least 4 characters; URL-safe (letters, digits, `- _ + .`); `admin` is reserved (it would collide with `/vote/admin`). `name` not blank. Delete is soft: sets `deleted_at` and rewrites the key to `<id>:<key>` to free it. Deleted events are invisible everywhere. |
| `vote.projects` (`prj-`) | `id`, `event_id`, `name`, `description` (optional), `position` (int ≥ 0)                                     | `(event_id, position)` unique (deferrable). New projects go to `max(position)+1` (first is 1). `name` not blank; description trimmed, blank becomes absent. Deleting a project deletes its votes.                                                                                                      |
| `vote.codes` (`vcd-`)    | `id`, `event_id`, `code`, `voter_type` (`student`/`parent`)                                                  | `(event_id, code)` unique. Codes are stored upper case and matched after trim + upper-case, so a typed code is case-insensitive.                                                                                                                                                                       |
| `vote.votes` (`vot-`)    | `id`, `code_id`, `project_id`                                                                                | `(code_id, project_id)` unique. Submitting a ballot deletes every vote of the code and inserts the new set in one transaction.                                                                                                                                                                         |

**Code format.** `S` or `P` (student/parent), one letter from `ABCDEFGHJKMNPQRSTUVWXYZ`, then four
digits from `23456789` — e.g. `SJ4682`, `PC4567`. Ambiguous characters (0/O, 1/I/L) are never used,
and the prefixes `SH SO SX PU PP PO` are skipped. A collision within the event is redrawn (up to 100
tries). Codes can only be generated while the event is `draft` or `open`, 1 to 1000 per request,
inserted in batches of 100 in one transaction.

**Scoring.** A tally is a plain count of `vote` rows per project, per voter type, ordered by count
descending. Projects with no votes do not appear in the results at all. "Student Votes" / "Parent
Votes" on the codes page and the results page count vote rows, not voters (one parent with three
picks is three).

**Invariants the platform checks.** No student code with more than 1 vote; no parent code with more
than 3 (`vote/app/vote/invariants/VoteInvariants.scala`).

## 4. API: every call the app makes

Production base URL: `https://api.idempotent.io` (`VITE_API_BASE_URL` in `.env.production`;
`http://localhost:9300` in development). All bodies are JSON. Errors:

- `422` → `[{ "discriminator": "validation", "message": "...", "field"?: "..." }]`
- `401` → `{ "discriminator": "unauthorized", "message": "..." }`
- `404` → empty body

The app wraps every call in `handleApiCall` (`src/generated/generated-util.ts`), which turns these
into `{ status, data }` or `{ status, errors: [{ message }] }`; pages show `errors[0].message`.

### Shared shapes

    Event        { id, key, name, status: "draft"|"open"|"closed", created_at, updated_at }
    Project      { id, event: { id }, name, description?, position, created_at, updated_at }
    ProjectVote  { project: Project, selected: boolean }
    Vote         { voter_type: "student"|"parent", max_votes: 1|3, event: Event, projects: ProjectVote[] }
    Code         { id, event: { id }, code, voter_type, has_voted, created_at }
    CodeSummary  { total, student: { codes, votes }, parent: { codes, votes } }
    Tally        { total_votes, projects: [{ project: Project, vote_count }] }
    EventResults { event: Event, student: Tally, parent: Tally }
    File         { id, name, type: "csv"|"pdf"|..., url }      // url is signed, expires in 1 day
    AdminSession { session: { id }, user: User }
    User         { id, tenant: { id }, person: { id, name?, email?: { id, address, verified_at? }, ... }, status, role: "admin"|"user"|"requester" }
    SessionState = { discriminator: "tenant_session", session: { id }, user: User, tenant: {...}, enabled_features: [], password_change_required }
                 | { discriminator: "user_inactive", status }
    UserActivation { user: { id }, name?, email?: { address, ... }, expires_at }

### vote-api (public, no credential; called from the browser)

| Call                                              | Request                                            | Response                                            | Rules                                                                                                                                                                                                                        |
| ------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /vote/events/all/open`                       | —                                                  | `200 Event[]`                                       | Live events with status `open`.                                                                                                                                                                                              |
| `POST /vote/events/:event_key/code/verifications` | `{ "code": "SJ4682" }`                             | `200 Vote`; `404` unknown key; `422 "Invalid code"` | Read only.                                                                                                                                                                                                                   |
| `POST /vote/events/:event_key`                    | `{ "code": "SJ4682", "project_ids": ["prj-..."] }` | `200 Vote` (after the write); `404`; `422`          | Replaces the code's votes with exactly this set. `422 "Invalid code"`, `"Cannot find project with id '<id>'"`, `"You can only vote for 1 project"`, `"You can only vote for up to 3 projects"`. Duplicate ids are collapsed. |

Note: the two POSTs find the event by key **regardless of status** — the frontend only offers open
events, but the API accepts verifications and votes on a draft or closed event whose key and a code
are known. A rebuild should decide deliberately whether a closed event refuses votes.

### vote-admin (header `session_id: <session id>`; called only from SvelteKit server code)

Every operation answers `401` without a valid session of a hackathon admin.

| Call                                                                              | Request                                                | Response                              | Notes                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /vote/admin/sessions/logins`                                                | `{ email, password }`                                  | `201 AdminSession`; `422`             | No session needed. Tenant is fixed to `hackathon`; `422 "User is not an admin"` for a non-admin.                                                                                                                                                                                                                                    |
| `GET /vote/admin/session`                                                         | —                                                      | `200 AdminSession`; `401`             | Session must be a real session (not an API token), user in tenant `hackathon`, role `admin`.                                                                                                                                                                                                                                        |
| `DELETE /vote/admin/session`                                                      | —                                                      | `204`                                 | Revokes the session.                                                                                                                                                                                                                                                                                                                |
| `GET /vote/admin/events?status=&id=&limit=100&offset=0`                           | —                                                      | `200 Event[]`                         | limit 1-100.                                                                                                                                                                                                                                                                                                                        |
| `GET /vote/admin/events/:id`                                                      | —                                                      | `200 Event`; `404`                    |                                                                                                                                                                                                                                                                                                                                     |
| `POST /vote/admin/events`                                                         | `{ key, name, status? }`                               | `201 Event`; `422`                    | Messages: `"key cannot be blank"`, `"name cannot be blank"`, `"Key admin is a reserved word and cannot be used for events"`, `"'<key>' contains 1 or more characters that are not URL safe: <chars>"`, `"Key must be at least 4 characters long"`, `"Event with key '<key>' already exists"`.                                       |
| `PUT /vote/admin/events/:id`                                                      | `{ key, name, status? }`                               | `200 Event`; `404`; `422`             | Same validation.                                                                                                                                                                                                                                                                                                                    |
| `DELETE /vote/admin/events/:id`                                                   | —                                                      | `204`; `404`                          | Soft delete (projects, codes and votes stay in the table, unreachable).                                                                                                                                                                                                                                                             |
| `GET /vote/admin/events/:event_id/projects?limit=100&offset=0`                    | —                                                      | `200 Project[]`                       | Position order.                                                                                                                                                                                                                                                                                                                     |
| `GET /vote/admin/events/:event_id/projects/:id`                                   | —                                                      | `200 Project`; `404`                  | Not used by the frontend.                                                                                                                                                                                                                                                                                                           |
| `POST /vote/admin/events/:event_id/projects`                                      | `{ name, description? }`                               | `201 Project`; `404`; `422`           |                                                                                                                                                                                                                                                                                                                                     |
| `PUT /vote/admin/events/:event_id/projects/:id`                                   | `{ name, description? }`                               | `200 Project`; `404`; `422`           | Position unchanged.                                                                                                                                                                                                                                                                                                                 |
| `DELETE /vote/admin/events/:event_id/projects/:id`                                | —                                                      | `204`; `404`                          | Deletes its votes too.                                                                                                                                                                                                                                                                                                              |
| `POST /vote/admin/events/:event_id/projects/csv`                                  | `{ data: "<csv text>", delete_all_projects: boolean }` | `204`; `404`; `422`                   | One project per non-blank line, split on the **first** comma only (so a description may contain commas; there is no quoting). A line whose name is `team_name` (any case) is the header and dropped. All-or-nothing. With `delete_all_projects`, the event's projects and their votes are deleted first and positions restart at 1. |
| `POST /vote/admin/events/:event_id/projects/reorder`                              | `{ project_ids: [...] }`                               | `204`                                 | Exists, but no screen calls it.                                                                                                                                                                                                                                                                                                     |
| `GET /vote/admin/events/:event_id/codes?voter_type=&has_voted=&q=&limit=&offset=` | —                                                      | `200 Code[]`                          | `q` is a case-insensitive substring of the code.                                                                                                                                                                                                                                                                                    |
| `GET /vote/admin/events/:event_id/codes/summary`                                  | —                                                      | `200 CodeSummary`; `404`              |                                                                                                                                                                                                                                                                                                                                     |
| `POST /vote/admin/events/:event_id/codes/generate`                                | `{ voter_type, count }`                                | `204`; `422`                          | `count` 1-1000; event must be draft or open (`"Event status is closed: no codes can be generated"`).                                                                                                                                                                                                                                |
| `POST /vote/admin/events/:event_id/codes/exports`                                 | `{ format: "csv"                                       | "pdf", voter_type?, has_voted?, q? }` | `201 File`; `404`; `422`                                                                                                                                                                                                                                                                                                            | The admin page redirects the browser to `File.url`. Formats below. |
| `DELETE /vote/admin/events/:event_id/codes/:id`                                   | —                                                      | `204`; `404`                          | Deletes its votes too (the UI disables delete on a used code).                                                                                                                                                                                                                                                                      |
| `GET /vote/admin/events/:event_id/results`                                        | —                                                      | `200 EventResults`; `404`             |                                                                                                                                                                                                                                                                                                                                     |

**CSV export** — file `<event key>-codes.csv`, ordered by voter type then code:

    type,code,votes
    parent,PA2345,3
    student,SJ4682,0

**PDF export ("Print Cards")** — file `<event key>-codes.pdf`, US Letter, 0.5" margins, 8 cards per
page (2 × 4), each a 3.5" × 2" business card with a dashed grey border: a QR code on the left
(96pt) encoding `https://bthackathon.com/vote/<key>?code=<code>`, and on the right three centred
lines — event name (Helvetica Bold 10), the code (Helvetica Bold 22), the voting URL (Helvetica 7).
Codes ordered alphabetically; empty slots on the last page are drawn with a light dashed border.
Generated with iText in `vote/app/vote/util/VoteCodesPdfUtil.scala`.

### platform (account pages; called only from SvelteKit server code, no credential)

| Call                                              | Request                                   | Response                                                                                                                 | Used by                        |
| ------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `POST /tenant/hackathon/session/password/resets`  | `{ email }`                               | `204` always (whether or not the account exists); `422` blank email                                                      | `/login/password/reset`        |
| `POST /tenant/hackathon/session/password/changes` | `{ id: <token from the link>, password }` | `201 SessionState`; `422` (e.g. `"Reset password link has expired - please request a new link to change your password"`) | `/login/password/reset/<id>`   |
| `GET /activations/:token`                         | —                                         | `200 UserActivation`; `404` spent/expired                                                                                | `/welcome/<token>`             |
| `POST /activations/:token/password`               | `{ password }`                            | `201 SessionState`; `404`; `422`                                                                                         | `/welcome/<token>`             |
| `PUT /email/verifications/:token`                 | —                                         | `204`; `404`                                                                                                             | `/email/verifications/<token>` |

After a successful password change or activation the page offers the new session to
`GET /vote/admin/session`; only if that succeeds is the cookie set and the person sent to
`/vote/admin` (otherwise to the login page).

`platform-storage` is used only for the `File` shape and the `file_type` enum of the export.

## 5. Auth and sessions

- **Tenant.** The platform hosts many products; this site is tenant `hackathon`
  (`tenants.domain = bthackathon.com`). Every admin call is fixed to that tenant on the server.
- **Who can sign in.** Platform users of tenant `hackathon` with role `admin`. There is no sign-up
  page: an admin is created on the platform and receives the invitation mail (`/welcome/<token>`).
- **Cookie.** `vote_session_id`, holding the platform session id. `httpOnly`, `SameSite=Lax`,
  `Secure` in production, `Path=/`, max age 8 hours. Written by login, invitation and password
  reset (`src/lib/server/adminSession.ts`).
- **The id never reaches the browser.** Admin pages are SvelteKit server loads and form actions;
  they read the cookie and call vote-admin with header `session_id`. Admin API code lives under
  `src/lib/server`, which SvelteKit refuses to bundle into browser code.
- **Every `/vote/admin` request** (`src/hooks.server.ts`) confirms the cookie with
  `GET /vote/admin/session`. `401` clears the cookie (so a stale cookie can never trap the admin
  between login and the console); any other failure keeps it. The admin's name and email for the
  account menu come from that same answer. The admin layout redirects to the login page when there
  is no confirmed session; a `401` from any later call clears the cookie and redirects too.
- **Logout** is POST only, deletes the session on the platform, then clears the cookie.
- **Voters** have no session. The code is the credential, sent in the body of each call.
- **Security headers** are set on every server response (`src/lib/security-headers.ts`).

## 6. Emails

All three are sent by the platform from its task queue, in English (the hackathon tenant declares no
other language), from the platform's default sender address. Each is a branded HTML template with
one paragraph and one button.

| Email              | Subject              | Body                                                                                                                                           | Button → link                                                             | Sent when                                                                                                 |
| ------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Password reset     | Reset your password  | "Please click the following button to reset your password:"                                                                                    | Reset your password → `https://bthackathon.com/login/password/reset/<id>` | Someone submits `/login/password/reset` for an address with an account. The link is valid for **1 hour**. |
| Invitation         | Welcome to Hackathon | "Welcome to Hackathon! Your account is ready." / "Choose a password to finish setting up and sign in:" / "This invitation expires in 30 days." | Set your password → `https://bthackathon.com/welcome/<token>`             | An admin account is created on the platform. Single use, 30 days.                                         |
| Email verification | Verify your email    | "Please click the following button to verify your email address:"                                                                              | Verify your email → `https://bthackathon.com/email/verifications/<token>` | Any person record with an email address is created on the platform for this tenant.                       |

The app itself sends no email; voters receive nothing.

## 7. Event-day workflow

Before the day:

1. Sign in at `/vote/admin/login`. **New Event**: name it (e.g. "BT Hackathon 2026"), keep the
   generated key (`bt-hackathon-2026`), leave status **Draft**.
2. **Projects → Bulk Add**: paste the team list as `team_name,description` lines. Tick "Delete all
   existing projects" when re-importing a corrected list. Fix single entries inline.
3. **Codes → Generate Codes**: e.g. 150 Student, then 300 Parent (max 1000 per click; repeat for
   more). Generation stops working once the event is Closed.
4. **Print Cards** with the Voter Type filter set to Student, then to Parent, so each stack prints
   separately; cut along the dashed lines. **Export CSV** is the same list with vote counts.

On the day:

5. **Event → Edit → Status: Open.** `/vote` now redirects straight to the event when it is the only
   open one.
6. Hand out cards. Voters scan the QR (or open `bthackathon.com/vote` and type the code), pick,
   submit. Votes can be changed until the event is closed.
7. Watch **Codes** (the tiles count codes and votes; filter Status = Unused to see who has not
   voted) and **Results** with **Auto-refresh**.
8. A lost or duplicated card: delete its code (only possible while unused) and generate a new one.
9. **Results → Present** on the projector for the announcement; **Exit** to leave.
10. **Edit → Status: Closed** to stop voting and remove it from `/vote`.

## 8. Past event data

**Not exported here, because no surface reachable without a hackathon admin login can read it.**
What was checked on 2026-10-14:

- `GET https://api.idempotent.io/vote/events/all/open` answers `[]`: no event is open.
- The production `/dev/data` read console does not list any `vote.*` table, so the events, projects,
  codes and votes cannot be read without an admin session of the `hackathon` tenant.

The rows remain in the platform database (schema `vote`) regardless of whether these routes are
turned off. To export them, sign in at `/vote/admin` while it still exists and, for each event, save
the Results page and **Export CSV** from the Codes tab; or read `vote.events`, `vote.projects`,
`vote.codes` and `vote.votes` from the database directly. ISS-19720 tracks that export, into
`docs/voting-app-inventory/data/`.

## 9. Behaviour worth knowing before a rebuild

- Votes and verifications are accepted on any non-deleted event whose key is known, whatever its
  status (section 4). Only the frontend hides draft and closed events.
- The delete-event confirmation says it "will delete all associated projects, codes, and votes";
  the platform soft-deletes the event row only and leaves the rest in place, unreachable.
- Results omit projects with zero votes, and vote totals count votes, not voters.
- `projects/reorder` exists in the API with no screen; ordering is otherwise import order.
- The code a voter types is matched case-insensitively and trimmed.
- `/vote/<key>` runs entirely in the browser, so the browser must be able to reach the API origin
  (CORS); the admin pages call the API only from the server.

## 10. Source map

| Concern          | hackathon (this repo)                                                                                                                               | platform (`mbryzek/platform`)                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Voter pages      | `src/routes/vote/+page.svelte`, `src/routes/vote/[event_key]/**`                                                                                    | `vote/app/vote/api/services/*`                                                                                                     |
| Admin pages      | `src/routes/vote/admin/**`, `src/lib/components/EventForm.svelte`, `EventAdminTabs.svelte`, `AccountMenu.svelte`                                    | `vote/app/vote/admin/services/*`                                                                                                   |
| Account pages    | `src/routes/login/**`, `src/routes/welcome/**`, `src/routes/email/**`, `src/lib/server/setPassword.ts`, `src/lib/components/SetPasswordCard.svelte` | `core/app/core/processor/{PasswordReset,UserActivation,EmailVerification}Processor.scala`, `core/app/core/email/EmailedLink.scala` |
| API clients      | `src/lib/api/client.ts` (public), `src/lib/server/adminApi.ts`, `src/lib/server/platformApi.ts`, `src/generated/*`                                  | `spec/vote-api.json`, `spec/vote-admin.json`, `spec/platform.json`, `spec/platform-storage.json`                                   |
| Session          | `src/hooks.server.ts`, `src/lib/server/adminSession.ts`, `src/lib/config.ts`                                                                        | `vote/app/controllers/VoteControllerHelpers.scala`, `vote/app/vote/admin/services/AdminSessionsServiceImpl.scala`                  |
| Tables and rules | —                                                                                                                                                   | `dao/spec/db-vote.json`, `vote/app/vote/db/*`, `vote/app/vote/invariants/VoteInvariants.scala`                                     |
| Code cards PDF   | —                                                                                                                                                   | `vote/app/vote/util/VoteCodesPdfUtil.scala`                                                                                        |
| E2E tests        | `playwright/tests/*.spec.ts` (seeded through `specs/playwright-vote.json`)                                                                          | `playwright/app/playwright/vote/**`                                                                                                |

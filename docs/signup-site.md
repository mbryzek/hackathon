# signup.bthackathon.com: the registration site

`signup.bthackathon.com` is where students register for the hackathon, form teams and pick project
categories. The main site links to it from the **Signup** item in the navigation (`urls.signup` in
`src/lib/urls.ts`). It is a separate application, written by Julien Bryzek, and none of its code is
in this repository. This document is what the person taking over the hackathon needs to keep it
running or replace it.

## Where it lives

| Thing           | Where                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Code            | <https://github.com/s-tn/bthackathon> (Julien's personal GitHub account `s-tn`). Public. Its GitHub homepage field is `https://signup.bthackathon.com`.            |
| Code at writing | commit `ddea5ee5ae0475999421587012e0fbd43c3ffdbc` (2026-04-07, "fix user profile editing on manage page"), the last commit before the 2026 event.                  |
| Running server  | A machine Julien runs. Its address is not public: the hostname is a **proxied** record in the `bthackathon.com` Cloudflare zone, so DNS answers with Cloudflare's. |
| Live data       | One SQLite file, `prisma/dev.db`, on that machine. Not in GitHub (see "Data").                                                                                     |
| Email           | SendGrid, sending as `support@bthackathon.com`. The API key is in a `sendgrid.env` file on the server (never committed).                                           |
| DNS             | The `signup` record in the `bthackathon.com` zone, plus SendGrid's records `s1._domainkey` and `s2._domainkey` (CNAMEs to `*.sendgrid.net`).                       |

Julien's server also answers for `linearfunctions.net`, his own domain: the app's `vite.config.mts`
allows both hostnames, and both return the same page and fail the same way.

## State on 2026-10-14

Both `signup.bthackathon.com` and `linearfunctions.net` answer mostly `502` ("error code: 502", from
Cloudflare) and occasionally `200` with the app's page: 2 of 10 requests in a row succeeded. Cloudflare
can reach the server only some of the time, which is what a home machine or a Cloudflare Tunnel with a
dead connector looks like. Nothing on bthackathon.com's side is broken; the server is Julien's to
restart.

## What the app is

- **Stack:** SolidJS pages for sign-up and the dashboard (`src/`), an older Elm front page (`elm.js`),
  an Express 5 API (`server/`), Prisma over SQLite (`prisma/schema.prisma`), bcrypt passwords, cookie
  sessions (`express-session`), SendGrid for email.
- **Run it:** `npm install`, then `npm run build` and `npm run serve` (Express on `PORT`, default
  `5173`). `npm run dev` runs the Vite dev server with the API attached. The server seeds the schools,
  majors and categories on start (`server/seed.ts`).
- **Pages:** `/signup/*` is registration (account, email verification, profile, create or join a team);
  `/signup/dashboard` is the signed-in dashboard, including the admin and school-admin views. Every
  other path serves the Elm front page.
- **API:** 34 routes under `/api/` in `server/routes/`: sign-in and passwords (`login`, `register`,
  `verify`, `resend`, `forgot-password`, `reset`, `logout`), teams (`teams`, `createteam`, `join`,
  `accept`, `reject`, `cancel-request`, `remove`, `edit`), the signed-in user (`user`, `user/update`,
  `delete`), reference data (`schools`, `majors`, `categories`), admin (`admin/users`, `admin/teams`,
  `export-teams`, `export-people` as CSV) and school admins (`school-admin/*`, who register and manage
  their own school's students).

### Data

| Table          | What it holds                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `User`         | A student or admin: email, phone, name, grade, school, major, shirt size, parent contacts (JSON), password hash. |
| `Team`         | Name, project, maximum size, categories, experience level, leader.                                               |
| `Registration` | A user on a team, with a status (pending, accepted, rejected).                                                   |
| `Request`      | A user asking to join a team.                                                                                    |
| `School`       | A school (Bergen Tech, Applied Tech), and whether its students may self-register and create teams.               |
| `SchoolAdmin`  | Which users administer which school.                                                                             |
| `Major`        | The majors offered at each school.                                                                               |
| `Category`     | A project category, with its description and prize.                                                              |
| `Session`      | Sign-in sessions.                                                                                                |

The `prisma/dev.db` committed to GitHub is a small development fixture (a handful of rows created by
the seed), not the 2026 registrations. The real file exists only on Julien's server. It holds minors'
names, phone numbers and parent contacts, so it moves by private copy to BYE, never through a repository
or an email attachment.

## Taking it over

1. **Transfer the repository.** Julien opens **Settings > General > Danger Zone > Transfer** on
   `s-tn/bthackathon` and transfers it to the BYE GitHub organization. GitHub redirects the old URL.
   Consider making it private: it is public today.
2. **Copy the data.** Julien copies `prisma/dev.db` off the server (with the server stopped, so the
   copy is consistent) into storage BYE owns.
3. **Move the email.** Either BYE takes over the SendGrid account, or creates its own and authenticates
   `bthackathon.com` in it, which replaces the `s1._domainkey` and `s2._domainkey` records. The key goes
   in `sendgrid.env` on whichever server runs the app.
4. **Keep the DNS record.** When the `bthackathon.com` zone moves to BYE's Cloudflare account (README,
   "Add the zone"), import the `signup`, `s1._domainkey`, `s2._domainkey` and `_dmarc` records. The
   `signup` record points at whatever runs the app.
5. **Before it takes registrations again**, set a real session secret: `server/serve.ts` and
   `server/index.ts` both pass the literal `secret-key` to `express-session`, which lets anyone forge a
   session cookie. Read it from the environment instead.

## Hosting it again

The app needs a long-running Node process and a disk for the SQLite file, so it cannot run as a
Cloudflare Worker the way the main site does. Three ways to run it for 2027:

| Option                                       | Cost                    | What it takes                                                                                                                       |
| -------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Julien keeps running it                      | none                    | The repo and DNS belong to BYE, the server stays Julien's. The site is up only while his machine is.                                |
| A small hosted server with a disk            | a few dollars per month | Any Node host with a persistent volume (Fly.io, Render, a VPS). Point the `signup` record at it; nothing in the code has to change. |
| Replace it with a form (Google Forms, Tally) | none                    | Loses team formation, email verification and the school-admin views; organizers rebuild teams by hand from the responses.           |

If registration moves elsewhere, change `urls.signup` in `src/lib/urls.ts` to the new address. That
one value is the main site's only link to the registration site.

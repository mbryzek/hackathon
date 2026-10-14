# bthackathon.com

The website of the BT Hackathon: a SvelteKit app deployed as a Cloudflare Worker. Every page is
prerendered, and the site calls no backend.

The judging and voting app (`/vote`, `/vote/admin`), the sign-in, password reset, welcome and email
verification pages, and the platform API clients they used have been removed.
[`docs/voting-app-inventory.md`](docs/voting-app-inventory.md) describes all of it — every route,
API call, data shape, email and event-day workflow, with screenshots and the API specs — so it can
be rebuilt from scratch.

## Running it locally

```sh
npm ci
npm run dev
```

`npm run check` runs the type checks, lint and unit tests; `npm run build` builds what is deployed.

## Deploying

A deploy needs one Cloudflare account, the `bthackathon.com` zone in it, and an API token. Once the
two GitHub secrets below are set, every push to `main` deploys on its own.

### 1. Create the Cloudflare account

Sign up at <https://dash.cloudflare.com/sign-up>. The Free plan is enough.

### 2. Add the zone

1. In the dashboard, **Add a domain** (or **Add a site**), enter `bthackathon.com`, and pick the Free plan.
   Cloudflare scans the domain's current DNS records and offers to import them; keep any you still
   need (for example `signup`, the registration site, which runs elsewhere: see
   [docs/signup-site.md](docs/signup-site.md)).
2. Cloudflare shows two nameservers. At the domain's registrar, replace its nameservers with those two.
   The zone turns **Active** once the change has propagated, usually within an hour. A zone is active
   in only one Cloudflare account at a time, so the account that served it before stops serving it
   at that moment.
3. Under **DNS > Records**, make sure the apex has a **proxied** (orange cloud) record. The Worker
   attaches to `bthackathon.com/*` through a route, and a route only receives traffic for a hostname
   that is proxied. If there is no apex record, add one: type `AAAA`, name `@`, IPv6 address `100::`,
   proxy status **Proxied**. That address is a placeholder: the Worker answers every request, so the
   address is never contacted.
4. Optional: to send `www.bthackathon.com` to the apex, add the same `AAAA 100::` proxied record for
   `www`, then **Rules > Redirect Rules > Create rule** from the "Redirect from WWW to root" template.

### 3. Turn on Workers

Open **Workers & Pages** in the dashboard once. On a new account Cloudflare asks you to choose a
`workers.dev` subdomain; pick any name. A deploy from CI cannot answer that question for you.

### 4. Copy the account ID

On the account's home page in the dashboard, use **Copy account ID** (it is also in the right-hand
column of **Workers & Pages**). It is a 32-character hex string. This is `CLOUDFLARE_ACCOUNT_ID`.

### 5. Make the API token

1. Go to **My Profile > API Tokens > Create Token** (<https://dash.cloudflare.com/profile/api-tokens>).
2. Use the **Edit Cloudflare Workers** template.
3. Under **Account Resources**, include your account. Under **Zone Resources**, include the specific
   zone `bthackathon.com`.
4. **Continue to summary > Create Token**, and copy the token. Cloudflare shows it once. This is
   `CLOUDFLARE_API_TOKEN`.

Treat the token like a password: it can change the site. Do not commit it or paste it into an issue.
If it leaks, roll it on the same page.

### 6. Set the GitHub secrets

In the GitHub repository, go to **Settings > Secrets and variables > Actions > New repository secret**
and add both:

| Name                    | Value                      |
| ----------------------- | -------------------------- |
| `CLOUDFLARE_API_TOKEN`  | the token from step 5      |
| `CLOUDFLARE_ACCOUNT_ID` | the account ID from step 4 |

Or with the GitHub CLI, which prompts for each value:

```sh
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
```

### 7. Deploy

- **Automatically:** every push to `main` runs the **Deploy** workflow (`.github/workflows/deploy.yml`).
  Until both secrets are set it deploys nothing and says so in the run's summary.
- **On demand:** **Actions > Deploy > Run workflow**.
- **From your own machine:** with Node 24 installed,

  ```sh
  export CLOUDFLARE_API_TOKEN=...   # the token
  export CLOUDFLARE_ACCOUNT_ID=...  # the account ID
  scripts/deploy
  ```

  `scripts/deploy --dry-run` builds everything and uploads nothing, and needs neither value.

Check what is live:

```sh
curl -s https://bthackathon.com/_internal_/version
```

`version` is the commit that was deployed. The dashboard lists every deploy under **Workers & Pages >
hackathon > Deployments**, where **Rollback** puts an earlier one back.

### What the deploy uses

- `wrangler.toml` names the Worker (`hackathon`), the route (`bthackathon.com/*`) and the build
  directory. Nothing in it is specific to one Cloudflare account.
- `.env.production` holds the build-time settings.
- `scripts/deploy` runs `npm ci`, `npm run build` and `wrangler deploy` with the wrangler version
  pinned in `package-lock.json`. It needs no other tooling and reads nothing outside the repository.

## The registration site

`signup.bthackathon.com` is a separate application with its own repository and server.
[docs/signup-site.md](docs/signup-site.md) says where it lives, what it holds and how to take it over.

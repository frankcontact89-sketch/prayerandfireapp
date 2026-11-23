# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/31c416da-3493-411f-9e7f-bcc4136f4a86

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/31c416da-3493-411f-9e7f-bcc4136f4a86) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/31c416da-3493-411f-9e7f-bcc4136f4a86) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Prayer room TURN credentials

The app requests ICE configuration through the authenticated `community-push` Edge Function
with `{ "kind": "ice", "group_id": "community-general" }`. The function keeps
`TURNIX_API_TOKEN` on the server and issues one-hour Turnix credentials. On the
hosted Supabase gateway, it forwards `CF-Connecting-IP` when available for relay selection.

For migration testing, use Supabase project `xikmhnulxksadgvzajdk`. Add
`TURNIX_API_TOKEN` in **Edge Functions → Secrets** and deploy `community-push`
to that project. Use a separate test build pointing to that project after its
schema and test accounts are ready. Production keeps its existing project URL
until the migration is verified.

Run the mock provider tests with Node 24 and
`node --disable-warning=ExperimentalWarning --test tests/turnix.test.mjs`.

`.env.production` contains public Vite settings for the current production build.
For local development, copy it to the ignored `.env` and use the appropriate
public URL and publishable key for your test project.

## Independent backend verification

The iOS production environment is still defined by the existing `.env.production`.
For an isolated build, set the three Vite Supabase variables in the build process
to the public URL, project reference and publishable key of `xikmhnulxksadgvzajdk`.
This selects the app-only store catalog and the separate Academy bridge for that
issuer. The existing Academy website and bridge remain available separately.

The SQL in `supabase/bootstrap` is the additive bootstrap applied to the
existing destination in this order: foundation, content, chat receipts, avatar
permissions, chat invites, profile and audio privacy, phone and submissions,
store, compatibility columns. These scripts assume the destination already has its original Community
schema. The administrator is provisioned separately with the verified Auth UUID.

### Final verification against the independent project

The Academy bridge snapshot is under `supabase/academy` because it deploys to
the Academy project, independently from the Prayer & Fire Edge Functions.
The app reuses its existing session; linked accounts must still have an active
enrollment. The UI/bridge fixture never writes to either project's database.

Run the isolated Academy fixture from the repository root with Node 24:

```sh
npm install --prefix /tmp/pf-academy-test jsdom@26.1.0 --no-audit --no-fund
NODE_PATH=/tmp/pf-academy-test/node_modules node --test tests/abba-independent.test.mjs
```

In the independent Supabase project's Edge Function Secrets, iOS push requires
`APNS_KEY_ID`, `APNS_TEAM_ID` and `APNS_PRIVATE_KEY` from the existing
Apple Push Notifications key. TestFlight uses `APNS_ENV=production` (the
default) and bundle ID `com.frankcontact89.prayerandfiremobile`. Do not put
the private key in Git or in Vite variables.

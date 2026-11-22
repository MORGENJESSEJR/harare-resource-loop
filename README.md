# Harare Resource Loop

Harare Resource Loop is a local-first demonstration MVP for circular-economy coordination in Harare. It brings collection requests, collector workflows, a materials marketplace, reuse guidance, composting education, book exchange, community giving, proposed collection areas, simulated bin operations, partner references, and impact reporting into one browser app.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Create and preview a production build with:

```bash
npm run build
npm run preview
```

Run the domain tests with `npm test`. The app uses a system font stack and does not need a font or image CDN to render.

## Deploy to Cloudflare Workers Static Assets

This project uses Wrangler's explicit static-assets mode. The root `wrangler.jsonc` publishes the Vite `dist` directory and serves `index.html` for unmatched routes, so the React single-page app can handle its client-side routes. No Worker entry script, API, database, Cloudflare Vite plugin, or Vite upgrade is needed.

```bash
npm ci
npm run build
npx wrangler deploy
```

On a new machine, sign in first with `npx wrangler login`. Wrangler prints the deployed `workers.dev` URL when deployment succeeds. The configuration and route behavior are described in [Cloudflare's Static Assets documentation](https://developers.cloudflare.com/workers/static-assets/). For local preparation, use `npx wrangler deploy --dry-run` after building.

## Demonstration data and limits

- Seeded examples make the features explorable without an account. The role switcher exposes Resident, Collector, Recycler/Buyer, and Operator demonstration views.
- Changes are stored under `hrl:` keys in the current browser. They do not sync to another person or device. Use **Reset demonstration data** to restore the original examples; the app asks first and clears only its own keys.
- Sensor values, fill trends, the USSD workflow, and organiser or organisation reviews are simulated. The Operator role demonstrates review steps; it is not an authenticated organisation representative.
- Organisations and partners are prospective or referential unless explicitly confirmed. Links and historical source material are provided for follow-up; they do not establish a current partnership.
- Collection areas are illustrative proposals. No exact operating locations or coordinates are asserted.
- Marketplace listings, interests, campaigns, and contribution records are local examples. A recorded interest is not a trade, campaign progress is self-reported, and the app does not collect or process donations or payments.
- Reuse suggestions use local rules through `src/reuseProvider.ts`; uploaded images are previewed in the browser and are not analysed by an AI service.
- Weight totals include only grams, kilograms, and tonnes converted to kilograms. Bags, containers, items, and unclear legacy quantities remain visible as quantities and are excluded from recovered-weight totals.
- Historical research benchmarks retain their source, period, and classification. They are kept separate from local demonstration activity.

## Participation records

Event registration records interest only. Attendance is available after the scheduled date and is first marked as participant self-reported. The Operator view can demonstrate subsequent organiser and organisation reviews; these are not real approvals. A printable contribution report includes the recorded status and a notice that it is not an employment guarantee or official qualification.

Before a production service, participation verification needs authenticated representatives, role-protected server actions, and an auditable record of who reviewed what and when. The role switcher is only a local demonstration control.

## Data sources

- UN-Habitat Waste Wise Cities Tool Harare assessment (2021): [Harare city profile](https://www.africancleancities.org/sites/default/files/2024-06/harare.pdf).
- City of Harare Master Plan (published 2025; estimate for 2024): [Department of Works extract](https://www.hararecity.co.zw/resources/download/388).
- Stable Packaging historical plastic price (reported 2023): [Mongabay report](https://news.mongabay.com/2023/08/zimbabwe-sees-recycling-boom-as-waste-picking-becomes-lucrative-business/).
- Books on Wheels case study: [organisation-published account](https://ndeipi.co.zw/books-on-wheels/). Figures and prices are historical published information, not current terms.
- Container costs are preliminary project-brief planning assumptions with a 15% contingency, not supplier quotations.

## Production work still needed

A public static build can demonstrate the client-side product, but production coordination needs a backend for accounts, permissions, synchronization, audit records, consent, and secure organisation verification. Live SMS/USSD, sensors, mapping and routing, payments, and buyer integrations also require real providers and operating agreements. Confirm organisation identities, current needs, donation routes, and permission to publish before describing any listing as a partner.

Do not enter recipient names, children's details, private addresses, sensitive personal stories, or unapproved photographs. Each organisation should coordinate volunteer visits and safeguarding directly.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for public static-hosting steps.

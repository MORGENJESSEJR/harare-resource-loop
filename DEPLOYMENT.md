# Public static deployment

The app is prepared for static hosting. It has no required API, secret, or server-side build step. Do not add API tokens to this repository. A static host publishes the demonstration client; it does not create accounts, synchronize browser data, or make simulated services operational.

## Put the project in GitHub

Create an empty GitHub repository, then run these commands from the project folder. Replace the example account and repository names with yours. Review `git status` before committing; `.gitignore` leaves out build outputs, dependencies, caches, and `.env` secrets.

```bash
git init
git add .
git status
git commit -m "Prepare Harare Resource Loop MVP"
git branch -M main
git remote add origin https://github.com/<account>/<repository>.git
git push -u origin main
```

If the project already has a Git remote, keep that repository and push to its intended branch instead of adding another `origin`.

## Cloudflare Workers Static Assets

This project uses an explicit `wrangler.jsonc` configuration instead of Wrangler's Vite auto-configuration. It deploys only the built `dist` files; there is no Worker entry point, API, database, or Cloudflare Vite plugin.

1. Connect the GitHub repository through Cloudflare **Workers Builds** and select `main` as the production branch. Allow Cloudflare to install its GitHub application for this repository when prompted.
2. Set the project root to `/` and the build command to `npm run build`.
3. Set the deploy command to `npx wrangler deploy`. Workers Builds installs dependencies from `package.json` and uses the locally locked Wrangler version.
4. Wrangler reads `./dist` from `wrangler.jsonc`, with `not_found_handling` set to `single-page-application`.
5. For local manual deployment, run `npm ci`, `npm run build`, then `npx wrangler deploy`. On a new machine, authenticate with `npx wrangler login` first.
6. After a successful deployment, use the `workers.dev` URL shown by Cloudflare. Open it over HTTPS on another device.

The Vite build uses relative asset paths. The React app uses hash routes such as `/#community`; Cloudflare's SPA fallback also serves `index.html` when a path does not match a static asset. See [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [Static Assets](https://developers.cloudflare.com/workers/static-assets/), and [SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).

## Vercel alternative

Import the GitHub repository into Vercel, select the repository root, and use `npm run build` as the build command with `dist` as the output directory. Vercel may detect these Vite settings automatically; verify the values before deploying. The deployment page provides an HTTPS URL. See [Vercel's Vite guide](https://vercel.com/docs/frameworks/frontend/vite) and [build configuration](https://vercel.com/docs/builds/configure-a-build).

## Netlify alternative

Add a new site from the GitHub repository in Netlify, use the repository root as the base directory, set the build command to `npm run build`, and set the publish directory to `dist`. Netlify provides an HTTPS site address after deployment. See [Netlify's Vite guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).

## Check the published site

1. Open the public HTTPS URL on the device used for deployment.
2. Visit each section through navigation, then refresh a non-home hash route. It should remain on the selected section.
3. Open the same URL from another computer or phone. Static pages and seeded examples are available, but local edits from the first browser do not transfer.
4. Try a campaign link only after confirming that the same campaign record exists in that browser. Campaigns created in this prototype are stored locally and are not shared through a server.
5. Use **Reset demonstration data** to clear only this app's `hrl:` browser records and return to the seeded examples.
6. Try **Print / Save ... as PDF** from a community contribution report and choose the browser's save-to-PDF option.

The production build and domain tests can be run locally before pushing:

```bash
npm ci
npm test
npm run build
```

The app targets current mainstream browsers and uses standard React, CSS, and browser APIs. Safari on macOS has not been independently tested for this delivery. Browser visual and interaction checks should be completed on the browsers and devices the project will support before making a compatibility claim.

## What static hosting does not provide

Hosting publishes the front end only. Real accounts and role permissions, shared records, authenticated organisation reviews, SMS/USSD, sensor data, live maps and route planning, marketplace transactions, and payment processing require backend services and confirmed providers or partners. The UI continues to label current readings and role-based reviews as demonstrations.

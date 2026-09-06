# Treyolympus website

Source: Stake-Canada-Landing(1).zip. The original bilingual index.html is preserved byte for byte.

Repository: sekl28/Treyolympus. Intended existing Vercel project: treolympus (without y), project ID prj_WZScKM0jj65ZpCWMYN5Mi9DMlKxG, team anatolies-projects-f04770f5.

## Build

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm start
```

Framework: Other. Root directory: repository root. Build command: npm run build. Output directory: dist. Node.js: 22.x. These build settings are recorded in vercel.json and package.json.

Only index.html, robots.txt and 404.html are copied to dist. Documentation and deployment scripts are not served.

## Publication status

The website files have been imported into this repository. GitHub upload does not itself confirm a live Vercel deployment or a working domain. The existing Vercel project must be connected to this exact repository, with main as the production branch.

## Checks

npm run build checks HTML, inline JavaScript syntax, JSON, local resources and the original affiliate link. docs/ contains the earlier package QA report; it is not a report about a deployed website.

The original review-mode noindex/nofollow settings are retained. No design, copy, affiliate URL, DNS settings or other projects are changed by this import.

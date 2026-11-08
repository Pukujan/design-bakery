# TASK-DB-0156: Maybe, Maybe Home and Riley in the work list; NYC Map Agent gets its picture

**Goal.** The owner saw no picture on NYC Map Agent, Website Copilot still described the old copilot page with a space-dish picture, and home.design-bakery.com and riley.design-bakery.com were missing from the work list.

**Done.**
- Project 16 is now **Maybe** (slug `website-copilot` kept so `/work/website-copilot` still works): copy from maybe.design-bakery.com, links to the site and its tax demo, warm colours, and the homepage hero as its picture in place of the space dish.
- New project 19 **Maybe Home** (home.design-bakery.com, private repo first-home-nyc, so no GitHub link) and 20 **Riley** (riley.design-bakery.com, public repo pukujan-lab-2/take2-riley). Start dates are the repo creation dates.
- Pictures: `frontend/public/lab/projects/{website-copilot,maybe-home,riley,nyc-map-agent}.webp`, 1400×1050 screenshots of each live site's first screen. `LabWork.tsx` `PROJECT_MEDIA` gains 17, 19 and 20.
- Order (frontend and backend `projectOrder.ts`): Maybe, Maybe Home, Riley, NYC Map Agent lead All and Shipped.
- The live site reads projects from Octo `cms_documents` (endtoend-engineer / engineering_projects), which matched the repo file; it gets the same list after the deploy.
- `scripts/test-homepage-content-stability.mjs` follows the new names and checks the two new entries.

**Evidence.** Homepage content, copilot order, tools, chips, icon and OG tests pass; backend build and frontend tsc clean. Headless Chromium on the dev server: the first four tiles show the new pictures, and each `/work/` page loads its picture.

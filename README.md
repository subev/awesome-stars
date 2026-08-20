# Welcome to [Awesome Neovim](https://github.com/rockerBOO/awesome-neovim/) list extended with Stargazers count!

<img width="1270" height="619" alt="image" src="https://github.com/user-attachments/assets/8fe3fd2a-3661-40b9-994a-fa94b76530ae" />



## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 💾 PostgreSQL + DrizzleORM
- 📖 [React Router docs](https://reactrouter.com/)
- TailwindCSS for styling
- Eslint and Prettier for code quality

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

you also need .env file with the following variables:

``` GITHUB_TOKEN ``` - A GitHub personal access token.

Then populate the data store (see *Crawling awesome lists* below):

```bash
npm run crawl -- --max-points 500
```

### Development

Copy `.env.example` to `.env` and provide a GITHUB_TOKEN.

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Star history & growth badges

The `% / month` badges come from **datapoints** in `data/index/history/<YYYY-MM-DD>.json.gz` —
a gzipped `{"owner/repo": stars}` map per date, written append-only and never rewritten.
A list needs **two datapoints on different days** before a percentage can be computed.

The crawler records them automatically; there is no separate command. It writes a
datapoint only when the newest one is at least `--history-every` days old (default 7),
so the 6-hourly crawl cron advances the crawl without minting four datapoints a day.
Several runs on the same day enrich one datapoint rather than duplicating it.

```bash
npm run crawl                            # records a datapoint if one is due
npm run crawl -- --history-every 0       # force a datapoint now
```

Sizing: one datapoint is ~1MB gzipped at 70k repos (~1.9MB at 135k). Weekly works out to
roughly **0.1 GB/year**. Note gzip only buys ~2x here — repo names are high-entropy — and
delta encoding does not help either, since 99% of repos change stars over six months.
Cadence is the only real lever.

> **A year from now:** at ~52 files/year this is fine for a couple of years and is
> deliberately not optimised. When it starts to bite, downsample rather than change the
> format — keep weekly resolution for the last 12 months and thin older datapoints to
> monthly (~4x saving) leaving recent trends untouched. Revisit around August 2027, or
> sooner if `data/index/history` passes ~500MB. Two things to look at then:
> `build-stars-assets` holds all series in memory for one pass, and the per-list
> `.trends.json` assets grow with the date count.

## Crawling awesome lists

`data/index/` is the single source of truth — current stars, list membership, and history.
The crawl is breadth-first from `sindresorhus/awesome`, resumes from `data/crawl/state.json`,
and stops on whichever budget runs out first, so progress accumulates across runs.

```bash
npm run crawl -- --max-points 3000 --max-minutes 90   # crawl / resume
npm run crawl:status                                  # frontier + usage report
npm run crawl -- --dry-run                            # plan only, no API calls
```

Useful flags: `--depth N` (how deep to crawl; discoveries are catalogued one level
beyond), `--min-stars N` (floor for depth 2+ — depth 1 is ungated because the seed is
curated), `--recrawl <owner>/<repo>` (re-queue a finished list after changing the gate),
`--stale-days N` (refresh lists older than this), `--history-every N` (see above).

Star counts come from GitHub's GraphQL API in batches of 40 repos — **one rate-limit point
per batch regardless of size** — and READMEs come from `raw.githubusercontent.com`, which
is unmetered, falling back to the REST readme endpoint for unguessable filenames
(`README.org`, `.github/README.md`, …). A run holds an exclusive lock at
`data/crawl/crawl.lock`; two crawls at once would silently clobber each other's shards.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
# For npm
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.

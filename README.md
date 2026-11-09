# Sallamat – Test Automation

Playwright + TypeScript end-to-end (UI) and API tests for **Sallamat** (`demo.sallamaat.com`), built with the Page Object Model.

## Project structure

```
tests/
├── specs/                     # Test files, grouped by feature
│   ├── auth/                  # Login (UI) + Login API
│   ├── campaigns/             # Manual campaign, Auto campaign
│   ├── templates/             # Create template: text / image / video / file
│   ├── ads/                   # Create ad (صندوق الإعلان)
│   └── customers/             # Upload customers via Excel
├── pages/                     # Page Objects (all extend BasePage)
│   ├── BasePage.ts            # Shared: page + Postman-style API logging
│   ├── LoginPage.ts
│   ├── ManualCampaignPage.ts
│   ├── AutoCampaignPage.ts
│   ├── TemplatePage.ts
│   ├── AdPage.ts
│   └── CustomersPage.ts
├── utils/
│   ├── apiLogger.ts           # Logger for API tests (request context)
│   ├── authResult.ts          # Interprets auth API responses
│   └── excelHelper.ts         # Fills the downloaded customers Excel template
├── testdata/testdata.json     # Users / credentials
└── assets/                    # Files used for uploads (png, mp4, pdf)
```

## Setup

```bash
npm ci
npx playwright install
```

## Run

| Command | What it runs |
|---|---|
| `npm test` | All tests |
| `npm run test:auth` | Login UI + API |
| `npm run test:campaigns` | Manual + auto campaigns |
| `npm run test:templates` | All template types |
| `npm run test:ads` | Create ad |
| `npm run test:customers` | Customers Excel upload |
| `npm run test:api` | Login API only |
| `npm run report` | Open the last HTML report |
| `npm run typecheck` | TypeScript check |

Run a single file: `npx playwright test tests/specs/ads/createAd.spec.ts`

## Behaviour

- **API logs in the terminal** – every UI test calls `page.enableApiLogging()` and prints each API call (method, URL, status, time, headers, bodies), Postman-style. Tokens and cookies are masked.
- **Browser stays open after the run** – UI specs call `page.pause()` in `afterEach`; press **Resume** in the Playwright Inspector to finish.
- **Report after every run** – `playwright-report/index.html` opens automatically (pass or fail).
- **On failure** – screenshot, video and trace are saved and attached to the report (`test-results/`).

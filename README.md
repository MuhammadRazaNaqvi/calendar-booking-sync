# Calendar Booking Sync

A focused operator demo for preventing double-booking across direct and Turo
reservations. Direct bookings reject known overlaps with HTTP 409. Manual
Turo sync imports new mock reservations and flags both overlapping bookings.
Moving/deleting the direct booking clears resolved conflicts.

Stack: React/Vite, Express, SQLite, react-big-calendar, and ICS libraries.

## Setup

Requires Node.js 22.13+ and npm. A C++ build toolchain may be needed if the
SQLite native addon has no prebuilt binary for your system.

Run from the repository root in two separate terminals.

```bash
# Terminal 1: backend
cd server
npm install
npm run seed
npm start
```

```bash
# Terminal 2: frontend
cd client
npm install
npm run dev
```

- Main app: `http://localhost:5173`
- Mock Turo page: `http://localhost:4000/mock-turo`

On later runs, use only `npm start` in `server/` and `npm run dev` in `client/`.
Stop with `Ctrl+C`. Restart the backend after server-code changes.

## Demo

A fresh seed creates five vehicles with one direct booking and one named
Turo trip each. Repeated seed preserves existing reservations.

1. Create a direct booking on free future dates in the main app.
2. On the mock page, select the same vehicle and add a named trip on those dates.
3. The source shows **Pending sync**; the main calendar remains unchanged.
4. Click **Sync Turo now** in the main app. Both overlapping bookings turn red.
5. Move/delete the direct booking. The remaining Turo conflict marker clears.
6. Repeat Sync without duplicates; another overlapping direct booking is rejected.
7. Refresh the mock page to see the reservation marked **Imported**.

Calendar flags show current conflicts; activity entries are historical.

## Reset

Stop the backend, then run from `server/`:

```bash
npm run reset:seed
```

**Warning:** reset deletes all bookings and mock reservations and restores the
demo baseline. Restart the backend and reload both pages afterward.

## Checks

From `server/`:

```bash
npm test
```

From `client/`:

```bash
npm run lint
npm run build
```

Tests use a temporary database; existing demo data is untouched.

## Limitations

- Mock ICS source only; no live Turo integration, scheduled sync, or write-back.
- Add-only import: existing UIDs are skipped; changes/cancellations are not reconciled.
- Date-only bookings with an exclusive end date; availability depends on the last sync.
- No auth, payments, pricing, fraud checks, multi-tenancy, or merged export.
- Local demo only: do not expose its unauthenticated endpoints publicly.

## Documentation

- [PLAN.md](PLAN.md): scope and data model.
- [CLAUDE_CODE_ROADMAP.md](CLAUDE_CODE_ROADMAP.md): Claude prompts and review steps.
# Roadmap: Build "Calendar Booking Sync" with Claude Code

Repo: https://github.com/MuhammadRazaNaqvi/calendar-booking-sync.git
Workspace already has: `.gitignore`, `PLAN.md`, `NOTES.md`,
`server/package.json` (dependency list only, not installed yet).

---

## Phase 1 — Backend data layer (45–60 min)

After every step, append a short entry to `NOTES.md`:
`## Step N — <what you asked> → <what you kept/changed and why>`
---

## Phase 1 — Backend data layer (45–60 min)

**Prompt to Claude Code:**
> Read PLAN.md. In `server/`, set up an Express app (`src/index.js`) with
> `better-sqlite3`. Create `src/db.js` that opens/creates `server/data.sqlite`
> and defines two tables: `vehicles(id, name, make_model)` and
> `bookings(id, vehicle_id, source, start_date, end_date, renter_name,
> status, external_uid, created_at)`. Add `src/seed.js` that inserts 2 sample
> vehicles if the table is empty. Wire a `npm run seed` script. Don't add
> auth, don't add any routes yet — just the data layer. Stop after this and
> don't commit — I'll review and commit myself.

**Verify:**
```bash
cd server && npm install && npm run seed
sqlite3 data.sqlite "select * from vehicles;"   # or open with any SQLite viewer
```

**Likely redirect:** if Claude Code adds an ORM or ships migrations tooling,
cut it — tell it "keep it to raw SQL in better-sqlite3, no ORM, this is a
small feature not a platform."

---

## Phase 2 — Vehicles + bookings API, with overlap rule (60–90 min)

**Prompt to Claude Code:**
> Add routes in `server/src/routes/`: `GET /api/vehicles`,
> `GET /api/vehicles/:id/bookings`, and `POST /api/bookings` which accepts
> `{vehicleId, startDate, endDate, renterName}`, source defaults to
> `"direct"`. Before inserting, check every existing booking for that
> vehicle for date overlap (`start < otherEnd && otherStart < end`). If an
> overlap exists, respond `409` with the conflicting booking's details
> instead of inserting. Mount routes in `src/index.js` with `cors()` enabled
> for `http://localhost:5173`. Stop after this and don't commit — I'll
> review and commit myself.

**Verify:**
```bash
npm start   # server on :4000 (or whatever port it picks — check src/index.js)
curl http://localhost:4000/api/vehicles
curl -X POST http://localhost:4000/api/bookings -H "Content-Type: application/json" \
  -d '{"vehicleId":1,"startDate":"2026-11-01","endDate":"2026-11-04","renterName":"Alex"}'
# repeat with overlapping dates -> expect 409
```

---

## Phase 3 — Turo import via sample ICS fixture (60–90 min)

**Prompt to Claude Code:**
> Create `server/fixtures/turo-sample.ics` with 2 fake VEVENTs for vehicle id
> 1, each with a UID, DTSTART, DTEND (use near-future dates). Add
> `POST /api/vehicles/:id/sync-turo` that reads that fixture with `node-ical`,
> and for each event, inserts a booking with `source: "turo"` and
> `external_uid` set to the event UID — skip if a booking with that
> external_uid already exists (idempotent re-sync). If an imported Turo
> event overlaps an existing `direct` booking, insert it anyway but mark
> status `flagged_conflict` on both the new and the conflicting rows, and
> return the conflict in the response. Stop after this and don't commit —
> I'll review and commit myself.

**Verify:**
```bash
curl -X POST http://localhost:4000/api/vehicles/1/sync-turo
# run twice -> second run should import 0 new events (idempotency)
```

**Likely redirect:** if Claude Code tries to actually hit a Turo API or add
a scheduler/cron — stop it, remind it this is explicitly out of scope
(manual sync button only).

---

## Phase 4 — ICS export (30–45 min)

**Prompt to Claude Code:**
> Add `GET /api/vehicles/:id/calendar.ics` using `ical-generator` that
> outputs all bookings (any source) for that vehicle as VEVENTs, with a
> summary like "Booked (turo)" or "Booked (direct)". Set the right
> `Content-Type: text/calendar` header. Stop after this and don't commit —
> I'll review and commit myself.

**Verify:**
```bash
curl http://localhost:4000/api/vehicles/1/calendar.ics
# confirm both turo and direct bookings appear as VEVENT blocks
```

---

## Phase 5 — React client scaffold (30 min)

**Commands (you run, or have Claude Code run):**
```bash
cd /home/ali/projects/jobs-assignment
npm create vite@latest client -- --template react
cd client && npm install
npm install react-big-calendar date-fns axios
```

**Prompt to Claude Code:**
> In `client/src/App.jsx`, fetch `GET /api/vehicles` on load, show a
> dropdown to pick a vehicle, and fetch `GET /api/vehicles/:id/bookings`
> for the selected one. Don't build the calendar view yet, just confirm
> data is loading — console.log or render as a plain list first. Stop
> after this and don't commit — I'll review and commit myself.

**Verify:** `npm run dev`, open browser, confirm vehicle list + bookings
list render.

---

## Phase 6 — Calendar UI + conflict UX (90–120 min)

**Prompt to Claude Code:**
> Replace the plain list with `react-big-calendar`. Render bookings as
> events, color `turo` bookings orange and `direct` bookings blue. Add a
> "Sync Turo now" button that calls `POST /api/vehicles/:id/sync-turo` and
> refetches. Add a small form (start date, end date, renter name) that
> calls `POST /api/bookings`; on success show a green "Booking confirmed"
> card, on 409 show a red "Heads up — conflicts with an existing booking"
> card with the conflicting dates, styled like a small notification card
> (similar to the Carisma "Heads up" example from the assignment screenshot).
> Stop after this and don't commit — I'll review and commit myself.

**Verify (manual happy path — this is your video script):**
1. Select vehicle → calendar empty.
2. Click "Sync Turo now" → 2 orange blocks appear.
3. Submit a booking overlapping one of them → red conflict card, nothing
   added to calendar.
4. Submit a booking on an open date → green success card, blue block
   appears.
5. Open `/api/vehicles/1/calendar.ics` in a new tab → confirm both
   bookings are listed.

---

## Phase 7 — Polish + submission package (60–90 min)

1. Update `README.md`:
   - Problem statement (double-booking across Turo + direct)
   - Why this feature (ties to 1Now's own "we sync the calendars" claim)
   - What was cut and why (auth, real Turo API, cron, payments, fraud)
   - Setup/run instructions (`npm install && npm run seed && npm start` for
     server, `npm install && npm run dev` for client)
   - "How Claude Code was directed" section, linking to `NOTES.md`
2. Finish `NOTES.md` with one line per phase (prompt → outcome/redirect).

---

## Time budget recap (~20 hrs)

| Phase | Hours |
|---|---|
| 0 — git setup | 0.1 |
| 1 — data layer | 1 |
| 2 — bookings API + overlap | 1.5 |
| 3 — Turo import | 1.5 |
| 4 — ICS export | 0.75 |
| 5 — client scaffold | 0.5 |
| 6 — calendar UI | 2 |
| 7 — polish + video + submit | 1.5 |
| Buffer / debugging across all phases | 3–4 |
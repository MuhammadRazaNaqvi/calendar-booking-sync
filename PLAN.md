# Plan: No Double Book — Calendar Sync for Direct + Turo Bookings

## Problem

Operators who rent cars on Turo *and* run their own direct booking site risk
double-booking a vehicle: the same car gets reserved on both channels for
overlapping dates. That's a trust-destroying failure for an operator — a
renter shows up and the car is gone.

## Scope (one feature, end to end)

1. Import a vehicle's existing Turo bookings from an `.ics` feed (simulated
   with a sample fixture file, since we don't have real Turo API credentials).
2. Block those dates against new direct bookings.
3. Reject/flag a new direct booking if it overlaps an existing booking
   (imported from Turo or already created directly).
4. Export a merged `.ics` feed per vehicle so the operator could re-import it
   into Turo or Google Calendar.
5. Show it all on a simple calendar UI, color-coded by source.

## Explicitly cut (stated, not hidden)

- **No auth** — single implicit operator, no login/accounts.
- **No real Turo/Google API integration** — sync is triggered manually via a
  "Sync Turo now" button that re-parses a local sample `.ics` fixture file,
  standing in for a real pull from Turo's calendar export URL.
- **No background jobs/cron** — sync is on-demand, not scheduled.
- **No payments, pricing, or fraud checks** — out of scope for this feature.
- **No multi-tenant support** — one shared set of vehicles.

## Stack

- Backend: Node.js + Express + `better-sqlite3` (file-based, zero setup).
- ICS: `node-ical` to parse the Turo fixture, `ical-generator` to export.
- Frontend: React (Vite) + `react-big-calendar`.

## Data model

- `vehicles`: id, name, make_model
- `bookings`: id, vehicle_id, source (`turo`|`direct`), start_date, end_date,
  renter_name, status (`confirmed`|`flagged_conflict`), external_uid (dedupe
  key for re-imported Turo events)

## API

- `GET /api/vehicles`
- `GET /api/vehicles/:id/bookings`
- `POST /api/vehicles/:id/sync-turo` — parses fixture, imports new events
- `POST /api/bookings` — create a direct booking, 409 on overlap
- `GET /api/vehicles/:id/calendar.ics` — merged export feed

## Happy-path demo (what the video shows)

1. Vehicle has no bookings.
2. Click "Sync Turo now" → two Turo bookings appear blocked on the calendar.
3. Try to create a direct booking that overlaps one of them → rejected with
   a clear reason.
4. Create a direct booking on an open date → succeeds, shows on calendar.
5. Download/open the exported `.ics` feed → it contains both the Turo and
   the direct booking.

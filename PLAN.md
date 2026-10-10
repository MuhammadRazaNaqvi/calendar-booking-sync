# Plan: Calendar Booking Sync — for Direct + Turo Bookings

## Problem

Operators who rent cars on Turo *and* run their own direct booking site risk
double-booking a vehicle: the same car gets reserved on both channels for
overlapping dates. That's a trust-destroying failure for an operator — a
renter shows up and the car is gone.

## Scope (one feature, end to end)

1. Import a vehicle's existing Turo bookings from an `.ics` feed (simulated
   with a vehicle-specific mock feed, since we don't have real Turo credentials).
2. Block those dates against new direct bookings.
3. Reject/flag a new direct booking if it overlaps an existing booking
   (imported from Turo or already created directly).
4. Show it all on a simple calendar UI, color-coded by source.
5. Add simulated external reservations from a separate backend page,
   keeping mock-source entry out of the main operator app.

New direct overlaps are rejected with 409 and are not saved. An external
overlap discovered during import is saved alongside the existing reservation;
both are flagged for manual resolution. Moving/deleting the direct booking
clears flags only when no overlap remains. Fresh demo data contains five
vehicles, each with a direct booking and a named imported Turo trip.

## Explicitly cut (stated, not hidden)

- **No auth** — single implicit operator, no login/accounts.
- **No real Turo/Google API integration** — sync is triggered manually via a
   "Sync Turo now" button that parses a vehicle-specific mock `.ics` feed,
  standing in for a real pull from Turo's calendar export URL.
- **No background jobs/cron** — sync is on-demand, not scheduled.
- **No payments, pricing, or fraud checks** — out of scope for this feature.
- **No multi-tenant support** — one shared set of vehicles.
- **Add-only imports** — skip existing UIDs; no changed/cancelled-event
   reconciliation or automatic cancellation. Dates are all-day, end-exclusive.
- **No merged export** — removed on user review to simplify the conflict demo;
   the original roadmap's export phase is historical, not current functionality.

## Stack

- Backend: Node.js + Express + `better-sqlite3` (file-based, zero setup).
- ICS: `node-ical` to parse mock feeds, `ical-generator` to generate the source.
- Frontend: React (Vite) + `react-big-calendar`.

## Data model

- `vehicles`: id, name, make_model, plate, color, seats, vehicle_type, photo_url
- `bookings`: id, vehicle_id, source (`turo`|`direct`), start_date, end_date,
  renter_name, status (`confirmed`|`flagged_conflict`), external_uid (dedupe
   key for re-imported Turo events), created_at
- `mock_turo_events`: uid, vehicle_id, start_date, end_date, renter_name;
   separate simulated external source, not calendar availability until imported

All ranges use valid `YYYY-MM-DD` dates and an exclusive end date. Guest/trip
labels are stored in `renter_name`; trip references are demo labels, not a
separate trip-management model. Availability checks are scoped to a vehicle.

## API

- `GET /api/vehicles`
- `GET /api/vehicles/:id/bookings`
- `POST /api/vehicles/:id/sync-turo` — parses mock feed, imports new events
- `POST /api/vehicles/:id/mock-turo/events` — adds source-only mock data
- `GET /api/vehicles/:id/mock-turo/events` — lists source data with imported status
- `GET /api/vehicles/:id/mock-turo/calendar.ics` — vehicle-specific mock feed
- `POST /api/bookings` — create a direct booking, 409 on overlap
- `PUT /api/bookings/:id` — edit a direct booking
- `DELETE /api/bookings/:id` — delete a direct booking
- `GET /mock-turo` — standalone source-entry page, independent of React
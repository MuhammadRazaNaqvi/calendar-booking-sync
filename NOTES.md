# Build Notes / Decision Log

Log of prompts/decisions while directing the AI assistant through this build,
kept for the "how you directed it" review criterion.

## Session 1 — Planning

- Compared four candidate features (calendar sync, fraud check, payouts, AI
  ops assistant) against the 20-hour budget and "skip auth/infra" constraint.
  Picked **calendar double-booking sync** — it mirrors a feature 1Now already
  advertises, and has the cleanest happy path to demo live.
- Decided against a real Turo API integration (none is publicly available
  without a partner agreement) — using a sample `.ics` fixture file instead,
  stated as a scope cut rather than hidden.
- Decided against background cron sync — a manual "Sync Turo now" button is
  enough to demonstrate the mechanism without adding scheduler infra.
- Chose Node/Express/SQLite + React over a Python backend — one language,
  mature ICS libraries (`node-ical`, `ical-generator`) and calendar UI
  (`react-big-calendar`) available in JS, saving build time.

## Session 2 — Build

(updated as implementation proceeds)

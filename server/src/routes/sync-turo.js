import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { mockTuroCalendar, syncTuroBookings } from "../turo.js";
import { todayStr, validateReservation } from "../validation.js";

const router = Router();

router.use("/:id", (req, res, next) => {
  const vehicleId = Number(req.params.id);
  const vehicle = Number.isSafeInteger(vehicleId) && db.prepare("SELECT * FROM vehicles WHERE id = ?").get(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  res.locals.vehicleId = vehicleId;
  next();
});

router.post("/:id/sync-turo", (req, res) => {
  res.json(syncTuroBookings(res.locals.vehicleId));
});

router.get("/:id/mock-turo/calendar.ics", (req, res) => {
  res.type("text/calendar").send(mockTuroCalendar(res.locals.vehicleId));
});

router.get("/:id/mock-turo/events", (req, res) => {
  res.json(db.prepare(`
    SELECT events.*, EXISTS (
      SELECT 1 FROM bookings WHERE vehicle_id = events.vehicle_id
      AND source = 'turo' AND external_uid = events.uid
    ) AS imported
    FROM mock_turo_events AS events WHERE vehicle_id = ? ORDER BY start_date, uid
  `).all(res.locals.vehicleId));
});

router.post("/:id/mock-turo/events", (req, res) => {
  const { startDate, endDate, renterName } = req.body ?? {};
  const error = validateReservation({ startDate, endDate, renterName });
  if (error) return res.status(400).json({ error });
  if (startDate < todayStr()) return res.status(400).json({ error: "startDate cannot be in the past" });
  const uid = `mock-turo-${randomUUID()}`;
  db.prepare("INSERT INTO mock_turo_events (uid, vehicle_id, start_date, end_date, renter_name) VALUES (?, ?, ?, ?, ?)").run(uid, res.locals.vehicleId, startDate, endDate, renterName.trim());
  res.status(201).json(db.prepare("SELECT * FROM mock_turo_events WHERE uid = ?").get(uid));
});

export default router;

import { Router } from "express";
import { db } from "../db.js";

const router = Router();

function findOverlap(vehicleId, startDate, endDate, excludeBookingId = null) {
  const existing = db
    .prepare(
      "SELECT * FROM bookings WHERE vehicle_id = ? AND id != ?"
    )
    .all(vehicleId, excludeBookingId ?? -1);

  return existing.find(
    (booking) => startDate < booking.end_date && booking.start_date < endDate
  );
}

router.post("/", (req, res) => {
  const { vehicleId, startDate, endDate, renterName } = req.body;

  if (!vehicleId || !startDate || !endDate || !renterName) {
    return res.status(400).json({
      error: "vehicleId, startDate, endDate, and renterName are required",
    });
  }
  if (startDate >= endDate) {
    return res.status(400).json({ error: "startDate must be before endDate" });
  }

  const vehicle = db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const conflict = findOverlap(vehicleId, startDate, endDate);
  if (conflict) {
    return res.status(409).json({
      error: "This vehicle is already booked for an overlapping date range",
      conflictingBooking: conflict,
    });
  }

  const insert = db.prepare(`
    INSERT INTO bookings (vehicle_id, source, start_date, end_date, renter_name, status)
    VALUES (?, 'direct', ?, ?, ?, 'confirmed')
  `);
  const result = insert.run(vehicleId, startDate, endDate, renterName);
  const booking = db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(booking);
});

export default router;
export { findOverlap };

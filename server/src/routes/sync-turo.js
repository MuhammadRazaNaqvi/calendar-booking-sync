import { Router } from "express";
import nodeIcal from "node-ical";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(__dirname, "..", "..", "fixtures", "turo-sample.ics");

const router = Router();

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

router.post("/:id/sync-turo", async (req, res) => {
  const vehicleId = req.params.id;
  const vehicle = db.prepare("SELECT * FROM vehicles WHERE id = ?").get(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const events = Object.values(await nodeIcal.async.parseFile(FIXTURE_PATH)).filter(
    (item) => item.type === "VEVENT"
  );

  const findByUid = db.prepare(
    "SELECT * FROM bookings WHERE vehicle_id = ? AND external_uid = ?"
  );
  const findDirectBookings = db.prepare(
    "SELECT * FROM bookings WHERE vehicle_id = ? AND source = 'direct'"
  );
  const insertTuro = db.prepare(`
    INSERT INTO bookings (vehicle_id, source, start_date, end_date, renter_name, status, external_uid)
    VALUES (?, 'turo', ?, ?, 'Turo guest', ?, ?)
  `);
  const flagBooking = db.prepare("UPDATE bookings SET status = 'flagged_conflict' WHERE id = ?");

  const imported = [];
  const conflicts = [];
  let skipped = 0;

  for (const event of events) {
    if (findByUid.get(vehicleId, event.uid)) {
      skipped += 1;
      continue;
    }

    const startDate = toDateOnly(event.start);
    const endDate = toDateOnly(event.end);

    const conflictingBooking = findDirectBookings
      .all(vehicleId)
      .find((booking) => startDate < booking.end_date && booking.start_date < endDate);

    const status = conflictingBooking ? "flagged_conflict" : "confirmed";
    const result = insertTuro.run(vehicleId, startDate, endDate, status, event.uid);

    if (conflictingBooking) {
      flagBooking.run(conflictingBooking.id);
      conflicts.push({
        turoBookingId: result.lastInsertRowid,
        conflictingBooking,
      });
    }

    imported.push(db.prepare("SELECT * FROM bookings WHERE id = ?").get(result.lastInsertRowid));
  }

  res.json({ imported, skipped, conflicts });
});

export default router;

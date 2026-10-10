import { db } from "./db.js";
import { syncTuroBookings } from "./turo.js";
import { pathToFileURL } from "node:url";

function addDays(baseDate, daysToAdd) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

function toDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function seedDemo() {
  return db.transaction(() => {
    const demoVehicles = [
      { model: "Tesla Model 3", plate: "7JKL021", color: "Pearl White", seats: 5, type: "Electric", photo: "photo-1560958089-b8a1929cea89", direct: "Alex Rivera", trip: "Maya Patel | Trip TR-1001", start: 5, turoStart: 12 },
      { model: "Jeep Wrangler", plate: "4MNO582", color: "Granite Crystal", seats: 4, type: "Gas", photo: "photo-1533473359331-0135ef1b58bf", direct: "Sam Carter", trip: "Daniel Brooks | Trip TR-1002", start: 10, turoStart: 16 },
      { model: "BMW 3 Series", plate: "8BMW314", color: "Alpine White", seats: 5, type: "Gas", photo: "photo-1555215695-3004980ad54e", direct: "Olivia Chen", trip: "Ethan Williams | Trip TR-1003", start: 6, turoStart: 13 },
      { model: "Ford Mustang", plate: "6FRD902", color: "Race Red", seats: 4, type: "Gas", photo: "photo-1533106418989-88406c7cc8ca", direct: "Noah Bennett", trip: "Sofia Ramirez | Trip TR-1004", start: 7, turoStart: 14 },
      { model: "Mercedes-Benz C-Class", plate: "5MBZ720", color: "Obsidian Black", seats: 5, type: "Gas", photo: "photo-1618843479313-40f8afb4b4d8", direct: "Grace Kim", trip: "Lucas Martin | Trip TR-1005", start: 8, turoStart: 15 },
    ];
    const insertVehicle = db.prepare("INSERT INTO vehicles (name, make_model, plate, color, seats, vehicle_type, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const insertBooking = db.prepare("INSERT INTO bookings (vehicle_id, source, start_date, end_date, renter_name) VALUES (?, 'direct', ?, ?, ?)");
    const insertMock = db.prepare("INSERT OR IGNORE INTO mock_turo_events (uid, vehicle_id, start_date, end_date, renter_name) VALUES (?, ?, ?, ?, ?)");
    const emptyBookings = db.prepare("SELECT COUNT(*) AS count FROM bookings").get().count === 0;
    const today = new Date();
    for (const [index, details] of demoVehicles.entries()) {
      let vehicle = db.prepare("SELECT id FROM vehicles WHERE plate = ?").get(details.plate);
      const isNew = !vehicle;
      if (isNew) {
        const result = insertVehicle.run(`Fleet Car ${index + 1}`, details.model, details.plate, details.color, details.seats, details.type, `https://images.unsplash.com/${details.photo}?auto=format&fit=crop&w=600&q=70`);
        vehicle = { id: result.lastInsertRowid };
      }
      const uid = `mock-turo-baseline-${vehicle.id}`;
      db.prepare("UPDATE mock_turo_events SET renter_name = ? WHERE uid = ? AND renter_name = 'Turo guest'").run(details.trip, uid);
      db.prepare("UPDATE bookings SET renter_name = ? WHERE vehicle_id = ? AND source = 'turo' AND external_uid = ? AND renter_name = 'Turo guest'").run(details.trip, vehicle.id, uid);
      if (isNew || emptyBookings) {
        insertBooking.run(vehicle.id, toDateOnly(addDays(today, details.start)), toDateOnly(addDays(today, details.start + 3)), details.direct);
        insertMock.run(uid, vehicle.id, toDateOnly(addDays(today, details.turoStart)), toDateOnly(addDays(today, details.turoStart + 3)), details.trip);
        syncTuroBookings(vehicle.id);
      }
    }
    console.log("Demo fleet ready: 5 vehicles with named direct reservations and Turo trips. Existing bookings preserved.");
  })();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  seedDemo();
  db.close();
}

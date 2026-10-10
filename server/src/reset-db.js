import { db } from "./db.js";
import { seedDemo } from "./seed.js";

db.transaction(() => {
  db.exec("DELETE FROM mock_turo_events; DELETE FROM bookings; DELETE FROM vehicles; DELETE FROM sqlite_sequence WHERE name IN ('vehicles', 'bookings');");
  seedDemo();
})();
console.log("Reset all bookings and mock Turo events to the demo baseline.");
db.close();

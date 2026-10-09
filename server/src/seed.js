import { db } from "./db.js";

const { count } = db.prepare("SELECT COUNT(*) AS count FROM vehicles").get();

if (count === 0) {
  const insert = db.prepare(
    `INSERT INTO vehicles (name, make_model, plate, color, seats, vehicle_type, photo_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  insert.run(
    "Fleet Car 1",
    "Tesla Model 3",
    "7JKL021",
    "Pearl White",
    5,
    "Electric",
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=600&q=70"
  );
  insert.run(
    "Fleet Car 2",
    "Jeep Wrangler",
    "4MNO582",
    "Granite Crystal",
    4,
    "Gas",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=70"
  );
  console.log("Seeded 2 vehicles.");
} else {
  console.log(`Vehicles table already has ${count} row(s), skipping seed.`);
}

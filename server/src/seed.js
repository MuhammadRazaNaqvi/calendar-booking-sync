import { db } from "./db.js";

const { count } = db.prepare("SELECT COUNT(*) AS count FROM vehicles").get();

if (count === 0) {
  const insert = db.prepare(
    "INSERT INTO vehicles (name, make_model) VALUES (?, ?)"
  );
  insert.run("Fleet Car 1", "Toyota Camry 2022");
  insert.run("Fleet Car 2", "Honda CR-V 2023");
  console.log("Seeded 2 vehicles.");
} else {
  console.log(`Vehicles table already has ${count} row(s), skipping seed.`);
}
